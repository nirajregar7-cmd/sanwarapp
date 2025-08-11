import { bookings } from '../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { 
  sendBookingReminderEmail, 
  sendBookingCompletionEmail, 
  getBookingNotificationData 
} from './email-notifications';

// Check for bookings that need 2-hour reminders
export async function checkAndSendReminders() {
  try {
    // Import storage here to avoid circular dependency issues
    const storageModule = await import('./storage');
    const { db } = storageModule.storage;
    
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursFifteenMinFromNow = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);
    
    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];
    
    // Get bookings that are scheduled 2 hours from now (with 15-minute window)  
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
        console.log(`⏰ Reminder sent for booking ${booking.id}`);
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
    // Import storage here to avoid circular dependency issues
    const storageModule = await import('./storage');
    const { db } = storageModule.storage;
    
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];
    
    // Get bookings that ended within the last 30 minutes
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
      // Update booking status to completed
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

// Start the booking scheduler
export function startBookingScheduler() {
  console.log('📅 Starting booking notification scheduler...');
  
  // Check every 15 minutes for reminders and completions
  const interval = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  setInterval(async () => {
    console.log('🔄 Checking for booking notifications...');
    
    const reminders = await checkAndSendReminders();
    const completions = await checkAndSendCompletionEmails();
    
    if (reminders > 0 || completions > 0) {
      console.log(`📧 Sent ${reminders} reminders and ${completions} completion emails`);
    }
  }, interval);
  
  // Also run immediately on startup
  setTimeout(async () => {
    await checkAndSendReminders();
    await checkAndSendCompletionEmails();
  }, 5000); // Wait 5 seconds after startup
}