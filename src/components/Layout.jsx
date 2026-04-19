import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Map, BookOpen, AlertTriangle, FileText, Shield, Menu, X, Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      setActiveAlerts(0); 
    };
    fetchAlerts();
  }, []);

  const isAdmin = user?.role === "admin";

  const navLinks = [
    { to: "/map", label: "Map", icon: Map }, // Updated to /map to match your App.jsx routes
    { to: "/heritage", label: "Heritage Sites", icon: BookOpen },
    { to: "/culture", label: "Culture & Traditions", icon: Shield },
    { to: "/alerts", label: "DRRM Alerts", icon: AlertTriangle, badge: activeAlerts },
    { to: "/reports", label: "Damage Reports", icon: FileText },
    ...(isAdmin ? [{ to: "/admin", label: "Admin Panel", icon: Shield }] : []),
  ];

  const isActive = (path) => {
    if (path === "/map") return location.pathname === "/map";
    return location.pathname.startsWith(path);
  };

  return (
    /* FIXED: Added a hardcoded dark background class to ensure the 'white leak' is covered */
    <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Map className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-playfair font-bold text-sidebar-foreground text-base leading-tight">MAPA Bohol</h1>
              <p className="text-xs text-muted-foreground">Cultural Heritage System</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold alert-pulse">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name || "Admin User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || "Administrator"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      {/* FIXED: Added bg-[#0f1115] to ensure individual pages don't revert to white */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0f1115]">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="text-sidebar-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-playfair font-bold text-sidebar-foreground">MAPA Bohol</h1>
          {activeAlerts > 0 && (
            <div className="relative">
              <Bell className="w-6 h-6 text-destructive alert-pulse" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeAlerts}</span>
            </div>
          )}
        </header>

        {/* FIXED: The overflow wrapper is now dark */}
        <main className="flex-1 overflow-auto bg-[#0f1115]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}