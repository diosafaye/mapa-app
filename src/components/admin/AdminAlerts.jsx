import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient"; // Swapped to Supabase
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOHOL_TOWNS, DISASTER_TYPES, SEVERITY_LEVELS } from "../../data/boholData";

const EMPTY_FORM = {
  title: "", 
  disaster_type: "", 
  severity: "", 
  affected_towns: [],
  description: "", 
  instructions: "", 
  is_active: true, 
  source: "", 
  started_at: ""
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

 
  const load = async () => {
    const { data, error } = await supabase
      .from('disaster_alerts')
      .select('*')
      .order('started_at', { ascending: false });
    
    if (!error && data) setAlerts(data);
  };

  useEffect(() => { load(); }, []);

  const toggleTown = (town) => {
    setForm(f => ({
      ...f,
      affected_towns: f.affected_towns.includes(town)
        ? f.affected_towns.filter(t => t !== town)
        : [...f.affected_towns, town]
    }));
  };

  
  const save = async () => {
    if (!form.title || !form.disaster_type || !form.severity) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('disaster_alerts')
      .insert([{ 
        ...form, 
        started_at: new Date().toISOString() 
      }]);

    if (!error) {
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } else {
      console.error(error);
      alert("Error publishing: " + error.message);
    }
    setSaving(false);
  };

  
  const toggleActive = async (alert) => {
    const { error } = await supabase
      .from('disaster_alerts')
      .update({ is_active: !alert.is_active })
      .eq('id', alert.id);
    
    if (!error) load();
  };

  
  const remove = async (id) => {
    const confirmed = window.confirm("Delete this alert?");
    if (confirmed) {
      const { error } = await supabase
        .from('disaster_alerts')
        .delete()
        .eq('id', id);
      
      if (!error) load();
    }
  };

  const SEVERITY_COLORS = {
    "Advisory": "text-blue-400", "Watch": "text-amber-400",
    "Warning": "text-red-400", "Critical Emergency": "text-purple-400"
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alerts.length} total alerts • {alerts.filter(a => a.is_active).length} active</p>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Alert
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Create Disaster Alert
          </h3>

          <Input
            placeholder="Alert title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="bg-muted border-border text-foreground"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={form.disaster_type} onValueChange={v => setForm(f => ({ ...f, disaster_type: v }))}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Disaster type *" />
              </SelectTrigger>
              <SelectContent>
                {DISASTER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Severity *" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Alert description..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="bg-muted border-border text-foreground min-h-[80px]"
          />

          <Textarea
            placeholder="Safety instructions for the public..."
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            className="bg-muted border-border text-foreground min-h-[60px]"
          />

          <Input
            placeholder="Source (e.g. PAGASA, NDRRMC)"
            value={form.source}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            className="bg-muted border-border text-foreground"
          />

          {/* Town selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Affected Towns ({form.affected_towns.length} selected)
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {BOHOL_TOWNS.map(town => (
                <button
                  key={town}
                  type="button"
                  onClick={() => toggleTown(town)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.affected_towns.includes(town)
                      ? "bg-destructive/20 border-destructive/40 text-destructive"
                      : "bg-muted border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {town}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.disaster_type || !form.severity} className="flex-1">
              {saving ? "Publishing..." : "Publish Alert"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`bg-card border rounded-xl p-4 ${alert.is_active ? "border-destructive/30" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${SEVERITY_COLORS[alert.severity] || "text-foreground"}`}>{alert.severity}</span>
                  <span className="text-xs text-muted-foreground">• {alert.disaster_type}</span>
                  {alert.is_active && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full alert-pulse">ACTIVE</span>}
                </div>
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.affected_towns?.join(", ")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(alert)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {alert.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => remove(alert.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}