/**
 * Offline Sync Utility
 * Manages local storage buffering and database synchronization.
 */

// --- 1. Storage Helpers ---

export function getBufferedReports() {
  try {
    const data = localStorage.getItem("bufferedReports");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error parsing buffered reports:", e);
    return [];
  }
}

export function bufferDamageReport(reportData) {
  try {
    const buffered = getBufferedReports();
    buffered.push({
      ...reportData,
      // Generate a unique ID for client-side tracking
      id: typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bufferedAt: new Date().toISOString(),
    });
    localStorage.setItem("bufferedReports", JSON.stringify(buffered));
  } catch (e) {
    console.error("Error buffering report:", e);
  }
}

export function clearBufferedReports() {
  localStorage.removeItem("bufferedReports");
}

// --- 2. Sync Logic ---

/**
 * Synchronizes buffered reports to Supabase.
 * @param {object} supabase - The authenticated Supabase client instance.
 * @returns {Promise<object>} - Results of the sync process.
 */
export async function syncBufferedReports(supabase) {
  const reports = getBufferedReports();
  if (reports.length === 0) return { success: true, synced: 0, remaining: 0 };

  const remainingReports = [];
  let successCount = 0;

  for (const report of reports) {
    try {
      // Clean data: remove client-side metadata before sending to DB
      const { bufferedAt, ...reportPayload } = report;

      const { error } = await supabase
        .from("damage_reports")
        .insert([reportPayload]);

      if (error) throw error;
      successCount++;
    } catch (err) {
      console.error(`Sync failed for report ID: ${report.id}`, err);
      // If one fails, keep it in the buffer for the next retry
      remainingReports.push(report);
    }
  }

  // Update storage with only the items that failed to sync
  if (remainingReports.length > 0) {
    localStorage.setItem("bufferedReports", JSON.stringify(remainingReports));
  } else {
    clearBufferedReports();
  }

  return { success: true, synced: successCount, remaining: remainingReports.length };
}