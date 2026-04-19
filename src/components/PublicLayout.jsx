import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Map, BookOpen, Shield, AlertTriangle, FileText, Bell, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { to: "/", label: "Map", icon: Map },
  { to: "/heritage", label: "Heritage Sites", icon: BookOpen },
  { to: "/culture", label: "Culture", icon: Shield },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Damage Reports", icon: FileText },
];

export default function PublicLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      setActiveAlerts(0); 
    };
    fetchAlerts();
  }, []);

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Map className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-playfair font-bold text-foreground text-sm leading-tight">MAPA Bohol</p>
              <p className="text-xs text-muted-foreground">Cultural Heritage System</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {to === "/alerts" && activeAlerts > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold alert-pulse">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {activeAlerts > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-destructive/10 border border-destructive/30 rounded-full px-3 py-1">
                <Bell className="w-3.5 h-3.5 text-destructive alert-pulse" />
                <span className="text-xs font-bold text-destructive">{activeAlerts} Active Alert{activeAlerts > 1 ? "s" : ""}</span>
              </div>
            )}
            
            {/* --- FIXED: CLICKABLE PROFILE SECTION --- */}
            <Link 
              to="/login" 
              className="flex items-center gap-2 hover:bg-muted p-1 rounded-full transition-colors cursor-pointer"
              title="Click to Login"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
                <span className="text-primary text-xs font-bold">
                  {user?.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <span className="hidden sm:block text-sm text-muted-foreground font-medium">
                {user?.full_name || "Viewer"}
              </span>
            </Link>
            {/* -------------------------------------- */}

            {/* Mobile menu toggle */}
            <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {to === "/alerts" && activeAlerts > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ml-auto alert-pulse">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Active Alert Banner */}
      {activeAlerts > 0 && (
        <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center">
          <p className="text-sm font-semibold text-destructive alert-pulse">
            ⚠️ {activeAlerts} active disaster alert{activeAlerts > 1 ? "s" : ""} in Bohol —{" "}
            <Link to="/alerts" className="underline hover:no-underline">View details</Link>
          </p>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}