import { AlertTriangle, X, Zap } from "lucide-react";

const SEVERITY_CONFIG = {
  "Advisory": { bg: "bg-blue-950/90", border: "border-blue-500", text: "text-blue-300", icon: "text-blue-400", label: "ADVISORY" },
  "Watch": { bg: "bg-amber-950/90", border: "border-amber-500", text: "text-amber-300", icon: "text-amber-400", label: "WATCH" },
  "Warning": { bg: "bg-red-950/90", border: "border-red-500", text: "text-red-300", icon: "text-red-400", label: "WARNING" },
  "Critical Emergency": { bg: "bg-purple-950/90", border: "border-purple-500", text: "text-purple-300", icon: "text-purple-400", label: "CRITICAL" },
};

export default function AlertBanner({ alert, onDismiss }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG["Advisory"];
  return (
    <div className={`flex items-start gap-3 ${cfg.bg} backdrop-blur-md border ${cfg.border} rounded-xl px-4 py-3 shadow-2xl alert-pulse`}>
      <AlertTriangle className={`w-5 h-5 ${cfg.icon} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black tracking-widest ${cfg.text}`}>{cfg.label}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs font-bold text-foreground">{alert.disaster_type}</span>
        </div>
        <p className="text-sm font-semibold text-foreground mt-0.5">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          Affected: {alert.affected_towns?.join(", ")}
        </p>
      </div>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}