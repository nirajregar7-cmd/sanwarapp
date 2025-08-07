import webpush from 'web-push';
import { db } from './db';
import { 
  notificationSettings, 
  notificationHistory, 
  pushSubscriptions,
  bookings,
  salons,
  services,
  users 
} from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

// Configure VAPID keys for web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@sanwar.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  userId: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'day_before_reminder' | 'hour_before_reminder' | 'promotional';
  title: string;
  message: string;
  bookingId?: string;
  data?: Record<string, any>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Send notification through multiple channels
export async function sendNotification(payload: NotificationPayload) {
  try {
    console.log(`Sending notification to user ${payload.userId}: ${payload.title}`);

    // Get user's notification settings
    const [userSettings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, payload.userId));

    if (!userSettings) {
      console.log(`No notification settings found for user ${payload.userId}`);
      return;
    }

    // Check if this type of notification is enabled
    const isTypeEnabled = checkNotificationTypeEnabled(userSettings, payload.type);
    if (!isTypeEnabled) {
      console.log(`Notification type ${payload.type} is disabled for user ${payload.userId}`);
      return;
    }

    const results = [];

    // Send web push notification
    if (userSettings.webPushNotifications) {
      const pushResult = await sendWebPushNotification(payload);
      results.push(pushResult);
    }

    // Send email notification
    if (userSettings.emailNotifications) {
      const emailResult = await sendEmailNotification(payload);
      results.push(emailResult);
    }

    // Send SMS notification
    if (userSettings.smsNotifications) {
      const smsResult = await sendSMSNotification(payload);
      results.push(smsResult);
    }

    console.log(`Notification sent successfully to user ${payload.userId}`);
    return results;

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Check if notification type is enabled in settings
function checkNotificationTypeEnabled(settings: any, type: string): boolean {
  switch (type) {
    case 'booking_confirmation':
      return settings.bookingConfirmation;
    case 'booking_reminder':
      return settings.bookingReminder;
    case 'day_before_reminder':
      return settings.dayBeforeReminder;
    case 'hour_before_reminder':
      return settings.hourBeforeReminder;
    case 'promotional':
      return settings.promotionalNotifications;
    default:
      return false;
  }
}

// Send web push notification
export async function sendWebPushNotification(payload: NotificationPayload) {
  try {
    // Get user's push subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, payload.userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${payload.userId}`);
      return null;
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `${payload.type}-${payload.bookingId || Date.now()}`,
      requireInteraction: payload.type !== 'promotional',
      data: {
        bookingId: payload.bookingId,
        type: payload.type,
        url: payload.bookingId ? `/bookings` : '/',
        ...payload.data
      }
    });

    const results = [];
    
    for (const subscription of subscriptions) {
      try {
        const webpushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey
          }
        };

        await webpush.sendNotification(webpushSubscription, pushPayload);
        
        // Log successful notification
        await logNotification({
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          channel: 'web_push',
          status: 'sent',
          bookingId: payload.bookingId
        });

        results.push({ success: true, channel: 'web_push' });

      } catch (error: any) {
        console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 413) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        }

        await logNotification({
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          channel: 'web_push',
          status: 'failed',
          bookingId: payload.bookingId
        });

        results.push({ success: false, channel: 'web_push', error: error.message });
      }
    }

    return results;

  } catch (error) {
    console.error('Error sending web push notification:', error);
    throw error;
  }
}

// Send email notification
export async function sendEmailNotification(payload: NotificationPayload) {
  try {
    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user || !user.email) {
      console.log(`No email found for user ${payload.userId}`);
      return null;
    }

    // For now, we'll log the email notification
    // In production, integrate with email service like SendGrid, SES, etc.
    console.log(`EMAIL NOTIFICATION:
      To: ${user.email}
      Subject: ${payload.title}
      Body: ${payload.message}
    `);

    await logNotification({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      channel: 'email',
      status: 'sent',
      bookingId: payload.bookingId
    });

    return { success: true, channel: 'email' };

  } catch (error) {
    console.error('Error sending email notification:', error);
    await logNotification({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      channel: 'email',
      status: 'failed',
      bookingId: payload.bookingId
    });
    return { success: false, channel: 'email', error: error };
  }
}

// Send SMS notification
export async function sendSMSNotification(payload: NotificationPayload) {
  try {
    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      console.log(`User not found: ${payload.userId}`);
      return null;
    }

    // For now, we'll log the SMS notification
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS NOTIFICATION:
      To: ${user.phone || 'No phone number'}
      Message: ${payload.title} - ${payload.message}
    `);

    await logNotification({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      channel: 'sms',
      status: user.phone ? 'sent' : 'failed',
      bookingId: payload.bookingId
    });

    return { 
      success: !!user.phone, 
      channel: 'sms', 
      error: !user.phone ? 'No phone number available' : undefined 
    };

  } catch (error) {
    console.error('Error sending SMS notification:', error);
    await logNotification({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      channel: 'sms',
      status: 'failed',
      bookingId: payload.bookingId
    });
    return { success: false, channel: 'sms', error: error };
  }
}

// Log notification to history
async function logNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: 'web_push' | 'email' | 'sms';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  bookingId?: string;
}) {
  try {
    await db.insert(notificationHistory).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      channel: data.channel,
      status: data.status,
      bookingId: data.bookingId,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

// Booking confirmation notification
export async function sendBookingConfirmationNotification(bookingId: string) {
  try {
    // Get booking details with related data
    const [booking] = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        salon: {
          name: salons.name,
          address: salons.address,
          phone: salons.phone
        },
        service: {
          name: services.name,
          price: services.price,
          duration: services.duration
        }
      })
      .from(bookings)
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      console.error(`Booking not found: ${bookingId}`);
      return;
    }

    const payload: NotificationPayload = {
      userId: booking.customerId,
      type: 'booking_confirmation',
      title: 'Booking Confirmed! 🎉',
      message: `Your appointment at ${booking.salon?.name} for ${booking.service?.name} on ${booking.date} at ${booking.startTime} has been confirmed.`,
      bookingId: booking.id,
      data: {
        salonName: booking.salon?.name,
        serviceName: booking.service?.name,
        date: booking.date,
        time: booking.startTime,
        duration: booking.service?.duration,
        address: booking.salon?.address
      }
    };

    return await sendNotification(payload);

  } catch (error) {
    console.error('Error sending booking confirmation notification:', error);
    throw error;
  }
}

// Day before reminder notification
export async function sendDayBeforeReminder(bookingId: string) {
  try {
    const [booking] = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        date: bookings.date,
        startTime: bookings.startTime,
        salon: {
          name: salons.name,
          address: salons.address
        },
        service: {
          name: services.name
        }
      })
      .from(bookings)
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.status, 'confirmed')
      ));

    if (!booking) {
      return;
    }

    const payload: NotificationPayload = {
      userId: booking.customerId,
      type: 'day_before_reminder',
      title: 'Appointment Tomorrow 📅',
      message: `Reminder: You have an appointment at ${booking.salon?.name} tomorrow at ${booking.startTime} for ${booking.service?.name}.`,
      bookingId: booking.id,
      data: {
        salonName: booking.salon?.name,
        serviceName: booking.service?.name,
        date: booking.date,
        time: booking.startTime
      }
    };

    return await sendNotification(payload);

  } catch (error) {
    console.error('Error sending day before reminder:', error);
    throw error;
  }
}

// Hour before reminder notification
export async function sendHourBeforeReminder(bookingId: string) {
  try {
    const [booking] = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        date: bookings.date,
        startTime: bookings.startTime,
        salon: {
          name: salons.name,
          address: salons.address,
          phone: salons.phone
        },
        service: {
          name: services.name
        }
      })
      .from(bookings)
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.status, 'confirmed')
      ));

    if (!booking) {
      return;
    }

    const payload: NotificationPayload = {
      userId: booking.customerId,
      type: 'hour_before_reminder',
      title: 'Appointment Starting Soon ⏰',
      message: `Your appointment at ${booking.salon?.name} starts in 1 hour (${booking.startTime}). Don't forget!`,
      bookingId: booking.id,
      data: {
        salonName: booking.salon?.name,
        serviceName: booking.service?.name,
        address: booking.salon?.address,
        phone: booking.salon?.phone,
        time: booking.startTime
      }
    };

    return await sendNotification(payload);

  } catch (error) {
    console.error('Error sending hour before reminder:', error);
    throw error;
  }
}