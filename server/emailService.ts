import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not configured. Email service will not work.');
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from = 'noreply@sanwarhub.in' }: EmailMessage): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    const msg = {
      to,
      from,
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateBookingConfirmationEmail(customerName: string, salonName: string, serviceName: string, date: string, time: string, amount: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-card { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .amount { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>Your salon appointment has been confirmed</p>
        </div>
        
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <p>Great news! Your booking at <strong>${salonName}</strong> has been confirmed. Here are your appointment details:</p>
          
          <div class="booking-card">
            <div class="detail-row">
              <span class="label">Salon:</span>
              <span class="value">${salonName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">${serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${new Date(date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${time}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Paid:</span>
              <span class="value amount">₹${amount}</span>
            </div>
          </div>
          
          <p><strong>Important Notes:</strong></p>
          <ul>
            <li>Please arrive 10 minutes before your scheduled time</li>
            <li>The remaining service amount will be paid at the salon</li>
            <li>If you need to cancel or reschedule, please do so at least 2 hours in advance</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="https://sanwarhub.in/bookings" class="button">View My Bookings</a>
          </div>
          
          <p>Thank you for choosing Sanwar! We're excited to serve you.</p>
          
          <div class="footer">
            <p>This is an automated confirmation email from Sanwar - Smart Salon Booking Platform</p>
            <p>For support, contact us at support@sanwarhub.in</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateBookingCancellationEmail(customerName: string, salonName: string, serviceName: string, date: string, time: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-card { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Booking Cancelled</h1>
          <p>Your salon appointment has been cancelled</p>
        </div>
        
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <p>Your booking at <strong>${salonName}</strong> has been successfully cancelled. Here are the details:</p>
          
          <div class="booking-card">
            <div class="detail-row">
              <span class="label">Salon:</span>
              <span class="value">${salonName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">${serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${new Date(date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${time}</span>
            </div>
          </div>
          
          <p>We're sorry to see you go! We hope to serve you again soon.</p>
          
          <div style="text-align: center;">
            <a href="https://sanwarhub.in/" class="button">Book Another Appointment</a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>This is an automated email from Sanwar - Smart Salon Booking Platform</p>
            <p>For support, contact us at support@sanwarhub.in</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}