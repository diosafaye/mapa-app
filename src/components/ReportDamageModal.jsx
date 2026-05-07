import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { X, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { bufferDamageReport } from "@/lib/offlineSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const CONDITION_TYPES = [
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

export default function ReportDamageModal({ site, onClose }) {
  const isOnline = useOnlineStatus();
  const [form, setForm] = useState({
    damage_level: "",
    description: "",
    reported_by: "",
    reporter_email: "",
    image_url: "",
    date_of_damage: new Date().toISOString().split("T")[0],
    heritage_site_id: site?.id || "",
    heritage_site_name: site?.name || "",
  });

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sites, setSites] = useState([]);

  // Fetch sites from Supabase on mount
  useEffect(() => {
    const fetchSites = async () => {
      const { data, error } = await supabase
        .from('HeritageSite')
        .select('id, name, town')
        .eq('is_active', true);
      
      if (!error && data) setSites(data);
    };
    fetchSites();
  }, []);

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const fs = (field) => (v) => setForm((p) => ({ ...p, [field]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('damage-reports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('damage-reports')
        .getPublicUrl(fileName);

      setForm((p) => ({ ...p, image_url: publicUrlData.publicUrl }));
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.damage_level || !form.description || !form.heritage_site_name) return;
    
    setSaving(true);
    const reportData = {
      heritage_site_id: form.heritage_site_id,
      heritage_site_name: form.heritage_site_name,
      damage_level: form.damage_level,
      description: form.description,
      reported_by: form.reported_by || "Anonymous Visitor",
      reporter_email: form.reporter_email,
      image_url: form.image_url,
      date_of_damage: form.date_of_damage,
      status: "Pending Review",
    };

    try {
      if (isOnline) {
        const { error } = await supabase.from('DamageReport').insert(reportData);
        if (error) throw error;
        toast.success("Damage report submitted successfully");
      } else {
        bufferDamageReport(reportData);
        toast.success("Report saved offline — will sync when connection returns");
      }
      setDone(true);
    } catch (error) {
      toast.error("Failed to submit report");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Report Damage</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">Report Submitted!</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Your report has been sent for admin review. Thank you for helping protect Bohol's heritage.
            </p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {site ? (
              <p className="text-sm text-muted-foreground">
                Reporting damage at: <span className="text-foreground font-medium">{site.name}</span>
              </p>
            ) : (
              <Select value={form.heritage_site_id} onValueChange={(id) => {
                const selected = sites.find(s => s.id === id);
                setForm(p => ({ ...p, heritage_site_id: id, heritage_site_name: selected?.name || "" }));
              }}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select heritage site *" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.town}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={form.damage_level} onValueChange={fs("damage_level")}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Site condition / damage type *" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {CONDITION_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={form.date_of_damage}
              onChange={f("date_of_damage")}
              className="bg-muted border-border text-foreground"
            />

            <Textarea
              placeholder="Describe the damage you observed *"
              value={form.description}
              onChange={f("description")}
              className="bg-muted border-border text-foreground min-h-[90px]"
            />

            <Input
              placeholder="Your name (optional)"
              value={form.reported_by}
              onChange={f("reported_by")}
              className="bg-muted border-border text-foreground"
            />

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading photo..." : form.image_url ? "Photo attached ✓" : "Attach a photo (optional)"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="mt-2 h-24 w-full object-cover rounded-xl" />
              )}
            </div>

            <Button
              onClick={submit}
              disabled={saving || !form.damage_level || !form.description || (!site && !form.heritage_site_name)}
              className="w-full"
            >
              {saving ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}