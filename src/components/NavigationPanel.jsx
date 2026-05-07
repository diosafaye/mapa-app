import { useState } from "react";
import { Navigation2, ExternalLink, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NavigationPanel({ sites, userLocation }) {
  const [open, setOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");

  const activeSites = sites.filter(s => s.latitude && s.longitude);

  const openGoogleMaps = () => {
    const site = activeSites.find(s => s.id === selectedSiteId);
    if (!site) return;

    const dest = `${site.latitude},${site.longitude}`;
    
    // Fixed the URL strings (removed the accidental '0' and '1' and corrected template literals)
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;

    window.open(url, "_blank");
    setOpen(false);
  };

  const selectCls = "w-full text-sm bg-muted border border-border rounded-xl px-3 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const panelContent = (
    <div className="p-3 space-y-3 pb-5">
      <select
        value={selectedSiteId}
        onChange={e => setSelectedSiteId(e.target.value)}
        className={selectCls}
      >
        <option value="">Select destination…</option>
        {activeSites.map(s => (
          <option key={s.id} value={s.id}>{s.name} — {s.town}</option>
        ))}
      </select>

      <Button
        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        disabled={!selectedSiteId}
        onClick={openGoogleMaps}
      >
        <ExternalLink className="w-4 h-4" />
        Open in Google Maps
      </Button>

      {!userLocation && (
        <p className="text-xs text-muted-foreground text-center">
          Enable location for turn-by-turn directions.
        </p>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* The "Drop-up" logic: 
         By using bottom-full and mb-2, the menu will always 
         expand UPWARDS from the button, avoiding the screen edges.
      */}
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-72 bg-card/98 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
            <p className="text-sm font-bold text-foreground">Navigate to Site</p>
            <button 
              onClick={() => setOpen(false)} 
              className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          {panelContent}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-xl border transition-all ${
          open
            ? "bg-green-600 text-white border-green-500 scale-95"
            : "bg-card/95 backdrop-blur border-border text-foreground hover:bg-secondary"
        }`}
      >
        <span className="flex items-center gap-2">
          <Navigation2 className={`w-4 h-4 ${open ? 'fill-current' : ''}`} />
          Navigate
        </span>
        <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-0" : "rotate-180"}`} />
      </button>
    </div>
  );
}