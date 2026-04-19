import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Corrected import path
import { FileText, Clock, CheckCircle, TrendingUp, Flag } from "lucide-react";
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

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      // Fetch from Supabase
      const { data, error } = await supabase
        .from("damage_reports")
        .select("*")
        .order("created_date", { ascending: false });

      if (error) {
        console.error("Error fetching damage reports:", error);
      } else {
        // Show Verified and Under Restoration reports publicly
        setReports(data.filter(r => r.status === "Verified" || r.status === "Under Restoration"));
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  // Chart data
  const damageByType = reports.reduce((acc, r) => {
    const key = r.damage_level || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(damageByType).map(([name, count]) => ({ name, count }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">Damage Reports</h1>
            <p className="text-muted-foreground">Verified and active damage records for Bohol heritage sites</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors self-start sm:self-auto"
          >
            <Flag className="w-4 h-4" /> Report Damage
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{reports.filter(r => r.status === "Verified").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Verified</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{reports.filter(r => r.status === "Under Restoration").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Under Restoration</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{reports.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Active</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Reports by Disaster Type
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--primary))`} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{reports.length} active report{reports.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Reports */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No verified damage reports</p>
            <p className="text-sm mt-1">Be the first to report damage at a heritage site</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-foreground">{report.heritage_site_name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{report.damage_level}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: DAMAGE_COLORS[report.damage_level] + "20", color: DAMAGE_COLORS[report.damage_level] }}
                      >
                        {report.damage_level} Damage
                      </span>
                      <span className={`text-xs rounded-full px-2.5 py-1 font-medium flex items-center gap-1 ${STATUS_CONFIG[report.status] || "bg-muted text-muted-foreground"}`}>
                        <CheckCircle className="w-3 h-3" /> {report.status}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{report.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {report.date_of_damage}
                      </span>
                      {report.reported_by && <span>👤 {report.reported_by}</span>}
                    </div>
                  </div>
                  {report.image_url && (
                    <img src={report.image_url} alt="damage" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
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