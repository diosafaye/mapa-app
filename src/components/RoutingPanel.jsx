import { useState, useEffect } from "react";
import { Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation2, X, MapPin, Clock, Ruler, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom Leaflet Icons
const destinationIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#f59e0b;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  className: "",
});

const originIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: "",
});

// Helper: Automatically zooms the map to show the whole route
function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
    }
  }, [coords, map]);
  return null;
}

// Component: Renders the line and markers on the map
export function RoutePolyline({ routeCoords, origin, destination }) {
  if (routeCoords.length < 2) return null;
  return (
    <>
      <FitRoute coords={routeCoords} />
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: "#6366f1", weight: 5, opacity: 0.85 }}
      />
      {origin && <Marker position={origin} icon={originIcon} />}
      {destination && <Marker position={destination} icon={destinationIcon} />}
    </>
  );
}

// Component: The UI overlay
export function RoutingUI({ 
  routeInfo, 
  selectedSiteId, 
  loading, 
  error, 
  open, 
  setOpen, 
  activeSites, 
  userLocation, 
  onGetRoute, 
  onClearRoute, 
  onSiteChange 
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] w-60">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg border transition-colors ${
          open || routeInfo
            ? "bg-indigo-600 text-white border-indigo-500"
            : "bg-card/95 backdrop-blur border-border text-foreground hover:bg-secondary"
        }`}
      >
        <span className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4" />
          {routeInfo ? `→ ${routeInfo.name}` : "Navigate to Site"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1.5 bg-card/95 backdrop-blur rounded-xl border border-border p-3 shadow-xl space-y-3">
          {!userLocation && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5">
              ⚠️ GPS not available. Enable location access.
            </p>
          )}

          <select
            value={selectedSiteId}
            onChange={e => onSiteChange(e.target.value)}
            className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select destination site…</option>
            {activeSites.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.town}</option>
            ))}
          </select>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {routeInfo && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-indigo-400">{routeInfo.name}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{routeInfo.distance} km</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{routeInfo.duration} min</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
              disabled={!selectedSiteId || loading || !userLocation}
              onClick={onGetRoute}
            >
              {loading ? "Routing…" : "Get Route"}
            </Button>
            {routeInfo && (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onClearRoute}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Export
export default function RoutingPanel({ sites, userLocation, onRouteUpdate }) {
  const [open, setOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const activeSites = sites.filter(s => s.latitude && s.longitude);

  const getRoute = async () => {
    if (!selectedSiteId) return;
    setError("");

    if (!userLocation) {
      setError("Could not get your location.");
      return;
    }

    const site = activeSites.find(s => s.id === selectedSiteId);
    if (!site) return;

    setLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${site.longitude},${site.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error("No route found.");
      }

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      
      setRouteCoords(coords);
      setOrigin([userLocation.lat, userLocation.lng]);
      setDestination([site.latitude, site.longitude]);
      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.round(route.duration / 60),
        name: site.name,
      });
      
      onRouteUpdate?.(coords, [userLocation.lat, userLocation.lng], [site.latitude, site.longitude]);
    } catch (err) {
      setError("Could not calculate route.");
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteCoords([]);
    setRouteInfo(null);
    setOrigin(null);
    setDestination(null);
    setSelectedSiteId("");
    setError("");
    onRouteUpdate?.([], null, null);
  };

  return (
    <>
      <RoutePolyline routeCoords={routeCoords} origin={origin} destination={destination} />
      <RoutingUI
        routeInfo={routeInfo}
        selectedSiteId={selectedSiteId}
        loading={loading}
        error={error}
        open={open}
        setOpen={setOpen}
        activeSites={activeSites}
        userLocation={userLocation}
        onGetRoute={getRoute}
        onClearRoute={clearRoute}
        onSiteChange={setSelectedSiteId}
      />
    </>
  );
}