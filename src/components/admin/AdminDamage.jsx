import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Corrected import
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DamageReportDetailModal from "./DamageReportDetailModal";

const EMPTY = {
  heritage_site_name: "", 
  damage_level: "",
  description: "", 
  reported_by: "", 
  date_of_damage: new Date().toISOString().split("T")[0],
  image_url: "", 
  status: "Pending Review"
};

const DAMAGE_LEVELS = [
  "Cracks on Walls or Floors",
  "Roof Damage or Collapse",
  "Foundation Deterioration",
  "Structural Instability",
  "Flooding or Water Damage",
  "Mold or Biological Growth",
  "Graffiti or Vandalism",
  "Artifact or Relic Loss",
  "Fire Damage",
  "Debris or Overgrowth",
  "Partial Collapse",
  "Near-Total Destruction",
  "Other",
];
const STATUSES = ["Pending Review", "Verified", "Under Restoration", "Restored", "Closed"];

export default function AdminDamage() {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
      .order("created_date", { ascending: false });
    
    if (error) {
      console.error("Error loading reports:", error);
    } else {
      setReports(data || []);
    }
  };

  useEffect(() => { load(); }, []);

  const f = (field) => e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const fs = (field) => v => setForm(prev => ({ ...prev, [field]: v }));

  const save = async () => {
    if (!form.heritage_site_name || !form.damage_level || !form.date_of_damage) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("damage_reports")
      .insert([form]);

    if (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report.");
    } else {
      setForm(EMPTY);
      setShowForm(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id) => {
    const { error } = await supabase
      .from("damage_reports")
      .delete()
      .eq("id", id);
      
    if (error) console.error("Error deleting:", error);
    else load();
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("damage_reports")
      .update({ status })
      .eq("id", id);
      
    if (error) console.error("Error updating status:", error);
    else load();
  };

  const STATUS_COLORS = {
    "Pending Review": "text-yellow-400", "Verified": "text-blue-400",
    "Under Restoration": "text-amber-400", "Restored": "text-green-400", "Closed": "text-gray-400"
  };

  const SECTION_CONFIG = [
    { key: "Pending Review",    label: "Pending Review",    color: "text-yellow-400",  border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400" },
    { key: "Verified",          label: "Verified",          color: "text-blue-400",    border: "border-blue-500/30",   badge: "bg-blue-500/20 text-blue-400" },
    { key: "Under Restoration", label: "Under Restoration", color: "text-amber-400",   border: "border-amber-500/30",  badge: "bg-amber-500/20 text-amber-400" },
    { key: "Restored",          label: "Restored",          color: "text-green-400",   border: "border-green-500/30",  badge: "bg-green-500/20 text-green-400" },
    { key: "Closed",            label: "Closed",            color: "text-gray-400",    border: "border-border",        badge: "bg-gray-500/20 text-gray-400" },
  ];

  const pending = reports.filter(r => r.status === "Pending Review");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{reports.length} total reports</p>
          {pending.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 rounded-full px-2.5 py-1 font-medium">
              {pending.length} pending review
            </span>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Report
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Log Damage Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Heritage site name *" value={form.heritage_site_name} onChange={f("heritage_site_name")} className="bg-muted border-border text-foreground" />
            <Select value={form.damage_level} onValueChange={fs("damage_level")}>
              <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue placeholder="Damage level *" /></SelectTrigger>
              <SelectContent>{DAMAGE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={form.date_of_damage} onChange={f("date_of_damage")} className="bg-muted border-border text-foreground" />
            <Input placeholder="Reported by" value={form.reported_by} onChange={f("reported_by")} className="bg-muted border-border text-foreground" />
          </div>
          <Textarea placeholder="Damage description" value={form.description} onChange={f("description")} className="bg-muted border-border text-foreground min-h-[80px]" />
          <Input placeholder="Damage photo URL" value={form.image_url} onChange={f("image_url")} className="bg-muted border-border text-foreground" />
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.heritage_site_name || !form.damage_level} className="flex-1">
              {saving ? "Saving..." : "Log Report"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Grouped by Status Sections */}
      {SECTION_CONFIG.map(section => {
        const sectionReports = reports.filter(r => r.status === section.key);
        if (sectionReports.length === 0) return null;
        return (
          <div key={section.key}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${section.color}`}>
              {section.label} ({sectionReports.length})
            </p>
            <div className="space-y-2">
              {sectionReports.map(r => (
                <div key={r.id} className={`bg-card border ${section.border} rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => setSelectedReport(r)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{r.heritage_site_name}</p>
                        {r.reported_by && (
                          <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                            👤 {r.reported_by}
                          </span>
                        )}
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${section.badge}`}>{section.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.damage_level} • {r.date_of_damage}</p>
                      {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {section.key === "Pending Review" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10" onClick={() => updateStatus(r.id, "Verified")}>
                          <CheckCircle className="w-3 h-3" /> Verify
                        </Button>
                      )}
                      <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                        <SelectTrigger className={`w-36 h-7 text-xs bg-muted border-border ${STATUS_COLORS[r.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {selectedReport && (
        <DamageReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusChange={(id, status) => { updateStatus(id, status); setSelectedReport(prev => ({ ...prev, status })); }}
          onDelete={(id) => { remove(id); setSelectedReport(null); }}
        />
      )}
    </div>
  );
}