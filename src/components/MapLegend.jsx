import { useState } from "react";
import { Layers } from "lucide-react";

export default function MapLegend({ sites, categoryColors }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-4 z-[500] flex flex-col items-end gap-2">
      {/* Legend toggle */}
      {open && (
        <div className="bg-card/95 backdrop-blur rounded-xl border border-border p-3 shadow-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
          <div className="space-y-1.5">
            {Object.entries(categoryColors).filter(([k]) => k !== "Other").map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-foreground">{cat}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-border pt-1.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0 alert-pulse" />
              <span className="text-xs text-destructive font-medium">Under Alert</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md border transition-colors ${
          open
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card/95 backdrop-blur border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Legend
      </button>
    </div>
  );
}