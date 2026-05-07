import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient"; 
import { Plus, Trash2, Edit2, Eye, EyeOff, Music, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOHOL_TOWNS } from "../../data/boholData";

const EMPTY = {
  name: "", town: "", type: "", description: "",
  schedule: "", practitioners: "", endangered_status: "", image_url: "", is_active: true
};

const TYPES = ["Festival", "Tradition", "Ritual", "Performing Arts", "Craftsmanship", "Culinary Heritage", "Other"];
const ENDANGERED = ["Thriving", "Stable", "Vulnerable", "Endangered", "Critically Endangered", "Extinct"];

export default function AdminCulture() {
  const [practices, setPractices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const load = async () => {
    const { data, error } = await supabase
      .from('cultural_practices')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setPractices(data);
  };

  useEffect(() => { load(); }, []);

  const f = (field) => e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const fs = (field) => v => setForm(prev => ({ ...prev, [field]: v }));

  const openEdit = (p) => {
    const cleanP = { ...EMPTY };
    Object.keys(EMPTY).forEach(key => { if (p[key] !== undefined) cleanP[key] = p[key]; });
    setForm(cleanP);
    setEditingId(p.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const toggleActive = async (p) => {
    await supabase
      .from('cultural_practices')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    load();
  };

  const save = async () => {
    if (!form.name || !form.town || !form.type) {
      alert("Please fill in all required fields!");
      return;
    }
    setSaving(true);
    const dataToUpdate = {
      name: form.name, town: form.town, type: form.type,
      description: form.description, schedule: form.schedule,
      practitioners: form.practitioners, endangered_status: form.endangered_status,
      image_url: form.image_url, is_active: form.is_active
    };

    let error;
    if (editingId) {
      const res = await supabase.from('cultural_practices').update(dataToUpdate).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('cultural_practices').insert([dataToUpdate]);
      error = res.error;
    }

    if (error) {
      alert("Save failed: " + error.message);
    } else {
      setForm(EMPTY);
      setEditingId(null);
      setShowForm(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (window.confirm("Are you sure you want to delete this cultural practice?")) {
      const { error } = await supabase.from('cultural_practices').delete().eq('id', id);
      if (error) alert("Delete failed: " + error.message);
      else load();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cultural Heritage Registry</h2>
          <p className="text-xs text-muted-foreground">{practices.length} traditions & practices</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(!showForm); }} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Practice
        </Button>
      </div>

      {showForm && (
        <div ref={formRef} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-semibold text-primary">{editingId ? "Edit Cultural Practice" : "Add New Cultural Practice"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Practice name *" value={form.name} onChange={f("name")} className="bg-muted/50 border-border" />
            <Select value={form.town} onValueChange={fs("town")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Town *" /></SelectTrigger>
              <SelectContent>{BOHOL_TOWNS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.type} onValueChange={fs("type")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Type *" /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.endangered_status} onValueChange={fs("endangered_status")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Endangered status" /></SelectTrigger>
              <SelectContent>{ENDANGERED.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Schedule/frequency" value={form.schedule} onChange={f("schedule")} className="bg-muted/50 border-border" />
            <Input placeholder="Practitioners/community" value={form.practitioners} onChange={f("practitioners")} className="bg-muted/50 border-border" />
          </div>
          <Input placeholder="Image URL" value={form.image_url} onChange={f("image_url")} className="bg-muted/50 border-border" />
          <Textarea placeholder="Description *" value={form.description} onChange={f("description")} className="bg-muted/50 border-border min-h-[80px]" />
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.name || !form.town || !form.type} className="flex-1 font-bold">
              {saving ? "Saving..." : editingId ? "Update Practice" : "Register Practice"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {practices.map(p => (
          <div key={p.id} className={`bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 transition-all hover:shadow-md ${p.is_active === false ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${p.is_active !== false ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{p.town}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-primary/80">{p.type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleActive(p)}
                className={`p-2.5 rounded-xl transition-all ${p.is_active !== false ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted"}`}
                title={p.is_active !== false ? "Publicly Visible" : "Hidden from Public"}
              >
                {p.is_active !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => openEdit(p)}
                className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => remove(p.id)}
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}