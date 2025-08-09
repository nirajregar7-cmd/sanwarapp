import twilio from 'twilio';

// Check if we have valid Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not configured. WhatsApp OTP service will not work.');
}

// Only initialize Twilio client if credentials are available and valid
let client: any = null;
if (accountSid && authToken) {
  try {
    // Check if this is an API Key (starts with SK) vs Account SID (starts with AC)
    if (accountSid.startsWith('SK')) {
      // For API Keys, we need to provide the account SID separately
      console.warn('Twilio API Key detected but Account SID missing. Please provide TWILIO_ACCOUNT_SID starting with AC.');
    } else if (accountSid.startsWith('AC')) {
      // Standard Account SID initialization
      client = twilio(accountSid, authToken);
      console.log('Twilio client initialized successfully');
    } else {
      console.error('Invalid Twilio Account SID format. Must start with AC for Account SID or SK for API Key.');
    }
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
} else {
  console.warn('Twilio credentials missing. Please provide TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
}

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export async function sendWhatsAppMessage({ to, body }: WhatsAppMessage): Promise<boolean> {
  try {
    if (!client) {
      console.error('Twilio client not initialized. Please check your credentials.');
      return false;
    }

    // Ensure phone number is in correct format
    const phoneNumber = to.startsWith('+') ? to : `+91${to}`;
    const fromNumber = twilioPhoneNumber || 'whatsapp:+14155238886'; // Twilio sandbox number

    const message = await client.messages.create({
      body,
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: `whatsapp:${phoneNumber}`,
    });

    console.log(`WhatsApp message sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendPasswordResetOTP(phone: string, otp: string): Promise<boolean> {
  const message = `🔐 Sanwar Password Reset\n\nYour OTP is: ${otp}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.\n\n- Sanwar Team`;
  
  return await sendWhatsAppMessage({
    to: phone,
    body: message
  });
}