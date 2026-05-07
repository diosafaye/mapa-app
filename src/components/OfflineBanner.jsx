import { WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient"; // Ensure this points to your client

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline && !syncing) {
      const bufferedReports = JSON.parse(localStorage.getItem("bufferedReports") || "[]");
      if (bufferedReports.length > 0) {
        syncBufferedReports(bufferedReports);
      }
    }
  }, [isOnline]);

  const syncBufferedReports = async (reports) => {
    setSyncing(true);
    try {
      for (const report of reports) {
        // Replace with your actual Supabase table name
        const { error } = await supabase.from('damage_reports').insert(report);
        if (error) throw error;
      }
      localStorage.removeItem("bufferedReports");
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && !syncing) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-3">
      {syncing ? (
        <>
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-sm font-medium text-amber-600">Syncing offline reports...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-600">
            Offline Mode — Reports will sync when connection returns
          </span>
        </>
      )}
    </div>
  );
}