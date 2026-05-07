import { useState } from "react";
import { Shield, Map, Music, AlertTriangle, FileText } from "lucide-react";
import AdminSites from "../components/admin/AdminSites";
import AdminCulture from "../components/admin/AdminCulture";
import AdminAlerts from "../components/admin/AdminAlerts";
import AdminDamage from "../components/admin/AdminDamage";

const TABS = [
  { id: "alerts", label: "DRRM Alerts", icon: AlertTriangle },
  { id: "sites", label: "Heritage Sites", icon: Map },
  { id: "culture", label: "Cultural Practices", icon: Music },
  { id: "damage", label: "Damage Reports", icon: FileText },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("alerts");

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background text-foreground">
      
      {/* Header */}
      <div className="p-6 border-b border-border bg-card flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
              Heritage Data & DRRM Management
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-background p-4">
        {activeTab === "sites" && <AdminSites />}
        {activeTab === "culture" && <AdminCulture />}
        {activeTab === "alerts" && <AdminAlerts />}
        {activeTab === "damage" && <AdminDamage />}
      </div>
    </div>
  );
}