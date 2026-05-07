import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient"; 
import { Plus, Trash2, Edit2, Eye, EyeOff, Landmark, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOHOL_TOWNS } from "../../data/boholData";

const EMPTY = {
  name: "", town: "", category: "", classification: "", description: "",
  historical_significance: "", year_established: "", latitude: "", longitude: "",
  image_url: "", conservation_status: "", is_active: true
};

const CATEGORIES = ["Church", "Historical Landmark", "Natural Heritage", "Archaeological Site", "Museum", "Cultural Center", "Other"];
const CLASSIFICATIONS = ["National Cultural Treasure", "Important Cultural Property", "Local Heritage", "UNESCO World Heritage", "Unclassified"];
const CONSERVATION = ["Excellent", "Good", "Fair", "Deteriorating", "Critical", "Destroyed"];

export default function AdminSites() {
  const [sites, setSites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const load = async () => {
    const { data, error } = await supabase
      .from('heritage_sites')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setSites(data);
  };

  useEffect(() => { load(); }, []);

  const f = (field) => e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const fs = (field) => v => setForm(prev => ({ ...prev, [field]: v }));

  const openEdit = (site) => {
    setForm({
      ...EMPTY, ...site,
      latitude: String(site.latitude),
      longitude: String(site.longitude),
      year_established: site.year_established ? String(site.year_established) : ""
    });
    setEditingId(site.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const save = async () => {
    if (!form.name || !form.town || !form.category || !form.latitude || !form.longitude) {
      alert("Please fill in all required fields!");
      return;
    }
    setSaving(true);
    const { id, ...dataToUpdate } = form;
    const payload = {
      ...dataToUpdate,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      year_established: form.year_established ? parseInt(form.year_established) : 0
    };

    let error;
    if (editingId) {
      const res = await supabase.from('heritage_sites').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('heritage_sites').insert([payload]);
      error = res.error;
    }

    if (error) {
      alert("Save failed: " + error.message);
    } else {
      setForm({ ...EMPTY });
      setEditingId(null);
      setShowForm(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (window.confirm("Are you sure you want to delete this site?")) {
      await supabase.from('heritage_sites').delete().eq('id', id);
      load();
    }
  };

  const toggleActive = async (site) => {
    await supabase
      .from('heritage_sites')
      .update({ is_active: !site.is_active })
      .eq('id', site.id);
    load();
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Bohol Heritage Registry</h2>
          <p className="text-xs text-muted-foreground">{sites.length} sites found</p>
        </div>
        <Button
          onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(!showForm); }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Add Site
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-semibold text-primary">{editingId ? "Edit Heritage Site" : "Add New Heritage Site"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Site name *" value={form.name} onChange={f("name")} className="bg-muted/50 border-border" />
            <Select value={form.town} onValueChange={fs("town")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Town *" /></SelectTrigger>
              <SelectContent>{BOHOL_TOWNS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.category} onValueChange={fs("category")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Category *" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.classification} onValueChange={fs("classification")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Classification" /></SelectTrigger>
              <SelectContent>{CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Latitude *" value={form.latitude} onChange={f("latitude")} className="bg-muted/50 border-border" />
            <Input placeholder="Longitude *" value={form.longitude} onChange={f("longitude")} className="bg-muted/50 border-border" />
            <Input placeholder="Year established" value={form.year_established} onChange={f("year_established")} className="bg-muted/50 border-border" />
            <Select value={form.conservation_status} onValueChange={fs("conservation_status")}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Conservation status" /></SelectTrigger>
              <SelectContent>{CONSERVATION.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Image URL" value={form.image_url} onChange={f("image_url")} className="bg-muted/50 border-border" />
          <Textarea placeholder="Description" value={form.description} onChange={f("description")} className="bg-muted/50 border-border min-h-[80px]" />
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.name || !form.town || !form.latitude} className="flex-1 font-bold">
              {saving ? "Saving..." : editingId ? "Update Site" : "Save Site"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 gap-3">
        {sites.map(site => (
          <div key={site.id} className={`bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all ${!site.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{site.name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {site.town} • {site.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleActive(site)}
                className={`p-2 rounded-lg transition-colors ${site.is_active ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted"}`}
                title="Toggle Visibility"
              >
                {site.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => openEdit(site)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Edit Site"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => remove(site.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Delete Site"
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