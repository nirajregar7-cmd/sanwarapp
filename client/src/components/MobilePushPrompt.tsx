import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getDeviceType } from "@/hooks/usePWA";

const DISMISSED_KEY = "push-prompt-dismissed-at";
const RE_SHOW_DAYS = 3;

function wasDismissedRecently(): boolean {
  const t = localStorage.getItem(DISMISSED_KEY);
  if (!t) return false;
  return (Date.now() - Number(t)) / 86400000 < RE_SHOW_DAYS;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export function MobilePushPrompt() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const device = getDeviceType();

  const userType = (user as any)?.userType;

  useEffect(() => {
    if (!isAuthenticated || userType === "salon_owner" || userType === "admin" || userType === "super_admin") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      // Already granted — silently ensure SW + subscription registered
      autoSubscribeIfNeeded();
      return;
    }
    if (Notification.permission === "denied") return;
    if (wasDismissedRecently()) return;

    // Show prompt after a short delay so it doesn't pop immediately
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, userType]);

  async function autoSubscribeIfNeeded() {
    try {
      const reg = await getOrRegisterSW();
      if (!reg) return;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        return;
      }
      const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!key) return;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      await apiRequest("POST", "/api/notifications/subscribe", { subscription: JSON.stringify(sub) });
      setSubscribed(true);
    } catch {
      // Silent — user likely denied or not supported
    }
  }

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("denied");

      const reg = await getOrRegisterSW();
      if (!reg) throw new Error("sw_failed");

      const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("no_key");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await apiRequest("POST", "/api/notifications/subscribe", { subscription: JSON.stringify(sub) });
      return sub;
    },
    onSuccess: () => {
      setSubscribed(true);
      setVisible(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
    },
    onError: () => {
      setVisible(false);
    },
  });

  const handleEnable = () => {
    if (device === "ios") {
      const isInstalled = (window.navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
      if (!isInstalled) {
        setShowIOSGuide(true);
        return;
      }
    }
    subscribeMutation.mutate();
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  if (subscribed || !visible) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-purple-200 rounded-2xl shadow-xl p-5 animate-in slide-in-from-bottom-4">
        <button onClick={() => setShowIOSGuide(false)} className="absolute top-3 right-3 text-gray-400">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Install Sanwar on your iPhone</p>
            <p className="text-xs text-gray-500">Required to get notifications on iOS</p>
          </div>
        </div>
        <ol className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Tap the <Share className="h-4 w-4 inline text-blue-500" /> <strong>Share</strong> button at the bottom of Safari</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="h-4 w-4 inline text-gray-600" /></span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Open Sanwar from your home screen, then allow notifications</span>
          </li>
        </ol>
        <Button onClick={dismiss} variant="outline" className="w-full mt-4 text-sm">Got it</Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-4">
      <button onClick={dismiss} className="absolute top-3 right-3 text-purple-200 hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-semibold text-white text-sm">Get booking alerts on your phone</p>
          <p className="text-purple-200 text-xs mt-0.5 leading-relaxed">
            Receive instant notifications when your booking is confirmed, rejected, or rescheduled — just like WhatsApp
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={subscribeMutation.isPending}
              className="bg-white text-purple-700 hover:bg-purple-50 font-semibold text-xs h-8 px-4"
            >
              {subscribeMutation.isPending ? "Enabling..." : "Enable Notifications"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
