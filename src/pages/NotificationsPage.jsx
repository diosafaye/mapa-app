import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Bell, FileText, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  "Pending Review": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Verified": "bg-green-500/10 text-green-600 border-green-500/20",
  "Under Restoration": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Restored": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Closed": "bg-slate-500/10 text-slate-600 border-slate-500/20"
};

const STATUS_ICONS = {
  "Pending Review": <Clock className="w-3.5 h-3.5" />,
  "Verified": <CheckCircle2 className="w-3.5 h-3.5" />,
  "Under Restoration": <AlertTriangle className="w-3.5 h-3.5" />,
  "Restored": <CheckCircle2 className="w-3.5 h-3.5" />,
  "Closed": <CheckCircle2 className="w-3.5 h-3.5" />
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("damage_reports")
        .select("*")
        .eq("user_id", user.id) // ✅ only fetch this user's reports
        .order("created_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setDamageReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyReports();

    const realtimeChannel = supabase
      .channel("my-reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "damage_reports" }, () => fetchMyReports())
      .subscribe();

    return () => { supabase.removeChannel(realtimeChannel); };
  }, [fetchMyReports]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-playfair">My Reports</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
          Track the status of your submitted damage reports
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Loading your reports...</span>
          </div>
        ) : damageReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
            <FileText className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No reports submitted yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your submitted damage reports will appear here</p>
          </div>
        ) : (
          damageReports.map(report => (
            <div key={report.id} className="bg-card border border-border rounded-xl p-5 hover:bg-muted/10 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted rounded-lg shadow-inner flex-shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm tracking-tight">{report.heritage_site_name}</h3>
                  <p className="text-xs font-black uppercase text-destructive/80 tracking-widest mt-1">{report.damage_level} damage</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{report.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/50">
                    <Badge className={`text-[10px] font-black uppercase tracking-wider gap-1.5 border py-0.5 px-2 ${STATUS_COLORS[report.status] || ""}`}>
                      {STATUS_ICONS[report.status]}
                      {report.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wide ml-auto">
                      {new Date(report.created_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}