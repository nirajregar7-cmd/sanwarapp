import nodemailer from 'nodemailer';
import { bookings, salons, services, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Email transporter setup using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export interface BookingNotificationData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  salonName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: string;
  confirmationAmount: string;
  salonAddress?: string;
  salonPhone?: string;
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(data: BookingNotificationData) {
  const emailSubject = `🎉 Booking Confirmed - ${data.salonName}`;
  
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .booking-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #495057; }
            .detail-value { color: #212529; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .reminder-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Booking Confirmed!</h1>
                <p>Your appointment has been successfully booked</p>
            </div>
            
            <div class="content">
                <p>Dear ${data.customerName},</p>
                <p>Great news! Your booking at <strong>${data.salonName}</strong> has been confirmed. Here are your appointment details:</p>
                
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="detail-label">Booking ID:</span>
                        <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">${data.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date(data.date).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${data.startTime} - ${data.endTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Salon:</span>
                        <span class="detail-value">${data.salonName}</span>
                    </div>
                    ${data.salonAddress ? `
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.salonAddress}</span>
                    </div>` : ''}
                    ${data.salonPhone ? `
                    <div class="detail-row">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${data.salonPhone}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value"><strong>₹${data.totalAmount}</strong></span>
                    </div>
                </div>
                
                <div class="reminder-box">
                    <strong>📅 Important Reminders:</strong>
                    <ul>
                        <li>You'll receive a reminder email 2 hours before your appointment</li>
                        <li>Please arrive 10 minutes early for your appointment</li>
                        <li>Bring a valid ID for verification</li>
                        <li>Contact the salon if you need to reschedule or cancel</li>
                    </ul>
                </div>
                
                <p>We're excited to serve you! If you have any questions, feel free to contact the salon directly.</p>
                <p>Thank you for choosing Sanwar!</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from Sanwar booking system.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.customerEmail,
      subject: emailSubject,
      html: emailHTML
    });
    
    console.log(`✅ Booking confirmation email sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return false;
  }
}

// Send 2-hour reminder email
export async function sendBookingReminderEmail(data: BookingNotificationData) {
  const emailSubject = `⏰ Reminder: Your appointment in 2 hours - ${data.salonName}`;
  
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .appointment-card { background: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 5px solid #ff9800; }
            .time-highlight { font-size: 24px; font-weight: bold; color: #ff9800; text-align: center; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
            .detail-label { font-weight: 600; color: #495057; }
            .detail-value { color: #212529; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .preparation-tips { background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Appointment Reminder</h1>
                <p>Your appointment is in 2 hours!</p>
            </div>
            
            <div class="content">
                <p>Dear ${data.customerName},</p>
                <p>This is a friendly reminder about your upcoming appointment:</p>
                
                <div class="appointment-card">
                    <div class="time-highlight">
                        Today at ${data.startTime}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">${data.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Salon:</span>
                        <span class="detail-value">${data.salonName}</span>
                    </div>
                    ${data.salonAddress ? `
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.salonAddress}</span>
                    </div>` : ''}
                    ${data.salonPhone ? `
                    <div class="detail-row">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${data.salonPhone}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${data.startTime} - ${data.endTime}</span>
                    </div>
                </div>
                
                <div class="preparation-tips">
                    <h3>📝 Before You Go:</h3>
                    <ul>
                        <li>Arrive 10 minutes early</li>
                        <li>Bring a valid ID</li>
                        <li>Wear comfortable clothing</li>
                        <li>Let us know if you're running late</li>
                    </ul>
                </div>
                
                <p><strong>Need to reschedule or cancel?</strong> Please contact the salon as soon as possible.</p>
                <p>We look forward to seeing you soon!</p>
            </div>
            
            <div class="footer">
                <p>Booking ID: #${data.bookingId.substring(0, 8).toUpperCase()}</p>
                <p>This is an automated reminder from Sanwar booking system.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.customerEmail,
      subject: emailSubject,
      html: emailHTML
    });
    
    console.log(`⏰ Reminder email sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    return false;
  }
}

// Send booking completion email
export async function sendBookingCompletionEmail(data: BookingNotificationData) {
  const emailSubject = `✨ Service Completed - Thank you! - ${data.salonName}`;
  
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .completion-card { background: #f1f8e9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 5px solid #4caf50; }
            .rating-section { background: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .thank-you { font-size: 18px; color: #4caf50; font-weight: bold; text-align: center; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✨ Service Completed!</h1>
                <p>Thank you for visiting us</p>
            </div>
            
            <div class="content">
                <p>Dear ${data.customerName},</p>
                
                <div class="thank-you">
                    🙏 Thank you for choosing ${data.salonName}!
                </div>
                
                <div class="completion-card">
                    <h3>Service Summary:</h3>
                    <p><strong>Service:</strong> ${data.serviceName}</p>
                    <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
                    <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
                </div>
                
                <div class="rating-section">
                    <h3>🌟 How was your experience?</h3>
                    <p>Your feedback helps us improve our services and helps other customers make informed decisions.</p>
                    <a href="#" class="button">Rate Your Experience</a>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                    <li>📱 Save our contact details for future bookings</li>
                    <li>🔔 Enable notifications for special offers and discounts</li>
                    <li>👥 Refer friends and family to earn rewards</li>
                    <li>📅 Book your next appointment in advance</li>
                </ul>
                
                <p>We hope you loved your experience and look forward to serving you again soon!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" class="button">Book Again</a>
                    <a href="#" class="button" style="background: #2196f3;">View Offers</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Booking ID: #${data.bookingId.substring(0, 8).toUpperCase()}</p>
                <p>Thank you for being a valued customer!</p>
                <p>This is an automated message from Sanwar booking system.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.customerEmail,
      subject: emailSubject,
      html: emailHTML
    });
    
    console.log(`✨ Completion email sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending completion email:', error);
    return false;
  }
}

// Get booking data for notifications
export async function getBookingNotificationData(bookingId: string): Promise<BookingNotificationData | null> {
  try {
    // Import storage here to avoid circular dependency issues
    const { storage } = await import('./storage');
    const { db } = storage;
    
    const [booking] = await db
      .select({
        bookingId: bookings.id,
        customerId: bookings.customerId,
        salonId: bookings.salonId,
        serviceId: bookings.serviceId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalAmount: bookings.totalAmount,
        confirmationAmount: bookings.confirmationAmount,
        customerName: users.firstName,
        customerEmail: users.email,
        salonName: salons.name,
        salonAddress: salons.address,
        salonPhone: salons.phone,
        serviceName: services.name
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, bookingId));

    if (!booking || !booking.customerEmail) {
      return null;
    }

    return {
      bookingId: booking.bookingId,
      customerName: booking.customerName || 'Valued Customer',
      customerEmail: booking.customerEmail,
      salonName: booking.salonName || 'Our Salon',
      serviceName: booking.serviceName || 'Service',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      confirmationAmount: booking.confirmationAmount || '0',
      salonAddress: booking.salonAddress,
      salonPhone: booking.salonPhone
    };
  } catch (error) {
    console.error('❌ Error fetching booking notification data:', error);
    return null;
  }
}