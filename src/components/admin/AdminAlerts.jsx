import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, RefreshCw, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOHOL_TOWNS, DISASTER_TYPES, SEVERITY_LEVELS } from "../../data/boholData";
import { toast } from "sonner"; // Recommended for feedback

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
  const [refreshing, setRefreshing] = useState(false);

  // 1. Memoized Loader for re-use
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('disaster_alerts')
      .select('*')
      .order('started_at', { ascending: false });
    
    if (!error && data) setAlerts(data);
  }, []);

  // 2. Realtime Sync & Initial Load
  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin_alerts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'disaster_alerts' }, 
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  const toggleTown = (town) => {
    setForm(f => ({
      ...f,
      affected_towns: f.affected_towns.includes(town)
        ? f.affected_towns.filter(t => t !== town)
        : [...f.affected_towns, town]
    }));
  };

  const save = async () => {
    if (!form.title || !form.disaster_type || !form.severity) {
      toast.error("Please fill in required fields");
      return;
    }
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
      toast.success("Alert published successfully");
    } else {
      toast.error(error.message);
    }
    setSaving(false);
  };

  const toggleActive = async (alert) => {
    const { error } = await supabase
      .from('disaster_alerts')
      .update({ is_active: !alert.is_active })
      .eq('id', alert.id);
    
    if (error) toast.error("Failed to update status");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    
    const { error } = await supabase
      .from('disaster_alerts')
      .delete()
      .eq('id', id);
    
    if (error) toast.error("Delete failed");
  };

  // 3. PAGASA Integration via Supabase Edge Functions
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Logic assumes you have a Supabase Edge Function named 'fetch-pagasa'
      const { data, error } = await supabase.functions.invoke('fetch-pagasa');
      if (error) throw error;
      toast.success("PAGASA data synced");
      load();
    } catch (err) {
      console.error(err);
      toast.error("External sync failed");
    } finally {
      setRefreshing(false);
    }
  };

  const SEVERITY_COLORS = {
    "Advisory": "text-blue-400", 
    "Watch": "text-amber-400",
    "Warning": "text-red-400", 
    "Critical Emergency": "text-purple-400"
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-playfair font-bold text-foreground">DRRM Alert Center</h1>
          <p className="text-sm text-muted-foreground">
            {alerts.length} historical • {alerts.filter(a => a.is_active).length} currently active
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Fetching..." : "Sync PAGASA"}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 shadow-lg shadow-primary/20">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "New Alert"}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-foreground uppercase tracking-tight text-sm">Emergency Broadcast Form</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                placeholder="Alert title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-muted/50"
              />

              <div className="grid grid-cols-2 gap-3">
                <Select value={form.disaster_type} onValueChange={v => setForm(f => ({ ...f, disaster_type: v }))}>
                  <SelectTrigger className="bg-muted/50 text-xs">
                    <SelectValue placeholder="Disaster Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISASTER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="bg-muted/50 text-xs">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Detailed description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-muted/50 min-h-[100px]"
              />
              
              <Input
                placeholder="Source (e.g. PAGASA, PDRRMC)"
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="bg-muted/50 text-xs"
              />
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Safety instructions (Step-by-step)..."
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                className="bg-muted/50 min-h-[100px]"
              />

              <div className="border rounded-xl p-4 bg-muted/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                  Select Affected Areas ({form.affected_towns.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                  {BOHOL_TOWNS.map(town => (
                    <button
                      key={town}
                      type="button"
                      onClick={() => toggleTown(town)}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                        form.affected_towns.includes(town)
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "bg-background border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {town}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={save} disabled={saving || !form.title} className="flex-1 font-bold">
              {saving ? "Publishing..." : "Broadcast Alert"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="grid gap-3">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`group bg-card border rounded-2xl p-5 transition-all hover:shadow-md ${
              alert.is_active ? "border-destructive/30 ring-1 ring-destructive/10" : "border-border opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${SEVERITY_COLORS[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-muted-foreground text-[10px] font-bold uppercase">{alert.disaster_type}</span>
                  {alert.is_active && (
                    <div className="flex items-center gap-1.5 bg-destructive/10 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      <span className="text-[9px] font-black text-destructive uppercase tracking-tight">Live Broadcast</span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-foreground leading-tight">{alert.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                  Affected: {alert.affected_towns?.join(", ") || "General Bohol"}
                </p>
              </div>
              
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                <button 
                  onClick={() => toggleActive(alert)} 
                  className={`p-2 rounded-md transition-all ${
                    alert.is_active 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={alert.is_active ? "Deactivate Alert" : "Activate Alert"}
                >
                  {alert.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => remove(alert.id)} 
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
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