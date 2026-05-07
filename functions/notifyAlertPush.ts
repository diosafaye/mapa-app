import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== "create") {
      return Response.json({ skipped: true, message: "Not a create event" });
    }

    const alert = data;
    if (!alert?.is_active) {
      return Response.json({ skipped: "Alert not active" });
    }


    const { error: insertError } = await supabase
      .from('push_notifications')
      .insert({
        title: `⚠️ ${alert.severity}: ${alert.disaster_type}`,
        body: alert.description || `${alert.disaster_type} alert affecting ${alert.affected_towns?.join(", ") || "Bohol"}`,
        alert_id: alert.id || "",
        severity: alert.severity || "Advisory",
        is_delivered: false
      });

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error(`Failed to create notification: ${insertError.message}`);
    }

    return Response.json({ success: true, message: "Push notification queued" });

  } catch (error) {
    console.error("Push notify error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    );
  }
});

