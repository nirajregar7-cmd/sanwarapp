import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Bell, 
  BellOff, 
  Check, 
  Clock, 
  Calendar, 
  MessageSquare,
  Smartphone,
  Mail,
  Settings,
  X
} from "lucide-react";

interface NotificationSettings {
  id?: string;
  userId: string;
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  dayBeforeReminder: boolean;
  hourBeforeReminder: boolean;
  promotionalNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  webPushNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationHistory {
  id: string;
  userId: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'day_before_reminder' | 'hour_before_reminder' | 'promotional';
  title: string;
  message: string;
  channel: 'web_push' | 'email' | 'sms';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  bookingId?: string;
  sentAt: string;
  deliveredAt?: string;
}

// Service Worker registration for Web Push
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Request notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Subscribe to push notifications
async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const applicationServerKey = process.env.VITE_VAPID_PUBLIC_KEY;
    if (!applicationServerKey) {
      console.error('VAPID public key not found');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationManagerProps {
  userId?: string;
}

export function NotificationManager({ userId }: NotificationManagerProps) {
  const { toast } = useToast();
  const [isWebPushSupported, setIsWebPushSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  // Check browser support and permissions
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsWebPushSupported(isSupported);
      
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Get notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/notifications/settings", userId],
    enabled: !!userId,
  });

  // Get notification history
  const { data: notificationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/notifications/history", userId],
    enabled: !!userId,
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await apiRequest("PUT", "/api/notifications/settings", newSettings);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Subscribe to web push notifications
  const subscribeToPushMutation = useMutation({
    mutationFn: async () => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Service Worker registration failed');
      }

      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        throw new Error('Push subscription failed');
      }

      // Send subscription to server
      const response = await apiRequest("POST", "/api/notifications/subscribe", {
        subscription: JSON.stringify(subscription)
      });

      return { subscription, response: await response.json() };
    },
    onSuccess: ({ subscription }) => {
      setPushSubscription(subscription);
      setNotificationPermission('granted');
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for your bookings.",
      });
      // Auto-enable web push in settings
      updateSettingsMutation.mutate({ webPushNotifications: true });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to enable push notifications.",
        variant: "destructive",
      });
    },
  });

  // Test notification function
  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Sanwar Test Notification', {
        body: 'This is a test notification from your salon booking app!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification',
        requireInteraction: false
      });
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Please log in to manage your notification preferences.</p>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const currentSettings: NotificationSettings = settings || {
    userId,
    bookingConfirmation: true,
    bookingReminder: true,
    dayBeforeReminder: true,
    hourBeforeReminder: true,
    promotionalNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
    webPushNotifications: false,
  } as NotificationSettings;

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Settings
          </h2>
          <p className="text-gray-600">Manage how you receive booking updates and reminders</p>
        </div>

        {isWebPushSupported && notificationPermission === 'granted' && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Test Notification
          </Button>
        )}
      </div>

      {/* Web Push Setup */}
      {isWebPushSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get instant notifications on your device for booking updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Browser Push Notifications</div>
                <div className="text-sm text-gray-600">
                  {notificationPermission === 'granted' 
                    ? 'Enabled - You\'ll receive push notifications' 
                    : notificationPermission === 'denied'
                      ? 'Blocked - Please enable in browser settings'
                      : 'Not enabled - Click to enable instant notifications'}
                </div>
              </div>
              
              {notificationPermission === 'default' && (
                <Button 
                  onClick={() => subscribeToPushMutation.mutate()}
                  disabled={subscribeToPushMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Enable Push Notifications
                </Button>
              )}
              
              {notificationPermission === 'granted' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
              
              {notificationPermission === 'denied' && (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which notifications you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Booking Confirmations</div>
              <div className="text-sm text-gray-600">Get notified when your booking is confirmed</div>
            </div>
            <Switch
              checked={currentSettings.bookingConfirmation}
              onCheckedChange={(checked) => handleSettingChange('bookingConfirmation', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Booking Reminders</div>
              <div className="text-sm text-gray-600">General reminders about upcoming appointments</div>
            </div>
            <Switch
              checked={currentSettings.bookingReminder}
              onCheckedChange={(checked) => handleSettingChange('bookingReminder', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Day Before Reminders
              </div>
              <div className="text-sm text-gray-600">Remind me 24 hours before my appointment</div>
            </div>
            <Switch
              checked={currentSettings.dayBeforeReminder}
              onCheckedChange={(checked) => handleSettingChange('dayBeforeReminder', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hour Before Reminders
              </div>
              <div className="text-sm text-gray-600">Remind me 1 hour before my appointment</div>
            </div>
            <Switch
              checked={currentSettings.hourBeforeReminder}
              onCheckedChange={(checked) => handleSettingChange('hourBeforeReminder', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Promotional Notifications</div>
              <div className="text-sm text-gray-600">Special offers and promotions from salons</div>
            </div>
            <Switch
              checked={currentSettings.promotionalNotifications}
              onCheckedChange={(checked) => handleSettingChange('promotionalNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Delivery Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </div>
              <div className="text-sm text-gray-600">Receive notifications via email</div>
            </div>
            <Switch
              checked={currentSettings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                SMS Notifications
              </div>
              <div className="text-sm text-gray-600">Receive notifications via text message</div>
            </div>
            <Switch
              checked={currentSettings.smsNotifications}
              onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Notifications
              </div>
              <div className="text-sm text-gray-600">Browser and mobile push notifications</div>
            </div>
            <Switch
              checked={currentSettings.webPushNotifications}
              onCheckedChange={(checked) => handleSettingChange('webPushNotifications', checked)}
              disabled={notificationPermission !== 'granted'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notificationHistory && Array.isArray(notificationHistory) && notificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your notification history from the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(notificationHistory as NotificationHistory[]).slice(0, 10).map((notification: NotificationHistory) => (
                <div key={notification.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.sentAt).toLocaleString()} • {notification.channel}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      notification.status === 'delivered' ? 'default' :
                      notification.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {notification.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NotificationManager;