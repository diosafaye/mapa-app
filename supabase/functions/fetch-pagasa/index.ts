import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const boholTowns = ["Tagbilaran","Alburquerque","Alicia","Anda","Antequera","Baclayon","Balilihan","Batuan","Bilar","Buenavista","Calape","Candijay","Carmen","Catigbian","Clarin","Corella","Cortes","Dagohoy","Danao","Dauis","Dimiao","Duero","Garcia Hernandez","Getafe","Guindulman","Inabanga","Jagna","Lila","Loay","Loboc","Loon","Mabini","Maribojoc","Panglao","Pilar","Sagbayan","San Isidro","San Miguel","Sevilla","Sierra Bullones","Sikatuna","Talibon","Trinidad","Tubigon","Ubay","Valencia"];

    const fetchedAlerts = [];

    // ✅ Scrape PAGASA weather bulletins page
    try {
      const pagasaRes = await fetch("https://bagong.pagasa.dost.gov.ph/tropical-cyclone/public-storm-warning-signal", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BoholHeritageScraper/1.0)" }
      });
      const pagasaHtml = await pagasaRes.text();

      // Check if Bohol is mentioned in the bulletin
      const boholMentioned = boholTowns.some(town => 
        pagasaHtml.toLowerCase().includes(town.toLowerCase())
      );

      if (boholMentioned) {
        // Extract signal level from page
        const signalMatch = pagasaHtml.match(/Signal\s+No\.?\s*(\d)/i);
        const signalLevel = signalMatch ? parseInt(signalMatch[1]) : 1;

        const severity = signalLevel >= 3 ? "Critical Emergency" :
                        signalLevel === 2 ? "Warning" :
                        signalLevel === 1 ? "Watch" : "Advisory";

        // Find which towns are affected
        const affectedTowns = boholTowns.filter(town =>
          pagasaHtml.toLowerCase().includes(town.toLowerCase())
        );

        fetchedAlerts.push({
          title: `Tropical Cyclone Warning Signal No. ${signalLevel} — Bohol`,
          disaster_type: "Typhoon",
          severity,
          affected_towns: affectedTowns,
          description: `PAGASA has placed parts of Bohol under Signal No. ${signalLevel}. Monitor official PAGASA bulletins for updates.`,
          instructions: signalLevel >= 2
            ? "Evacuate low-lying and coastal areas. Secure properties. Follow LGU instructions."
            : "Stay indoors. Monitor PAGASA updates. Prepare emergency kit.",
          source: "PAGASA"
        });
      }
    } catch (e) {
      console.error("PAGASA cyclone scrape failed:", e.message);
    }

    // ✅ Scrape PAGASA flood advisories
    try {
      const floodRes = await fetch("https://bagong.pagasa.dost.gov.ph/flood-advisory", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BoholHeritageScraper/1.0)" }
      });
      const floodHtml = await floodRes.text();

      const boholMentioned = boholTowns.some(town =>
        floodHtml.toLowerCase().includes(town.toLowerCase())
      );

      if (boholMentioned) {
        const affectedTowns = boholTowns.filter(town =>
          floodHtml.toLowerCase().includes(town.toLowerCase())
        );

        fetchedAlerts.push({
          title: "Flood Advisory — Bohol Province",
          disaster_type: "Flood",
          severity: "Warning",
          affected_towns: affectedTowns,
          description: "PAGASA has issued a flood advisory affecting parts of Bohol. Rivers may overflow.",
          instructions: "Avoid river banks and low-lying areas. Move valuables to higher ground. Monitor water levels.",
          source: "PAGASA"
        });
      }
    } catch (e) {
      console.error("PAGASA flood scrape failed:", e.message);
    }

    // ✅ Scrape NDRRMC advisories
    try {
      const ndrrmcRes = await fetch("https://ndrrmc.gov.ph/attachments/article/", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BoholHeritageScraper/1.0)" }
      });
      const ndrrmcHtml = await ndrrmcRes.text();

      const boholMentioned = boholTowns.some(town =>
        ndrrmcHtml.toLowerCase().includes(town.toLowerCase())
      );

      if (boholMentioned) {
        const affectedTowns = boholTowns.filter(town =>
          ndrrmcHtml.toLowerCase().includes(town.toLowerCase())
        );

        fetchedAlerts.push({
          title: "NDRRMC Advisory — Bohol",
          disaster_type: "Other",
          severity: "Advisory",
          affected_towns: affectedTowns,
          description: "NDRRMC has issued an advisory affecting parts of Bohol.",
          instructions: "Follow local government advisories and stay informed.",
          source: "NDRRMC"
        });
      }
    } catch (e) {
      console.error("NDRRMC scrape failed:", e.message);
    }

    console.log(`Found ${fetchedAlerts.length} alerts affecting Bohol`);

    // ✅ Database operations
    const { data: existing, error: fetchError } = await supabase
      .from('disaster_alerts')
      .select('*')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (fetchedAlerts.length === 0) {
      // Deactivate old auto alerts if no active ones found
      const autoAlerts = (existing || []).filter(a => a.source && a.source !== "Manual");
      for (const a of autoAlerts) {
        await supabase
          .from('disaster_alerts')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('id', a.id);
      }
      return new Response(
        JSON.stringify({ message: "No active alerts for Bohol.", cleared: autoAlerts.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new alerts
    const existingTypes = (existing || []).map(a => a.disaster_type);
    let created = 0;

    for (const alert of fetchedAlerts) {
      if (existingTypes.includes(alert.disaster_type)) continue;

      await supabase.from('disaster_alerts').insert({
        title: alert.title,
        disaster_type: alert.disaster_type || "Other",
        severity: alert.severity || "Advisory",
        affected_towns: alert.affected_towns || [],
        description: alert.description || "",
        instructions: alert.instructions || "Follow local government advisories.",
        source: alert.source || "PAGASA",
        is_active: true,
        started_at: new Date().toISOString()
      });
      created++;
    }

    return new Response(
      JSON.stringify({ message: `Created ${created} new alerts.`, created }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});