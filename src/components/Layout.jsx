import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { Map, BookOpen, AlertTriangle, FileText, Shield, Menu, X, Bell, Settings, LogOut } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth(); // ✅ added logout
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);

  const fetchAlertCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("disaster_alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (!error) setActiveAlerts(count || 0);
    } catch (err) {
      console.error("Alert count sync failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchAlertCount();
    const alertChannel = supabase
      .channel("nav-alerts-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "disaster_alerts" }, () => fetchAlertCount())
      .subscribe();
    return () => { supabase.removeChannel(alertChannel); };
  }, [fetchAlertCount]);

  const isAdmin = user?.role === "admin";

  const navLinks = [
    { to: "/map", label: "Map", icon: Map },
    { to: "/heritage", label: "Heritage Sites", icon: BookOpen },
    { to: "/culture", label: "Culture & Traditions", icon: Shield },
    { to: "/alerts", label: "DRRM Alerts", icon: AlertTriangle, badge: activeAlerts },
    { to: "/reports", label: "Damage Reports", icon: FileText },
    ...(isAdmin ? [{ to: "/admin", label: "Admin Panel", icon: Settings }] : []),
  ];

  const isActive = (path) => {
    return path === "/map" ? location.pathname === "/map" : location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[1001] w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/20">
              <Map className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-playfair font-bold text-sidebar-foreground text-base tracking-tight leading-tight">MAPA Bohol</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Heritage System</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group ${
                isActive(to)
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive(to) ? "text-primary" : "opacity-60 group-hover:opacity-100"}`} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black animate-pulse shadow-sm">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-black">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate tracking-tight">{user?.full_name || "Guest Viewer"}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">{user?.role || "Visitor"}</p>
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
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-card/80 backdrop-blur-md sticky top-0 z-[1002]">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            <span className="font-playfair font-bold text-foreground">MAPA Bohol</span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link to="/notifications" className="relative p-2 flex items-center justify-center">
              <Bell className={`w-6 h-6 ${activeAlerts > 0 ? "text-destructive animate-pulse" : "text-foreground"}`} />
              {activeAlerts > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {activeAlerts}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}