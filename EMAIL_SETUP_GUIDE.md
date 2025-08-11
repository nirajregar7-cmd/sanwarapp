# Welcome Email System Setup Guide

## Overview
The Sanwar platform now includes an automated welcome email system that sends personalized welcome messages to new users when they register. The system supports both Gmail and custom SMTP configurations.

## Features
- ✅ **Personalized Welcome Emails**: Different messages for customers, salon owners, and brand owners
- ✅ **Multiple Authentication Methods**: Works with regular registration, Google OAuth, and Facebook OAuth  
- ✅ **Professional HTML Templates**: Beautiful, responsive email designs
- ✅ **Flexible Configuration**: Supports Gmail and custom SMTP providers
- ✅ **Non-blocking Delivery**: Emails are sent asynchronously to avoid delaying user registration

## Email Templates

### Customer Welcome Email
- **Subject**: "Welcome to Sanwar - Your Smart Salon Booking Journey Begins!"
- **Content**: Introduces the platform, highlights key features like instant booking, and guides them to start exploring salons
- **Call-to-Action**: "Start Exploring Salons" button

### Salon Owner Welcome Email  
- **Subject**: "Welcome to Sanwar - Start Growing Your Salon Business!"
- **Content**: Explains business benefits, lists setup tasks, and encourages dashboard setup
- **Call-to-Action**: "Go to Your Dashboard" button

### Brand Owner Welcome Email
- **Subject**: "Welcome to Sanwar - Connect with Salons Across the Platform!"
- **Content**: Highlights partnership opportunities, revenue sharing, and salon network access
- **Call-to-Action**: "Go to Your Dashboard" button

## Setup Instructions

### Option 1: Gmail Configuration (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Set Environment Variables**:
   ```bash
   GMAIL_USER=your-gmail-address@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   FRONTEND_URL=http://localhost:5000  # or your production URL
   ```

### Option 2: Custom SMTP Configuration

For other email providers (Outlook, Yahoo, custom domains):

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
FRONTEND_URL=http://localhost:5000  # or your production URL
```

### Common SMTP Settings

| Provider | Host | Port | Secure |
|----------|------|------|---------|
| Gmail | smtp.gmail.com | 587 | false |
| Outlook | smtp-mail.outlook.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| SendGrid | smtp.sendgrid.net | 587 | false |

## Testing the Email System

### Development Testing
Use the test endpoint to verify email functionality:

```bash
curl -X POST http://localhost:5000/api/test/welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test User", 
    "userType": "customer"
  }'
```

**Note**: Test endpoint only works in development mode (`NODE_ENV=development`)

### Production Testing
Create a test account through the regular registration flow to verify emails are sent.

## Integration Points

The welcome email system is integrated at these registration points:

1. **Email/Password Registration** (`/api/register` in `server/auth.ts`)
2. **Google OAuth Registration** (Google Strategy in `server/socialAuth.ts`) 
3. **Facebook OAuth Registration** (Facebook Strategy in `server/socialAuth.ts`)

## Error Handling

The system includes comprehensive error handling:

- **Configuration Errors**: Logs when email credentials are missing
- **Delivery Failures**: Catches and logs email delivery errors without blocking registration
- **Graceful Degradation**: Users can still register even if email delivery fails

## Monitoring & Logs

Monitor email delivery through server logs:

```bash
# Successful delivery
Welcome email sent successfully to user@example.com

# Configuration issues  
Email service not configured - skipping welcome email

# Delivery failures
Failed to send welcome email: [error details]
```

## Customization

### Modifying Email Templates
Edit templates in `server/welcomeEmail.ts`:
- Update HTML content in the `getWelcomeContent()` function
- Modify subjects, styling, or call-to-action buttons
- Add new user types or template variations

### Adding New Email Types
1. Create new email template functions in `server/welcomeEmail.ts`
2. Import and call from registration points
3. Add corresponding test endpoints if needed

## Security Considerations

- **App Passwords**: Use Gmail App Passwords instead of regular passwords
- **Environment Variables**: Never commit email credentials to version control
- **Rate Limiting**: Gmail has sending limits (500 emails/day for free accounts)
- **SPF/DKIM**: Configure proper email authentication for production domains

## Troubleshooting

### Common Issues

**"Invalid login" with Gmail**:
- Verify 2FA is enabled
- Use App Password instead of regular password
- Check GMAIL_USER matches the account that generated the App Password

**Emails not sending**:
- Check environment variables are set correctly
- Verify network connectivity to SMTP server
- Review server logs for specific error messages

**Emails going to spam**:
- Set up SPF, DKIM, and DMARC records for your domain
- Use a reputable SMTP service like SendGrid for production
- Include unsubscribe links and proper sender information

### Testing Connectivity

Use the built-in connection test:
```bash
# Check server logs for:
Email service is ready          # ✅ Working
Email service verification failed # ❌ Check configuration
```

## Production Recommendations

1. **Use Professional SMTP Service**: Consider SendGrid, Mailgun, or AWS SES for better deliverability
2. **Custom Domain**: Send from your own domain (e.g., noreply@yourcompany.com)
3. **Email Analytics**: Track open rates, click rates, and delivery status
4. **Unsubscribe Handling**: Add unsubscribe options for marketing emails
5. **Rate Limiting**: Implement proper rate limiting for email sending

## Environment Variables Summary

Add these to your `.env` file:

```bash
# Gmail (Option 1)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Custom SMTP (Option 2) 
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password

# Required for all configurations
FRONTEND_URL=http://localhost:5000
```

The welcome email system is now ready to provide a professional onboarding experience for all new Sanwar users!