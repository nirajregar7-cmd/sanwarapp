import { bookings, users, notificationHistory } from '../shared/schema';
import { eq, and, gte, lte, lt, desc, sql } from 'drizzle-orm';
import { 
  sendBookingReminderEmail, 
  sendBookingCompletionEmail, 
  getBookingNotificationData 
} from './email-notifications';
import {
  notifyCustomerAutoCancel,
  notifyCustomer30MinReminder,
  notifyReEngagement,
} from './notifications';

// Auto-cancel pending bookings that haven't been responded to in 3 minutes
export async function checkAndAutoCancelPendingBookings() {
  try {
    const { db } = (await import('./storage')).storage;
    
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    const stalePending = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'pending'),
          lt(bookings.createdAt, threeMinutesAgo)
        )
      );

    for (const booking of stalePending) {
      await db
        .update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, booking.id));

      // Notify customer
      try {
        await notifyCustomerAutoCancel(booking.id);
        console.log(`⚠️ Auto-cancelled booking ${booking.id} (no owner response)`);
      } catch (notifErr) {
        console.error('Auto-cancel notification error:', notifErr);
      }
    }

    return stalePending.length;
  } catch (error) {
    console.error('❌ Error in auto-cancel check:', error);
    return 0;
  }
}

// Check for confirmed bookings starting in 25–35 minutes and send 30-min push reminder
export async function checkAndSend30MinReminders() {
  try {
    const { db } = (await import('./storage')).storage;
    
    const now = new Date();
    const in25Min = new Date(now.getTime() + 25 * 60 * 1000);
    const in35Min = new Date(now.getTime() + 35 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    const toFormat = (d: Date) => d.toTimeString().slice(0, 5);

    const upcoming = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.date, today),
          eq(bookings.status, 'confirmed'),
          gte(bookings.startTime, toFormat(in25Min)),
          lte(bookings.startTime, toFormat(in35Min))
        )
      );

    for (const booking of upcoming) {
      try {
        await notifyCustomer30MinReminder(booking.id);
        console.log(`⏰ 30-min reminder sent for booking ${booking.id}`);
      } catch (e) {
        console.error('30-min reminder error:', e);
      }
    }

    return upcoming.length;
  } catch (error) {
    console.error('❌ Error in 30-min reminder check:', error);
    return 0;
  }
}

// Check for bookings that need 2-hour reminders (email)
export async function checkAndSendReminders() {
  try {
    const { db } = (await import('./storage')).storage;
    
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursFifteenMinFromNow = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];
    
    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.date, today),
          eq(bookings.status, 'confirmed'),
          gte(bookings.startTime, twoHoursFromNow.toTimeString().slice(0, 5)),
          lte(bookings.startTime, twoHoursFifteenMinFromNow.toTimeString().slice(0, 5))
        )
      );

    for (const booking of upcomingBookings) {
      const notificationData = await getBookingNotificationData(booking.id);
      if (notificationData) {
        await sendBookingReminderEmail(notificationData);
        console.log(`📧 2hr reminder sent for booking ${booking.id}`);
      }
    }

    return upcomingBookings.length;
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
    return 0;
  }
}

// Check for completed bookings and send completion emails
export async function checkAndSendCompletionEmails() {
  try {
    const { db } = (await import('./storage')).storage;
    
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const today = now.toISOString().split('T')[0];
    
    const recentlyCompletedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.date, today),
          eq(bookings.status, 'confirmed'),
          lte(bookings.endTime, now.toTimeString().slice(0, 5)),
          gte(bookings.endTime, thirtyMinutesAgo.toTimeString().slice(0, 5))
        )
      );

    for (const booking of recentlyCompletedBookings) {
      await db
        .update(bookings)
        .set({ status: 'completed' })
        .where(eq(bookings.id, booking.id));

      const notificationData = await getBookingNotificationData(booking.id);
      if (notificationData) {
        await sendBookingCompletionEmail(notificationData);
        console.log(`✨ Completion email sent for booking ${booking.id}`);
      }
    }

    return recentlyCompletedBookings.length;
  } catch (error) {
    console.error('❌ Error checking completions:', error);
    return 0;
  }
}

// Re-engagement: notify users who haven't received any notification in 3-5 days
// Max 1-2 times per week per user
export async function checkAndSendReEngagement() {
  try {
    const { db } = (await import('./storage')).storage;

    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all active users 
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userType, 'customer'));

    let sent = 0;
    for (const u of allUsers) {
      // Check last notification sent to this user
      const [lastNotif] = await db
        .select({ sentAt: notificationHistory.sentAt })
        .from(notificationHistory)
        .where(eq(notificationHistory.userId, u.id))
        .orderBy(desc(notificationHistory.sentAt))
        .limit(1);

      const lastSent = lastNotif?.sentAt;
      
      // Only notify if last notification was 4+ days ago
      if (lastSent && lastSent > fourDaysAgo) continue;
      // Don't notify if they got a re-engagement notification in the last 3 days
      if (!lastSent) continue; // No history — don't spam brand new users

      // Check they haven't booked recently either
      const [recentBooking] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.customerId, u.id),
            gte(bookings.createdAt, sevenDaysAgo)
          )
        )
        .limit(1);

      if (recentBooking) continue; // Active booker, skip

      try {
        await notifyReEngagement(u.id);
        sent++;
        console.log(`📣 Re-engagement notification sent to user ${u.id}`);
      } catch (e) {
        console.error('Re-engagement error for user', u.id, e);
      }

      // Limit batch size
      if (sent >= 50) break;
    }

    return sent;
  } catch (error) {
    console.error('❌ Error in re-engagement check:', error);
    return 0;
  }
}

// Start the booking scheduler
export function startBookingScheduler() {
  console.log('📅 Starting booking notification scheduler...');
  
  // Every 1 minute: auto-cancel stale pending bookings
  setInterval(async () => {
    const cancelled = await checkAndAutoCancelPendingBookings();
    if (cancelled > 0) console.log(`⚠️ Auto-cancelled ${cancelled} stale pending booking(s)`);
  }, 60 * 1000);

  // Every 5 minutes: 30-min appointment push reminders
  setInterval(async () => {
    const reminded = await checkAndSend30MinReminders();
    if (reminded > 0) console.log(`⏰ Sent ${reminded} 30-min reminder(s)`);
  }, 5 * 60 * 1000);

  // Every 15 minutes: 2-hour email reminders + completion emails
  setInterval(async () => {
    console.log('🔄 Checking for booking notifications...');
    const reminders = await checkAndSendReminders();
    const completions = await checkAndSendCompletionEmails();
    if (reminders > 0 || completions > 0) {
      console.log(`📧 Sent ${reminders} reminders and ${completions} completion emails`);
    }
  }, 15 * 60 * 1000);

  // Every 6 hours: re-engagement for inactive users
  setInterval(async () => {
    const reEngaged = await checkAndSendReEngagement();
    if (reEngaged > 0) console.log(`📣 Re-engaged ${reEngaged} inactive user(s)`);
  }, 6 * 60 * 60 * 1000);

  // Every 6 hours: auto-generate slots for all salons (rolling 30-day coverage)
  setInterval(async () => {
    const { runDailySlotMaintenance } = await import('./slot-auto-generator');
    await runDailySlotMaintenance();
  }, 6 * 60 * 60 * 1000);
  
  // Run immediately on startup (after 5s delay)
  setTimeout(async () => {
    await checkAndAutoCancelPendingBookings();
    await checkAndSendReminders();
    await checkAndSendCompletionEmails();
  }, 5000);

  // Run slot maintenance quickly on startup — ensures ALL salons have slots from the first request
  setTimeout(async () => {
    const { runDailySlotMaintenance } = await import('./slot-auto-generator');
    console.log('[SlotGen] Running startup slot maintenance for all salons...');
    await runDailySlotMaintenance();
    console.log('[SlotGen] Startup slot maintenance complete.');
  }, 3 * 1000);
}
