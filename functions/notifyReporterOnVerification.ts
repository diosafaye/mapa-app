import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize the Supabase client using environment variables
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Mapping Supabase Webhook payload
    const report = body.record;
    const oldReport = body.old_record;

    // 1. Validation: Only trigger if the status has changed
    if (!report || !oldReport) {
      return Response.json({ skipped: true, reason: "No data received" });
    }

    if (oldReport.status === report.status) {
      return Response.json({ skipped: true, reason: "Status unchanged" });
    }

    // 2. Map the status to your specific messages
    const statusMessages: Record<string, string> = {
      "Verified": `Your damage report for ${report.heritage_site_name} has been verified by the MAPA Bohol team.`,
      "Under Restoration": `The heritage site ${report.heritage_site_name} is now under restoration.`,
      "Restored": `Great news! ${report.heritage_site_name} has been restored.`,
      "Closed": `Your damage report for ${report.heritage_site_name} has been closed.`,
    };

    const message = statusMessages[report.status];
    
    if (!message) {
      return Response.json({ skipped: true, reason: "Status not configured for notifications" });
    }

    // 3. Insert into your push_notifications table
    const { error: insertError } = await supabase
      .from('push_notifications') 
      .insert({
        title: `Report Update: ${report.status}`,
        body: message,
        alert_id: report.id, 
        severity: report.status === "Verified" ? "Watch" : "Advisory",
        is_delivered: false,
      });

    if (insertError) throw insertError;

    return Response.json({ created: true, status: report.status });

  } catch (error) {
    console.error("Function Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});