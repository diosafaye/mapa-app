import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Switched from base44Client
import { AlertTriangle, Clock, MapPin, Shield, CheckCircle } from "lucide-react";

// Severity and Emoji configs remain identical to original
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
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetchAlerts();

    // Supabase Real-time subscription replaces base44.subscribe
    const channel = supabase
      .channel('public:disaster_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disaster_alerts' }, payload => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('disaster_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const filtered = alerts.filter(a =>
    filter === "all" ? true : filter === "active" ? a.is_active : !a.is_active
  );

  const activeCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">DRRM Alerts</h1>
          <p className="text-muted-foreground text-sm">Disaster Risk Reduction and Management — active alerts for Bohol heritage areas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{activeCount}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Active Alerts</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{alerts.length}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Total History</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{alerts.filter(a => !a.is_active).length}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Resolved</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["active", "resolved", "all"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors capitalize ${
                filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary/30" />
            <p className="text-base font-medium text-foreground">
              {filter === "active" ? "No active alerts" : "No records found"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All heritage areas are currently monitored and safe</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG["Advisory"];
              return (
                <div key={alert.id} className={`bg-card border ${cfg.border} ${cfg.bg} rounded-2xl p-5 transition-all shadow-sm`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-3xl flex-shrink-0 bg-background w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                        {DISASTER_EMOJI[alert.disaster_type] || "⚠️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{alert.disaster_type}</span>
                          {!alert.is_active && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">RESOLVED</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-foreground leading-tight">{alert.title}</h3>
                        {alert.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{alert.description}</p>
                        )}

                        {/* Affected towns */}
                        {alert.affected_towns?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            {alert.affected_towns.map(town => (
                              <span key={town} className="text-[10px] bg-background border border-border font-bold rounded px-2 py-0.5">{town}</span>
                            ))}
                          </div>
                        )}

                        {/* Instructions */}
                        {alert.instructions && (
                          <div className="mt-4 bg-background/50 rounded-xl p-3 border border-border">
                            <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Safety Instructions</p>
                            <p className="text-xs text-foreground leading-relaxed italic">"{alert.instructions}"</p>
                          </div>
                        )}

                        {/* Source & time */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                          {alert.source && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">📡 {alert.source}</span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {alert.is_active && (
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                        <span className="text-[8px] font-bold text-destructive uppercase">Live</span>
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