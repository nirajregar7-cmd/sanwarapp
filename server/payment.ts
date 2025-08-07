import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null;

if (!razorpay) {
  console.warn('Razorpay keys not configured. Payment features will not work.');
}

export interface CreateOrderData {
  amount: number; // in paisa (multiply by 100)
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export async function createRazorpayOrder(data: CreateOrderData) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  try {
    const options = {
      amount: Math.round(data.amount * 100), // Convert to paisa
      currency: data.currency || 'INR',
      receipt: data.receipt || `receipt_${Date.now()}`,
      notes: data.notes || {},
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

export function verifyRazorpayPayment(
  orderCreationId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET not configured');
    return false;
  }

  try {
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');
    return digest === razorpaySignature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}