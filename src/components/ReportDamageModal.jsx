import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Updated import path
import { X, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [form, setForm] = useState({
    damage_level: "",
    description: "",
    reported_by: "",
    image_url: "",
    date_of_damage: new Date().toISOString().split("T")[0],
    heritage_site_name_input: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const fs = (field) => (v) => setForm((p) => ({ ...p, [field]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('damage_reports') // Ensure this bucket exists in Supabase Storage
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Error uploading image.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('damage_reports')
      .getPublicUrl(filePath);

    setForm((p) => ({ ...p, image_url: data.publicUrl }));
    setUploading(false);
  };

  const submit = async () => {
    const siteName = site ? site.name : form.heritage_site_name_input;
    if (!form.damage_level || !form.description || !siteName) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('damage_reports')
      .insert([
        {
          heritage_site_id: site?.id || null,
          heritage_site_name: siteName,
          damage_level: form.damage_level,
          description: form.description,
          reported_by: form.reported_by || "Anonymous Visitor",
          image_url: form.image_url,
          date_of_damage: form.date_of_damage,
          status: "Pending Review",
        }
      ]);

    if (error) {
      console.error("Submission error:", error);
      alert("Failed to submit report. Please try again.");
    } else {
      setDone(true);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
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
              <Input
                placeholder="Heritage site name *"
                value={form.heritage_site_name_input}
                onChange={f("heritage_site_name_input")}
                className="bg-muted border-border text-foreground"
              />
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
            
            {/* Photo upload */}
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
              disabled={saving || !form.damage_level || !form.description || (!site && !form.heritage_site_name_input)}
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