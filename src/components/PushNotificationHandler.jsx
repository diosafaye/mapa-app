import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient"; // Make sure this path is correct
import { toast } from "sonner";
import { PushNotifications } from "@capacitor/push-notifications";

const SEVERITY_COLORS = {
  "Critical Emergency": "#7c3aed",
  "Warning": "#ef4444",
  "Watch": "#f59e0b",
  "Advisory": "#3b82f6"
};

export default function PushNotificationHandler() {
  const deliveredIds = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Request browser permission (Web only)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // 2. Subscribe to Supabase Realtime
    const channel = supabase
      .channel('push-notifications-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'PushNotifications' 
      }, async (payload) => {
        const notif = payload.new;
        
        if (!notif || deliveredIds.current.has(notif.id)) return;
        deliveredIds.current.add(notif.id);

        const color = SEVERITY_COLORS[notif.severity] || "#ef4444";

        // In-app Toast
        toast(notif.title, {
          description: notif.body,
          duration: 8000,
          style: { borderLeft: `4px solid ${color}` },
          action: {
            label: "View Alerts",
            onClick: () => navigate("/alerts")
          }
        });

        // Browser Push Notification (Web)
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notif.title, {
            body: notif.body,
            icon: "/favicon.ico",
            tag: notif.id,
            renotify: true
          });
        }

        // Native Push Notification (Capacitor/Android)
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          try {
            await PushNotifications.show({
              id: Math.floor(Math.random() * 1000),
              title: notif.title,
              body: notif.body
            });
          } catch (e) {
            console.error("Native notification failed", e);
          }
        }

        // Mark as delivered in Database
        try {
          await supabase
            .from('PushNotifications')
            .update({ is_delivered: true })
            .eq('id', notif.id);
        } catch (error) {
          console.error("Failed to mark notification as delivered:", error);
        }
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  return null;
}