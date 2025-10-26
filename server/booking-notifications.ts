import { storage } from "./storage";
import { bookings, salons, services, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from './emailService';

export interface BookingEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  salonName: string;
  salonEmail?: string;
  salonPhone?: string;
  salonAddress?: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  confirmationAmount: number;
  remainingAmount: number;
}

// Get booking data for email notifications
export async function getBookingEmailData(bookingId: string): Promise<BookingEmailData | null> {
  try {
    const [bookingData] = await storage.db
      .select({
        booking: bookings,
        customer: users,
        salon: salons,
        service: services,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, bookingId));

    if (!bookingData) {
      console.error('Booking not found for email notification:', bookingId);
      return null;
    }

    // Get salon owner separately
    const [ownerData] = await storage.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
      })
      .from(users)
      .where(eq(users.id, bookingData.salon.ownerId));

    if (!bookingData) {
      console.error('Booking not found for email notification:', bookingId);
      return null;
    }

    return {
      bookingId: bookingData.booking.id,
      customerName: bookingData.customer.firstName || 'Customer',
      customerEmail: bookingData.customer.email || '',
      salonName: bookingData.salon.name,
      salonEmail: ownerData?.email || undefined,
      salonPhone: bookingData.salon.phone || undefined,
      salonAddress: bookingData.salon.address || undefined,
      serviceName: bookingData.service.name,
      date: bookingData.booking.date,
      startTime: bookingData.booking.startTime,
      endTime: bookingData.booking.endTime,
      totalAmount: parseFloat(bookingData.service.price),
      confirmationAmount: parseFloat(bookingData.booking.confirmationAmount) / 100 || 3, // Dynamic confirmation fee from booking
      remainingAmount: parseFloat(bookingData.service.price), // Full service amount to be paid at salon (confirmation fee is separate)
    };
  } catch (error) {
    console.error('Error fetching booking data for email:', error);
    return null;
  }
}

// Generate customer confirmation email HTML
function generateCustomerConfirmationEmail(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .booking-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #495057; }
            .detail-value { color: #212529; }
            .payment-info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .success-badge { background: #4caf50; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
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
                <p>Great news! Your booking at <strong>${data.salonName}</strong> has been confirmed.</p>
                
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
                        <span class="detail-value">${new Date(data.date).toLocaleDateString('en-IN', { 
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
                    </div>
                    ` : ''}
                    ${data.salonPhone ? `
                    <div class="detail-row">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${data.salonPhone}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="payment-info">
                    <h3 style="margin: 0 0 10px 0; color: #1976d2;">💳 Payment Information</h3>
                    <p style="margin: 5px 0;"><strong>Confirmation Fee (Paid Online):</strong> ₹${data.confirmationAmount}</p>
                    <p style="margin: 5px 0;"><strong>Service Fee (Pay at Salon):</strong> ₹${data.totalAmount}</p>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">
                        <strong>Note:</strong> The confirmation fee is separate from the service fee. 
                        You will pay the full service amount (₹${data.totalAmount}) when you visit the salon.
                    </p>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #856404;">📋 Important Reminders</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        <li>Please arrive 10 minutes before your appointment time</li>
                        <li>Bring a valid ID for verification</li>
                        <li>Inform the salon if you need to reschedule</li>
                        <li>Pay the remaining service amount at the salon</li>
                    </ul>
                </div>

                <p>Thank you for choosing Sanwar! We hope you have a wonderful experience.</p>
                
                <div class="footer">
                    <p>This is an automated message from Sanwar Booking Platform</p>
                    <p>For support, contact us at support@sanwar.in</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Generate shopkeeper notification email HTML
function generateShopkeeperNotificationEmail(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .booking-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #495057; }
            .detail-value { color: #212529; }
            .revenue-info { background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .action-required { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 New Booking Received!</h1>
                <p>You have a new customer appointment</p>
            </div>
            
            <div class="content">
                <p>Dear ${data.salonName} Team,</p>
                <p>You have received a new booking! Here are the details:</p>
                
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="detail-label">Booking ID:</span>
                        <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span class="detail-value">${data.customerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">${data.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date(data.date).toLocaleDateString('en-IN', { 
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
                        <span class="detail-label">Customer Email:</span>
                        <span class="detail-value">${data.customerEmail}</span>
                    </div>
                </div>

                <div class="revenue-info">
                    <h3 style="margin: 0 0 10px 0; color: #388e3c;">💰 Payment Details</h3>
                    <p style="margin: 5px 0;"><strong>Confirmation Fee (Paid Online):</strong> ₹${data.confirmationAmount}</p>
                    <p style="margin: 5px 0;"><strong>Service Fee to Collect:</strong> ₹${data.remainingAmount}</p>
                    <p style="margin: 5px 0;"><strong>Total Service Value:</strong> ₹${data.totalAmount}</p>
                </div>

                <div class="action-required">
                    <h3 style="margin: 0 0 10px 0; color: #856404;">📋 Action Required</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        <li><strong>Prepare for the appointment</strong> - Ensure staff and equipment are ready</li>
                        <li><strong>Collect remaining payment</strong> - ₹${data.remainingAmount} at the salon</li>
                        <li><strong>Verify customer identity</strong> - Check ID when customer arrives</li>
                        <li><strong>Update booking status</strong> - Mark as completed after service</li>
                    </ul>
                </div>

                <p>The customer has paid the confirmation fee of ₹${data.confirmationAmount}. Please collect the full service fee of ₹${data.remainingAmount} when they arrive for their appointment.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://sanwar.in/shopkeeper/dashboard" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Dashboard</a>
                </div>
                
                <div class="footer">
                    <p>This is an automated notification from Sanwar Booking Platform</p>
                    <p>For support, contact us at support@sanwar.in</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Send booking confirmation emails to both customer and shopkeeper
export async function sendBookingNotificationEmails(bookingId: string): Promise<{ customerSent: boolean, shopkeeperSent: boolean }> {
  try {
    console.log('📧 Sending booking notification emails for:', bookingId);
    
    const bookingData = await getBookingEmailData(bookingId);
    if (!bookingData) {
      console.error('❌ Could not fetch booking data for email notifications');
      return { customerSent: false, shopkeeperSent: false };
    }

    // Send customer confirmation email
    const customerEmailSent = await sendEmail({
      to: bookingData.customerEmail,
      subject: `✅ Booking Confirmed - ${bookingData.salonName} | Sanwar`,
      html: generateCustomerConfirmationEmail(bookingData),
    });

    // Shopkeeper emails are disabled - they will not receive booking notifications
    const shopkeeperEmailSent = false;
    console.log('⚠️ Shopkeeper booking emails are disabled - Only customer receives confirmation');

    console.log(`📧 Email notifications sent - Customer: ${customerEmailSent}, Shopkeeper: ${shopkeeperEmailSent}`);
    
    return {
      customerSent: customerEmailSent,
      shopkeeperSent: shopkeeperEmailSent
    };

  } catch (error) {
    console.error('❌ Error sending booking notification emails:', error);
    return { customerSent: false, shopkeeperSent: false };
  }
}