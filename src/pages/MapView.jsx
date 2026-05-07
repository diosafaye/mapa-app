import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Standard Supabase client from your project library
import { supabase } from "@/api/supabaseClient"; 
import { ChevronRight } from "lucide-react";
import MapLegend from "../components/MapLegend";
import SiteDetailPanel from "../components/SiteDetailPanel";
import AlertBanner from "../components/AlertBanner";
import NavigationPanel from "../components/NavigationPanel";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CATEGORY_COLORS = {
  "Church": "#f59e0b",
  "Historical Landmark": "#3b82f6",
  "Natural Heritage": "#10b981",
  "Archaeological Site": "#8b5cf6",
  "Museum": "#ec4899",
  "Cultural Center": "#06b6d4",
  "Other": "#6b7280"
};

function getCategoryEmoji(category) {
  const map = { 
    "Church": "⛪", 
    "Historical Landmark": "🏛️", 
    "Natural Heritage": "🌿", 
    "Archaeological Site": "🏺", 
    "Museum": "🏛", 
    "Cultural Center": "🎭" 
  };
  return map[category] || "📍";
}

const createSiteIcon = (category, hasAlert) => {
  const color = hasAlert ? "#ef4444" : (CATEGORY_COLORS[category] || "#f59e0b");
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;
      background:${color};
      border:3px solid ${hasAlert ? '#fff' : 'rgba(255,255,255,0.4)'};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      ${hasAlert ? 'animation:alert-pulse 1.5s ease-in-out infinite;' : ''}
    ">
      <div style="transform:rotate(45deg);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;">
        ${hasAlert ? "⚠️" : getCategoryEmoji(category)}
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -35],
    className: "heritage-marker",
  });
};

const BOHOL_BOUNDS = L.latLngBounds([9.1, 123.5], [10.3, 124.5]);

function BoholBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(BOHOL_BOUNDS);
    map.setMinZoom(9);
    map.setMaxZoom(16);
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(BOHOL_BOUNDS, { padding: [20, 20] });
    }, 100);
  }, [map]);
  return null;
}

export default function MapView() {
  const [sites, setSites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);

  // Unified fetcher for Supabase tables
  const fetchData = async () => {
    const { data: sitesData } = await supabase
      .from('heritage_sites')
      .select('*')
      .eq('is_active', true);
    
    const { data: alertsData } = await supabase
      .from('disaster_alerts')
      .select('*')
      .eq('is_active', true);

    if (sitesData) setSites(sitesData);
    if (alertsData) setAlerts(alertsData);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} 
      );
    }

    fetchData();

    // Supabase Realtime Channels
    const sitesChannel = supabase
      .channel('sites-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'heritage_sites' }, fetchData)
      .subscribe();

    const alertsChannel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disaster_alerts' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(sitesChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const getAlertForTown = (town) =>
    alerts.find(a => a.affected_towns?.includes(town));

  const activeAlertsList = alerts.filter(a => !dismissedAlerts.has(a.id));

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {/* Alert banners */}
      {activeAlertsList.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-[1000] space-y-1 p-3">
          {activeAlertsList.slice(0, 2).map(alert => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
            />
          ))}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[9.85, 124.05]}
        zoom={10}
        minZoom={9}
        maxZoom={16}
        maxBounds={[[9.1, 123.5], [10.3, 124.5]]}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <BoholBounds />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Alert radius circles */}
        {alerts.map(alert =>
          sites
            .filter(s => alert.affected_towns?.includes(s.town))
            .map(site => (
              <Circle
                key={`circle-${alert.id}-${site.id}`}
                center={[Number(site.latitude), Number(site.longitude)]}
                radius={3000}
                pathOptions={{
                  color: alert.severity === "Critical Emergency" ? "#7c3aed" :
                         alert.severity === "Warning" ? "#ef4444" :
                         alert.severity === "Watch" ? "#f59e0b" : "#3b82f6",
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: "6 4"
                }}
              />
            ))
        )}

        {/* Heritage site markers */}
        {sites.map(site => {
          const alert = getAlertForTown(site.town);
          return (
            <Marker
              key={site.id}
              position={[Number(site.latitude), Number(site.longitude)]}
              icon={createSiteIcon(site.category, !!alert)}
              eventHandlers={{ click: () => setSelectedSite(site) }}
            >
              <Popup className="heritage-popup">
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-gray-800 text-sm">{site.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{site.town} • {site.category}</p>
                  {alert && (
                    <div className="bg-red-50 border border-red-200 rounded p-1.5 mt-1">
                      <p className="text-xs text-red-700 font-medium">⚠️ {alert.severity}: {alert.disaster_type}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedSite(site)}
                    className="mt-2 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Side & Overlay Panels */}
      <div className="absolute bottom-20 right-4 z-[1000] w-auto max-w-[calc(100vw-2rem)]">
        <NavigationPanel sites={sites} userLocation={userLocation} />
      </div>

      <div className="absolute bottom-20 left-4 z-[1000]">
        <MapLegend sites={sites} categoryColors={CATEGORY_COLORS} />
      </div>

      {/* Detail panel */}
      {selectedSite && (
        <SiteDetailPanel
          site={selectedSite}
          alert={getAlertForTown(selectedSite.town)}
          userLocation={userLocation}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  );
}