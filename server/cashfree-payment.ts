import { Cashfree } from 'cashfree-pg';
import crypto from 'crypto';

// Initialize Cashfree client configuration
if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
  Cashfree.XClientId = process.env.CASHFREE_APP_ID;
  Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
  Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
    ? 'production' 
    : 'sandbox';
}

export const cashfree = process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY ? Cashfree : null;

if (!cashfree) {
  console.warn('Cashfree keys not configured. Payment features will not work.');
} else {
  console.log('✅ Cashfree payment gateway initialized successfully');
}

export interface CreateOrderData {
  amount: number; // in rupees (Cashfree uses actual amount, not paisa)
  currency?: string;
  orderId?: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  orderMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
    paymentMethods?: string;
  };
  orderNote?: string;
}

export async function createCashfreeOrder(data: CreateOrderData) {
  if (!cashfree) {
    throw new Error('Cashfree not configured. Please provide CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  try {
    const orderRequest = {
      order_id: data.orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_amount: data.amount, // Cashfree uses actual amount in rupees
      order_currency: data.currency || 'INR',
      customer_details: {
        customer_id: data.customerDetails.customerId,
        customer_name: data.customerDetails.customerName,
        customer_email: data.customerDetails.customerEmail,
        customer_phone: data.customerDetails.customerPhone,
      },
      order_meta: {
        return_url: data.orderMeta?.returnUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/api/cashfree/callback`,
        notify_url: data.orderMeta?.notifyUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/api/cashfree/webhook`,
        payment_methods: data.orderMeta?.paymentMethods || 'cc,dc,nb,upi,paylater,emi,wallet',
      },
      order_note: data.orderNote || 'Sanwar Salon Booking Payment',
    };

    console.log('Creating Cashfree order:', orderRequest.order_id);
    
    const response = await cashfree.PGCreateOrder("2023-08-01", orderRequest);
    
    if (response.data && response.data.order_id) {
      console.log('✅ Cashfree order created successfully:', response.data.order_id);
      return {
        orderId: response.data.order_id,
        paymentSessionId: response.data.payment_session_id,
        orderStatus: response.data.order_status,
        orderAmount: response.data.order_amount,
        orderCurrency: response.data.order_currency,
      };
    } else {
      throw new Error('Invalid response from Cashfree');
    }
  } catch (error: any) {
    console.error('❌ Error creating Cashfree order:', error);
    if (error.response?.data) {
      console.error('Cashfree API Error:', error.response.data);
      throw new Error(`Cashfree API Error: ${error.response.data.message || 'Unknown error'}`);
    }
    throw new Error('Failed to create payment order. Please check your connection and try again.');
  }
}

export interface PaymentVerificationData {
  orderId: string;
  orderAmount: number;
  referenceId?: string;
  txStatus?: string;
  paymentMode?: string;
  txMsg?: string;
  txTime?: string;
  signature?: string;
}

export async function verifyCashfreePayment(orderId: string): Promise<{
  success: boolean;
  orderStatus?: string;
  transactionId?: string;
  paymentAmount?: number;
  paymentTime?: string;
  paymentMode?: string;
  error?: string;
}> {
  if (!cashfree) {
    return {
      success: false,
      error: 'Cashfree not configured'
    };
  }

  try {
    console.log('Verifying Cashfree payment for order:', orderId);
    
    const response = await cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    
    if (response.data && response.data.length > 0) {
      const payment = response.data[0]; // Get the latest payment
      
      console.log('✅ Cashfree payment verified:', {
        orderId,
        status: payment.payment_status,
        transactionId: payment.cf_payment_id
      });
      
      return {
        success: true,
        orderStatus: payment.payment_status,
        transactionId: payment.cf_payment_id,
        paymentAmount: payment.payment_amount,
        paymentTime: payment.payment_time,
        paymentMode: payment.payment_method_type || 'unknown'
      };
    } else {
      return {
        success: false,
        error: 'No payment found for this order'
      };
    }
  } catch (error: any) {
    console.error('❌ Error verifying Cashfree payment:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to verify payment'
    };
  }
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  if (!process.env.CASHFREE_SECRET_KEY) {
    console.error('CASHFREE_SECRET_KEY not configured');
    return false;
  }

  try {
    // Cashfree webhook signature verification
    const signedPayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(signedPayload)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Cashfree webhook signature:', error);
    return false;
  }
}

// Refund functionality
export interface RefundData {
  orderId: string;
  refundAmount: number;
  refundNote?: string;
  refundSpeed?: 'STANDARD' | 'INSTANT';
}

export async function processCashfreeRefund(data: RefundData): Promise<{
  success: boolean;
  refundId?: string;
  refundStatus?: string;
  error?: string;
}> {
  if (!cashfree) {
    return {
      success: false,
      error: 'Cashfree not configured'
    };
  }

  try {
    const refundRequest = {
      refund_amount: data.refundAmount,
      refund_id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refund_note: data.refundNote || 'Booking cancellation refund',
      refund_speed: data.refundSpeed || 'STANDARD',
    };

    console.log('Processing Cashfree refund for order:', data.orderId);
    
    const response = await cashfree.PGOrderCreateRefund("2023-08-01", data.orderId, refundRequest);
    
    if (response.data && response.data.refund_id) {
      console.log('✅ Cashfree refund processed:', response.data.refund_id);
      
      return {
        success: true,
        refundId: response.data.refund_id,
        refundStatus: response.data.refund_status,
      };
    } else {
      throw new Error('Invalid refund response from Cashfree');
    }
  } catch (error: any) {
    console.error('❌ Error processing Cashfree refund:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to process refund'
    };
  }
}

export default cashfree;