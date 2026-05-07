import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { Map, BookOpen, Shield, AlertTriangle, FileText, Bell, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import OfflineBanner from "@/components/OfflineBanner";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { to: "/map", label: "Map", icon: Map },
  { to: "/heritage", label: "Heritage Sites", icon: BookOpen },
  { to: "/culture", label: "Culture", icon: Shield },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function PublicLayout() {
  const location = useLocation();
  const { user, logout } = useAuth(); // ✅ added logout
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchAlertsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("disaster_alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (!error) setActiveAlerts(count || 0);
    } catch (err) {
      console.error("Alert sync failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchAlertsCount();
    const alertChannel = supabase
      .channel("public-alerts-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "disaster_alerts" }, () => fetchAlertsCount())
      .subscribe();
    return () => { supabase.removeChannel(alertChannel); };
  }, [fetchAlertsCount]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <OfflineBanner />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Map className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-foreground text-sm leading-tight tracking-tight">MAPA Bohol</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Heritage System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? "bg-primary/10 text-primary border border-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive(to) ? "text-primary" : "opacity-60"}`} />
                {label}
                {to === "/alerts" && activeAlerts > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black animate-pulse">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2">
            {/* ✅ Notifications bell */}
            <Link to="/notifications" className="relative p-2 flex items-center justify-center">
              <Bell className={`w-5 h-5 ${activeAlerts > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
              {activeAlerts > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {activeAlerts}
                </span>
              )}
            </Link>

            <ThemeToggle />

            {/* User info */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
                <span className="text-primary text-xs font-black uppercase">
                  {user?.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-foreground leading-none">
                  {user?.full_name || "Viewer"}
                </p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                  {user?.role || "User"}
                </p>
              </div>
              {/* ✅ Logout button */}
              <button
                onClick={() => logout()}
                className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg bg-muted/50 text-foreground transition-colors hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-1 shadow-xl animate-in slide-in-from-top duration-200">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive(to)
                    ? "bg-primary/15 text-primary border border-primary/10"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{label}</span>
                {to === "/alerts" && activeAlerts > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            ))}
            {/* ✅ Logout in mobile menu too */}
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        )}
      </header>

      {/* EMERGENCY BANNER */}
      {activeAlerts > 0 && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center z-40 backdrop-blur-sm">
          <p className="text-[10px] md:text-xs font-bold text-destructive uppercase tracking-widest animate-pulse">
            ⚠️ {activeAlerts} active emergency alert{activeAlerts > 1 ? "s" : ""} in Bohol —{" "}
            <Link to="/alerts" className="underline font-black decoration-2">Take Action</Link>
          </p>
        </div>
      )}

      {/* MAIN CONTENT */}
    <main className="flex-1 overflow-hidden bg-background relative">
  <div className="h-full w-full overflow-y-auto">
    <Outlet />
  </div>
</main>
}