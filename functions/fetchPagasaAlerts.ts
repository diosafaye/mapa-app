import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const genAI = new GoogleGenerativeAI(Deno.env.get("GOOGLE_API_KEY")!);

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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [{ googleSearch: {} }],
    });

    const today = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila'
    });

    const prompt = `
      Today is ${today}. Search the web right now for active PAGASA and NDRRMC disaster alerts, 
      typhoon bulletins, flood advisories, and weather warnings for Bohol province, Philippines.
      
      Check these sources:
      - bagong.pagasa.dost.gov.ph
      - ndrrmc.gov.ph
      - Current typhoon bulletins
      - Active flood and landslide advisories
      
      Return ONLY a valid JSON object with an "alerts" array. Each alert must have:
      - title: string (official alert title)
      - disaster_type: string (Typhoon, Flood, Landslide, Earthquake, Storm Surge, Fire, or Other)
      - severity: string (Advisory, Watch, Warning, or Critical Emergency)
      - affected_towns: array of strings (only towns from this list: ${boholTowns.join(",")})
      - description: string (what is happening)
      - instructions: string (what people should do)
      - source: string (PAGASA, NDRRMC, etc.)
      
      If no active alerts affect Bohol today, return {"alerts":[]}.
      Return only the JSON, no other text.
    `;

    const response = await model.generateContent(prompt);
    const rawText = response.response.text();

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    const fetchedAlerts = result?.alerts || [];
    console.log(`Got ${fetchedAlerts.length} alerts from web search`);

    const { data: existing, error: fetchError } = await supabase
      .from('disaster_alerts')
      .select('*')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (fetchedAlerts.length === 0) {
      const autoAlerts = (existing || []).filter(a => a.source && a.source !== "Manual");
      for (const a of autoAlerts) {
        await supabase
          .from('disaster_alerts')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('id', a.id);
      }
      return new Response(
        JSON.stringify({ message: "No active alerts for Bohol.", cleared: autoAlerts.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  // ✅
      );
    }

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  // ✅
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  // ✅
    );
  }
});