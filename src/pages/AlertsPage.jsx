import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient"; 
import { AlertTriangle, Clock, MapPin, Shield, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEVERITY_CONFIG = {
  "Advisory": { border: "border-blue-500/30", bg: "bg-blue-500/5", badge: "bg-blue-500/20 text-blue-400", dot: "bg-blue-400" },
  "Watch": { border: "border-amber-500/30", bg: "bg-amber-500/5", badge: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
  "Warning": { border: "border-red-500/30", bg: "bg-red-500/5", badge: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
  "Critical Emergency": { border: "border-purple-500/30", bg: "bg-purple-500/5", badge: "bg-purple-500/20 text-purple-400", dot: "bg-purple-400" },
};

const DISASTER_EMOJI = {
  "Typhoon": "🌀", "Flooding": "🌊", "Landslide": "⛰️", "Earthquake": "🌍",
  "Storm Surge": "🌊", "Volcanic Activity": "🌋", "Fire": "🔥", "Other": "⚠️"
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("active");

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('disaster_alerts')
        .select('*')
        .order('started_at', { ascending: false }); // Updated to started_at

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('public:disaster_alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'disaster_alerts' }, 
        () => fetchAlerts()
      )
      .subscribe((status) => {
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
           fetchAlerts();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      // Updated to match your fetchPagasaAlerts.ts function name
      const { error } = await supabase.functions.invoke("fetchPagasaAlerts");
      if (error) throw error;
      
      await new Promise(r => setTimeout(r, 1200));
      await fetchAlerts();
    } catch (err) {
      console.error("Sync failed:", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = alerts.filter(a =>
    filter === "all" ? true : filter === "active" ? a.is_active : !a.is_active
  );

  const activeCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">DRRM Alerts</h1>
            <p className="text-muted-foreground text-sm">Disaster Risk Reduction and Management — active alerts for Bohol heritage areas</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualSync}
            disabled={refreshing}
            className="gap-2 border-primary/20 hover:bg-primary/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Syncing..." : "Sync PAGASA"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-destructive">{activeCount}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">Active Alerts</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-foreground">{alerts.length}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">Archive</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-primary">{alerts.filter(a => !a.is_active).length}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">Resolved</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {["active", "resolved", "all"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                filter === f ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-muted/30">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary/40" />
            <p className="text-base font-bold text-foreground">No records found</p>
            <p className="text-xs text-muted-foreground mt-1 px-10">Bohol heritage areas are currently safe and monitored.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG["Advisory"];
              return (
                <div key={alert.id} className={`bg-card border ${cfg.border} ${cfg.bg} rounded-3xl p-6 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5 flex-1">
                      <span className="text-4xl flex-shrink-0 bg-background w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-border/50">
                        {DISASTER_EMOJI[alert.disaster_type] || "⚠️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${cfg.badge}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{alert.disaster_type}</span>
                          {!alert.is_active && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-3 py-1 rounded-full font-black">RESOLVED</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-foreground leading-tight mb-2">{alert.title}</h3>
                        {alert.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{alert.description}</p>
                        )}

                        {alert.affected_towns?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-1" />
                            {alert.affected_towns.map(town => (
                              <span key={town} className="text-[10px] bg-background border border-border font-bold rounded-lg px-2.5 py-1 shadow-sm">
                                {town}
                              </span>
                            ))}
                          </div>
                        )}

                        {alert.instructions && (
                          <div className="mt-5 bg-background/60 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-3.5 h-3.5 text-primary" />
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol</p>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed italic font-medium">
                              "{alert.instructions}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border/40">
                          {alert.source && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">📡 {alert.source}</span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                            <Clock className="w-3.5 h-3.5" />
                            {/* Updated to started_at */}
                            {new Date(alert.started_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {alert.is_active && (
                      <div className="flex flex-col items-center gap-2 pt-2">
                        <div className="relative">
                          <div className={`absolute -inset-1 rounded-full ${cfg.dot} blur-sm opacity-50 animate-pulse`} />
                          <div className={`relative w-3 h-3 rounded-full ${cfg.dot} shadow-lg`} />
                        </div>
                        <span className="text-[9px] font-black text-destructive uppercase tracking-widest">Live</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}