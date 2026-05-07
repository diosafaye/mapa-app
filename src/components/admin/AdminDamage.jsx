import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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
  "Cracks on Walls or Floors", "Roof Damage or Collapse", "Foundation Deterioration",
  "Structural Instability", "Flooding or Water Damage", "Mold or Biological Growth",
  "Graffiti or Vandalism", "Artifact or Relic Loss", "Fire Damage",
  "Debris or Overgrowth", "Partial Collapse", "Near-Total Destruction", "Other",
];

const STATUSES = ["Pending Review", "Verified", "Under Restoration", "Restored", "Closed"];

export default function AdminDamage() {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // 1. Memoized Loader for re-use in Realtime
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("damage_reports")
      .select("*")
      .order("created_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to sync reports");
    } else {
      setReports(data || []);
    }
    setLoading(false);
  }, []);

  // 2. Realtime Subscription
  useEffect(() => {
    load();
    const channel = supabase
      .channel('damage_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'damage_reports' }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  const save = async () => {
    if (!form.heritage_site_name || !form.damage_level) {
      toast.error("Site name and damage level are required");
      return;
    }
    
    setSaving(true);
    const { error } = await supabase.from("damage_reports").insert([form]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Damage report logged");
      setForm(EMPTY);
      setShowForm(false);
    }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("session when updating:", session);  // ✅ add this
  
  const { error } = await supabase
    .from("damage_reports")
    .update({ status })
    .eq("id", id);
    
  if (error) {
    console.log("update error:", error);  // ✅ add this
    toast.error("Update failed");
  } else {
    toast.success(`Status updated to ${status}`);
  }
};

  const remove = async (id) => {
    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    const { error } = await supabase.from("damage_reports").delete().eq("id", id);
    if (error) toast.error("Delete failed");
  };

  const SECTION_CONFIG = [
    { key: "Pending Review", label: "Pending", color: "text-yellow-500", border: "border-yellow-500/20", bg: "bg-yellow-500/5" },
    { key: "Verified", label: "Verified", color: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/5" },
    { key: "Under Restoration", label: "Restoring", color: "text-amber-600", border: "border-amber-500/20", bg: "bg-amber-500/5" },
    { key: "Restored", label: "Restored", color: "text-green-600", border: "border-green-500/20", bg: "bg-green-500/5" },
    { key: "Closed", label: "Closed", color: "text-slate-400", border: "border-slate-200", bg: "bg-slate-50" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-foreground tracking-tight">Damage Assessment</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">
            {reports.filter(r => r.status === "Pending Review").length} reports awaiting verification
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Log New Report
        </Button>
      </div>

      {/* Optimized Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              placeholder="Heritage Site Name *" 
              value={form.heritage_site_name} 
              onChange={e => setForm({...form, heritage_site_name: e.target.value})} 
              className="bg-muted/50 rounded-xl"
            />
            <Select value={form.damage_level} onValueChange={v => setForm({...form, damage_level: v})}>
              <SelectTrigger className="bg-muted/50 rounded-xl"><SelectValue placeholder="Damage Level *" /></SelectTrigger>
              <SelectContent>
                {DAMAGE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input 
              type="date" 
              value={form.date_of_damage} 
              onChange={e => setForm({...form, date_of_damage: e.target.value})} 
              className="bg-muted/50 rounded-xl"
            />
            <Input 
              placeholder="Reported By (Officer/Citizen)" 
              value={form.reported_by} 
              onChange={e => setForm({...form, reported_by: e.target.value})} 
              className="bg-muted/50 rounded-xl"
            />
          </div>
          <Textarea 
            placeholder="Detailed description of structural damage..." 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
            className="bg-muted/50 min-h-[100px] rounded-xl"
          />
          <Input 
            placeholder="Reference Photo URL" 
            value={form.image_url} 
            onChange={e => setForm({...form, image_url: e.target.value})} 
            className="bg-muted/50 rounded-xl"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="flex-1 rounded-xl">
              {saving ? "Processing..." : "Commit Report"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Grouped Reports */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Clock className="w-8 h-8 animate-spin mb-4 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">Syncing with Registry...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {SECTION_CONFIG.map(section => {
            const sectionReports = reports.filter(r => r.status === section.key);
            if (sectionReports.length === 0) return null;
            return (
              <div key={section.key} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={`w-2 h-2 rounded-full ${section.color.replace('text', 'bg')}`} />
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${section.color}`}>
                    {section.label} ({sectionReports.length})
                  </p>
                </div>

                <div className="grid gap-3">
                  {sectionReports.map(r => (
                    <div 
                      key={r.id} 
                      className={`group bg-card border ${section.border} ${section.bg} rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md`} 
                      onClick={() => setSelectedReport(r)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{r.heritage_site_name}</h4>
                            {r.damage_level.includes("Destruction") && (
                              <AlertCircle className="w-3 h-3 text-destructive animate-pulse" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              <ImageIcon className="w-3 h-3" /> {r.damage_level}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" /> {r.date_of_damage}
                            </span>
                            {r.reported_by && (
                              <span className="text-[10px] font-bold text-primary/70 uppercase">
                                By: {r.reported_by}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {section.key === "Pending Review" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-[10px] font-bold uppercase tracking-tight border-blue-500/30 text-blue-600 hover:bg-blue-50"
                              onClick={() => updateStatus(r.id, "Verified")}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Verify
                            </Button>
                          )}
                          
                          <div className="flex items-center gap-1 bg-background/50 border rounded-lg p-1">
                            <select 
                              value={r.status} 
                              onChange={(e) => updateStatus(r.id, e.target.value)}
                              className="text-[10px] font-bold bg-transparent border-none focus:ring-0 uppercase px-2 cursor-pointer"
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button 
                              onClick={() => remove(r.id)} 
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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