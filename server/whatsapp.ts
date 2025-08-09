import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export async function sendWhatsAppMessage({ to, body }: WhatsAppMessage): Promise<boolean> {
  try {
    // Ensure phone number is in correct format
    const phoneNumber = to.startsWith('+') ? to : `+91${to}`;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

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