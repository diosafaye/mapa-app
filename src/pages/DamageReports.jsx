import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { FileText, Clock, CheckCircle, TrendingUp, Flag, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ReportDamageModal from "../components/ReportDamageModal";

const DAMAGE_COLORS = {
  "None": "#10b981",
  "Minor": "#84cc16",
  "Moderate": "#f59e0b",
  "Severe": "#ef4444",
  "Total Loss": "#7c3aed",
};

const STATUS_CONFIG = {
  "Pending Review": "bg-yellow-500/20 text-yellow-400",
  "Verified": "bg-blue-500/20 text-blue-400",
  "Under Restoration": "bg-amber-500/20 text-amber-400",
  "Restored": "bg-green-500/20 text-green-400",
  "Closed": "bg-gray-500/20 text-gray-400",
};

export default function DamageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // 1. Optimized Fetching with Server-Side Filtering
  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("damage_reports")
        .select("*")
        .in("status", ["Verified", "Under Restoration"]) // Filter at the database level
        .order("created_date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching damage reports:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Real-time Subscription (Matching your AlertsPage logic)
  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('public:damage_reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'damage_reports' }, 
        () => fetchReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  // 3. Memoized Chart Data (Prevents recalculation on every render)
  const chartData = useMemo(() => {
    const damageByType = reports.reduce((acc, r) => {
      const key = r.damage_level || "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(damageByType).map(([name, count]) => ({ name, count }));
  }, [reports]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">Damage Reports</h1>
            <p className="text-muted-foreground text-sm">Verified and active damage records for Bohol heritage sites</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold hover:bg-destructive/20 transition-all active:scale-95 self-start sm:self-auto shadow-sm"
          >
            <Flag className="w-4 h-4" /> Report Damage
          </button>
        </div>

        {/* Stats Section with Consistent Styling */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm">
            <p className="text-3xl font-black text-foreground">{reports.filter(r => r.status === "Verified").length}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">Verified</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm">
            <p className="text-3xl font-black text-amber-500">{reports.filter(r => r.status === "Under Restoration").length}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">In Restoration</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-sm hidden md:block">
            <p className="text-3xl font-black text-primary">{reports.length}</p>
            <p className="text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">Total Active</p>
          </div>
        </div>

        {/* Analytics Chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-sm">
            <h2 className="text-xs font-black text-muted-foreground mb-6 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-primary" /> Severity Distribution
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={DAMAGE_COLORS[entry.name] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Showing {reports.length} Verified Records
          </p>
        </div>

        {/* Reports Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Syncing Records...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-muted/20">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-base font-bold text-foreground">No damage reports found</p>
            <p className="text-xs text-muted-foreground mt-1">Heritage sites appear to be in stable condition.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-card border border-border rounded-3xl p-6 transition-all hover:shadow-md group">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-foreground">{report.heritage_site_name}</span>
                      <span className={`text-[10px] rounded-full px-3 py-1 font-black flex items-center gap-1.5 shadow-sm ${STATUS_CONFIG[report.status] || "bg-muted text-muted-foreground"}`}>
                        <CheckCircle className="w-3 h-3" /> {report.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: DAMAGE_COLORS[report.damage_level] }} 
                      />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {report.damage_level} Severity
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic font-medium border-l-2 border-primary/20 pl-4">
                        "{report.description}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {new Date(report.date_of_damage).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.reported_by && <span className="flex items-center gap-1.5">👤 {report.reported_by}</span>}
                    </div>
                  </div>
                  
                  {report.image_url && (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={report.image_url} 
                        alt="Damage evidence" 
                        className="w-full md:w-32 h-32 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReportModal && (
        <ReportDamageModal onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}