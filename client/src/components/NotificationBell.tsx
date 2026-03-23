import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, Check, CheckCheck, Clock, X, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  bookingId: string | null;
  sentAt: string;
  isRead: boolean;
  actionUrl: string | null;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "booking_request": return "⏳";
    case "booking_accepted": return "✅";
    case "booking_rejected": return "❌";
    case "booking_rescheduled": return "🔁";
    case "booking_auto_cancelled": return "⚠️";
    case "appointment_reminder": return "⏰";
    case "booking_confirmation": return "✅";
    case "booking_reminder": return "⏰";
    case "day_before_reminder": return "📅";
    case "hour_before_reminder": return "⏰";
    case "re_engagement": return "✂️";
    case "promotional": return "💸";
    default: return "🔔";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getNotificationColor(type: string) {
  switch (type) {
    case "booking_accepted": return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
    case "booking_rejected":
    case "booking_auto_cancelled": return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
    case "booking_rescheduled": return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20";
    case "appointment_reminder":
    case "hour_before_reminder": return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20";
    default: return "border-l-purple-500 bg-purple-50 dark:bg-purple-950/20";
  }
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: notifications, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["/api/notifications/history"],
    enabled: isAuthenticated && open,
    refetchInterval: open ? 15000 : false,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/history"] });
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/history"] });
    },
  });

  // Mark all read when opening the panel
  const handleOpen = () => {
    setOpen(true);
    if (unreadData && unreadData.count > 0) {
      setTimeout(() => markAllReadMutation.mutate(), 1500);
    }
  };

  if (!isAuthenticated) return null;

  const unreadCount = unreadData?.count ?? 0;

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-[ring_0.5s_ease-in-out]" />
        ) : (
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4 text-purple-600" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-5">
                    {unreadCount}
                  </Badge>
                )}
              </SheetTitle>
              {notifications && notifications.length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending || unreadCount === 0}
                  className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Booking updates and reminders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-800">
                {notifications.map((notif) => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif}
                    onRead={() => {
                      if (!notif.isRead) markOneReadMutation.mutate(notif.id);
                    }}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications && notifications.length > 0 && (
            <div className="px-4 py-3 border-t dark:border-gray-800 flex-shrink-0">
              <p className="text-xs text-center text-gray-400">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NotificationRow({
  notif,
  onRead,
  onClose,
}: {
  notif: NotificationItem;
  onRead: () => void;
  onClose: () => void;
}) {
  const content = (
    <div
      onClick={onRead}
      className={cn(
        "px-4 py-3 cursor-pointer border-l-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
        getNotificationColor(notif.type),
        !notif.isRead && "font-medium"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm leading-snug text-gray-900 dark:text-gray-100", !notif.isRead && "font-semibold")}>
              {notif.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
            {notif.message}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(notif.sentAt)}
          </p>
        </div>
      </div>
    </div>
  );

  if (notif.actionUrl) {
    return (
      <Link href={notif.actionUrl} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}
