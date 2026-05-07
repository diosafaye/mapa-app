import { useState, useEffect } from "react";
import { X, MapPin, Calendar, Shield, AlertTriangle, Star, Navigation, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/api/supabaseClient"; // Ensure this import is correct

const CONSERVATION_COLORS = {
  "Excellent": "bg-green-500/20 text-green-400 border-green-500/30",
  "Good": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Fair": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Deteriorating": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Critical": "bg-red-500/20 text-red-400 border-red-500/30",
  "Destroyed": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  const dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + 
            Math.cos(Number(lat1) * Math.PI/180) * Math.cos(Number(lat2) * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function SiteDetailPanel({ site, alert, userLocation, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch damage reports for this specific site
  useEffect(() => {
    if (!site?.name) return;

    const fetchReports = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("damage_reports")
        .select("*")
        .eq("heritage_site_name", site.name)
        .order("created_date", { ascending: false });

      if (!error && data) setReports(data);
      setLoading(false);
    };

    fetchReports();
  }, [site]);

  if (!site) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-sm z-[999] bg-[#16191d]/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-300">
      
      {/* Header Image */}
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        {site.image_url ? (
          <img src={site.image_url} alt={site.name} className="w-full h-full object-cover shadow-inner" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16191d] via-transparent to-black/20" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-all border border-white/10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{site.category}</p>
          <h2 className="font-bold text-white text-2xl leading-tight drop-shadow-lg">{site.name}</h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Distance Badge */}
        {userLocation && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Navigation className="w-4 h-4 text-[#0f1115] fill-current" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-primary/70 tracking-tighter">Current Distance</p>
                <p className="text-sm font-black text-white">
                  {(() => {
                    const d = getDistanceKm(userLocation.lat, userLocation.lng, site.latitude, site.longitude);
                    return d < 1 ? `${Math.round(d * 1000)} meters away` : `${d.toFixed(2)} km away`;
                  })()}
                </p>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-mono italic">{Number(site.latitude).toFixed(3)}, {Number(site.longitude).toFixed(3)}</p>
          </div>
        )}

        {/* Disaster Alert Section */}
        {alert && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 ring-1 ring-destructive/20 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-black text-destructive uppercase tracking-tight">{alert.severity}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">{alert.description}</p>
          </div>
        )}

        {/* Recent Damage Reports (The New Addition) */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-3 bg-destructive rounded-full"></div> Reported Damages ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No recent damage reports.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white">{r.damage_level}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${r.status === 'Verified' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full"></div> Historical Profile
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
              "{site.description}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}