import { X, Calendar, User, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["Pending Review", "Verified", "Under Restoration", "Restored", "Closed"];

const STATUS_COLORS = {
  "Pending Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Verified": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Under Restoration": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Restored": "bg-green-500/20 text-green-400 border-green-500/30",
  "Closed": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function DamageReportDetailModal({ report, onClose, onStatusChange, onDelete }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-playfair text-xl font-bold text-foreground">{report.heritage_site_name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{report.damage_level}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        {report.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img src={report.image_url} alt="damage" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status badge + change */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[report.status] || "bg-muted text-muted-foreground border-border"}`}>
              {report.status}
            </span>
            <Select value={report.status} onValueChange={(v) => onStatusChange(report.id, v)}>
              <SelectTrigger className="h-7 w-40 text-xs bg-muted border-border text-foreground">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Date of Damage</p>
              <p className="text-sm font-semibold text-foreground">{report.date_of_damage || "—"}</p>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Reported By</p>
              <p className="text-sm font-semibold text-foreground">{report.reported_by || "Anonymous"}</p>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><FileText className="w-3 h-3" /> Description</p>
              <p className="text-sm text-foreground leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Metadata */}
          <p className="text-xs text-muted-foreground">
            Submitted: {report.created_date ? new Date(report.created_date).toLocaleString() : "—"}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          {report.status === "Pending Review" && (
            <Button size="sm" className="flex-1 gap-2" onClick={() => { onStatusChange(report.id, "Verified"); onClose(); }}>
              <CheckCircle className="w-4 h-4" /> Verify Report
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => { onDelete(report.id); onClose(); }}>
            <AlertTriangle className="w-4 h-4" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">Close</Button>
        </div>
      </div>
    </div>
  );
}