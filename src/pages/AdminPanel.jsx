import { useState } from "react";
import { Shield, Map, Music, AlertTriangle, FileText } from "lucide-react";
// Sub-components will now handle their own Supabase logic
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
    /* FIXED: Changed bg-background to bg-[#0f1115] and text to white */
    <div className="h-full flex flex-col overflow-hidden bg-[#0f1115] text-white">
      
      {/* Header */}
      {/* FIXED: Changed bg-card to bg-[#16191d] and border to slate-800 */}
      <div className="p-6 border-b border-slate-800 bg-[#16191d] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">
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
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {/* FIXED: Changed bg-[#fafafa] to bg-[#0f1115] */}
      <div className="flex-1 overflow-y-auto bg-[#0f1115] p-4">
        {activeTab === "sites" && <AdminSites />}
        {activeTab === "culture" && <AdminCulture />}
        {activeTab === "alerts" && <AdminAlerts />}
        {activeTab === "damage" && <AdminDamage />}
      </div>
    </div>
  );
}