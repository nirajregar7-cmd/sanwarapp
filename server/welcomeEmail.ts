import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
    },
  });
};

// Alternative SMTP configuration for other providers
const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string,
  userType: 'customer' | 'salon_owner' | 'brand_owner'
): Promise<boolean> => {
  try {
    // Check if email credentials are configured
    if (!process.env.GMAIL_USER && !process.env.SMTP_USER) {
      console.log('Email service not configured - skipping welcome email');
      return false;
    }

    const transporter = process.env.GMAIL_USER ? createTransporter() : createCustomTransporter();

    // Customize welcome message based on user type
    const getWelcomeContent = (type: string) => {
      switch (type) {
        case 'customer':
          return {
            subject: 'Welcome to Sanwar - Your Smart Salon Booking Platform!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6; margin: 0;">Welcome to Sanwar!</h1>
                    <p style="color: #666; font-size: 18px;">Your Smart Salon Booking Platform</p>
                  </div>
                  
                  <h2 style="color: #333;">Hello ${userName},</h2>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Thank you for joining Sanwar! We're excited to help you discover and book the best salon services in your area with just a few clicks.
                  </p>
                  
                  <div style="background-color: #f8f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #8B5CF6; margin-top: 0;">What you can do now:</h3>
                    <ul style="color: #555;">
                      <li>Browse and discover top-rated salons near you</li>
                      <li>Book appointments instantly with real-time availability</li>
                      <li>Enjoy exclusive offers and promotions</li>
                      <li>Rate and review your salon experiences</li>
                      <li>Manage all your bookings in one place</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/" 
                       style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Start Booking Now
                    </a>
                  </div>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Ready to discover your next favorite salon? Browse our featured salons and book your appointment today!
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="color: #888; font-size: 14px;">
                      Best regards,<br>
                      The Sanwar Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
          
        case 'salon_owner':
          return {
            subject: 'Welcome to Sanwar - Start Growing Your Salon Business!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6; margin: 0;">Welcome to Sanwar!</h1>
                    <p style="color: #666; font-size: 18px;">Your Smart Salon Management Platform</p>
                  </div>
                  
                  <h2 style="color: #333;">Hello ${userName},</h2>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Congratulations on joining Sanwar! We're excited to help you take your salon business to the next level with our smart booking platform.
                  </p>
                  
                  <div style="background-color: #f8f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #8B5CF6; margin-top: 0;">What you can do now:</h3>
                    <ul style="color: #555;">
                      <li>Set up your salon profile and services</li>
                      <li>Configure your working hours and time slots</li>
                      <li>Start accepting online bookings</li>
                      <li>Manage your revenue and payouts</li>
                      <li>Connect with brand owners for special offers</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/owner/dashboard" 
                       style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Go to Your Dashboard
                    </a>
                  </div>
                  
                  <p style="color: #555; line-height: 1.6;">
                    If you have any questions, our support team is here to help. Simply reach out through the help section in your dashboard.
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="color: #888; font-size: 14px;">
                      Best regards,<br>
                      The Sanwar Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
          
        case 'brand_owner':
          return {
            subject: 'Welcome to Sanwar - Connect with Salons Across the Platform!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6; margin: 0;">Welcome to Sanwar!</h1>
                    <p style="color: #666; font-size: 18px;">Your Brand Partnership Platform</p>
                  </div>
                  
                  <h2 style="color: #333;">Hello ${userName},</h2>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Welcome to Sanwar! As a brand owner, you're now part of our growing network where you can connect with salon owners and expand your brand reach.
                  </p>
                  
                  <div style="background-color: #f8f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #8B5CF6; margin-top: 0;">What you can do now:</h3>
                    <ul style="color: #555;">
                      <li>Connect with salon owners across the platform</li>
                      <li>Send messages and offers to your partner salons</li>
                      <li>Track your brand performance and analytics</li>
                      <li>Manage revenue sharing with salon partners</li>
                      <li>Create targeted promotional campaigns</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/brand/dashboard" 
                       style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Go to Your Dashboard
                    </a>
                  </div>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Start building valuable partnerships with salon owners and grow your brand presence in the beauty industry.
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="color: #888; font-size: 14px;">
                      Best regards,<br>
                      The Sanwar Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
          
        default:
          return {
            subject: 'Welcome to Sanwar - Your Smart Salon Booking Journey Begins!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6; margin: 0;">Welcome to Sanwar!</h1>
                    <p style="color: #666; font-size: 18px;">Your Smart Salon Booking Platform</p>
                  </div>
                  
                  <h2 style="color: #333;">Hello ${userName},</h2>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Welcome to Sanwar! We're thrilled to have you join our community. Say goodbye to long waits and hello to seamless salon bookings.
                  </p>
                  
                  <div style="background-color: #f8f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #8B5CF6; margin-top: 0;">What you can do now:</h3>
                    <ul style="color: #555;">
                      <li>Browse and discover amazing salons near you</li>
                      <li>Book appointments instantly with real-time availability</li>
                      <li>Get clear pricing upfront - no surprises</li>
                      <li>Manage your bookings and track your appointment history</li>
                      <li>Leave reviews and help others find great salons</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/" 
                       style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Start Exploring Salons
                    </a>
                  </div>
                  
                  <p style="color: #555; line-height: 1.6;">
                    Ready for your first booking? Browse our featured salons and book your perfect appointment in just a few clicks.
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="color: #888; font-size: 14px;">
                      Best regards,<br>
                      The Sanwar Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
      }
    };

    const { subject, html } = getWelcomeContent(userType);

    const mailOptions = {
      from: `"Sanwar Team" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// Send discount card confirmation email
export const sendDiscountCardEmail = async (
  customerEmail: string,
  salonName: string,
  discountPercentage: number,
  cardId: string
): Promise<boolean> => {
  try {
    // Check if email credentials are configured
    if (!process.env.GMAIL_USER && !process.env.SMTP_USER) {
      console.log('Email service not configured - skipping discount card email');
      return false;
    }

    const transporter = process.env.GMAIL_USER ? createTransporter() : createCustomTransporter();

    const mailOptions = {
      from: `"Sanwar Team" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Your Sanwar ${discountPercentage}% Discount Card is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">🎉 Congratulations!</h1>
              <p style="color: #666; font-size: 18px;">Your Sanwar Discount Card is Ready</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h2 style="color: white; margin: 0; font-size: 48px;">${discountPercentage}% OFF</h2>
              <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">on your next visit to</p>
              <p style="color: white; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${salonName}</p>
            </div>
            
            <div style="background-color: #f8f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #8B5CF6; margin-top: 0;">How to use your discount:</h3>
              <ol style="color: #555; line-height: 1.8;">
                <li>Show this email or mention your discount card at ${salonName}</li>
                <li>Enjoy ${discountPercentage}% off on your next visit</li>
                <li>Valid for one-time use only</li>
              </ol>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Card ID:</strong> ${cardId}<br>
                <strong>Salon:</strong> ${salonName}<br>
                <strong>Discount:</strong> ${discountPercentage}% OFF
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-top: 20px;">
              Thank you for choosing ${salonName}! We hope to see you again soon.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #888; font-size: 14px;">
                Best regards,<br>
                The Sanwar Team
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Discount card email sent successfully to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending discount card email:', error);
    return false;
  }
};

// Test email configuration
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    if (!process.env.GMAIL_USER && !process.env.SMTP_USER) {
      console.log('Email service not configured');
      return false;
    }

    const transporter = process.env.GMAIL_USER ? createTransporter() : createCustomTransporter();
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
};