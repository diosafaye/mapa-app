import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { Bell, AlertTriangle, FileText, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const SEVERITY_COLORS = {
  "Critical Emergency": "text-purple-500",
  "Warning": "text-red-500",
  "Watch": "text-amber-500",
  "Advisory": "text-blue-500"
};

const STATUS_COLORS = {
  "Pending Review": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Verified": "bg-green-500/10 text-green-600 border-green-500/20",
  "Under Restoration": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Restored": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Closed": "bg-slate-500/10 text-slate-600 border-slate-500/20"
};

const STATUS_ICONS = {
  "Pending Review": <Clock className="w-3.5 h-3.5" />,
  "Verified": <CheckCircle2 className="w-3.5 h-3.5" />,
  "Under Restoration": <AlertTriangle className="w-3.5 h-3.5" />,
  "Restored": <CheckCircle2 className="w-3.5 h-3.5" />,
  "Closed": <CheckCircle2 className="w-3.5 h-3.5" />
};

export default function NotificationsPage() {
  const [pushNotifications, setPushNotifications] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Unified Fetching Logic
  const fetchAlertsAndReports = useCallback(async () => {
    try {
      const [alertsRes, reportsRes] = await Promise.all([
        supabase
          .from("push_notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("damage_reports")
          .select("*")
          .order("created_date", { ascending: false })
          .limit(100)
      ]);

      if (alertsRes.error) throw alertsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setPushNotifications(alertsRes.data || []);
      setDamageReports(reportsRes.data || []);
    } catch (error) {
      console.error("Error loading updates:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Realtime Event Listener Hook
  useEffect(() => {
    fetchAlertsAndReports();

    // Subscribe to changes in push_notifications and damage_reports tables
    const realtimeChannel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "push_notifications" },
        () => {
          fetchAlertsAndReports();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "damage_reports" },
        () => {
          fetchAlertsAndReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchAlertsAndReports]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-playfair">Notifications</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
          Realtime disaster alerts and restoration progress
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="alerts" className="h-full flex flex-col">
          <TabsList className="justify-start px-6 pt-2 bg-transparent border-b border-border rounded-none w-full">
            <TabsTrigger value="alerts" className="gap-2 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Alerts
              {pushNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] font-black">{pushNotifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Damage Reports
              {damageReports.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] font-black">{damageReports.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Retrieving alerts...</span>
              </div>
            ) : pushNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                <Bell className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No alerts active</p>
              </div>
            ) : (
              pushNotifications.map(notif => (
                <div key={notif.id} className="bg-card border border-border rounded-xl p-5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg shadow-inner flex-shrink-0">
                      <AlertTriangle className={`w-5 h-5 ${SEVERITY_COLORS[notif.severity] || "text-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm tracking-tight">{notif.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.body}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        {notif.severity && (
                          <Badge className="text-[9px] font-black uppercase tracking-wider" variant="outline">
                            {notif.severity}
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wide">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {notif.is_delivered && (
                      <Badge className="text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 border-green-500/20">Delivered</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Loading reports...</span>
              </div>
            ) : damageReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No active reports</p>
              </div>
            ) : (
              damageReports.map(report => (
                <div key={report.id} className="bg-card border border-border rounded-xl p-5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg shadow-inner flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm tracking-tight">{report.heritage_site_name}</h3>
                      <p className="text-xs font-black uppercase text-red-500/80 tracking-widest mt-1">{report.damage_level} damage</p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/50">
                        <Badge className={`text-[10px] font-black uppercase tracking-wider gap-1.5 border py-0.5 px-2 ${STATUS_COLORS[report.status] || ""}`}>
                          {STATUS_ICONS[report.status]}
                          {report.status}
                        </Badge>
                        {report.reported_by && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Reported by {report.reported_by}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wide ml-auto">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}