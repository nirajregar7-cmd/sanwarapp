import crypto from 'crypto';

// Dynamic import for Cashfree SDK (CommonJS module)
let cashfreeInstance: any = null;
let initialized = false;

const initializeCashfree = async () => {
  if (initialized) return cashfreeInstance;
  
  try {
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
      const { Cashfree } = await import('cashfree-pg');
      
      // Create an instance of Cashfree first
      cashfreeInstance = new (Cashfree as any)();
      
      // Set configuration on the instance
      cashfreeInstance.XClientId = process.env.CASHFREE_APP_ID;
      cashfreeInstance.XClientSecret = process.env.CASHFREE_SECRET_KEY;
      
      // Force production environment for production credentials
      const isProdKey = process.env.CASHFREE_SECRET_KEY?.includes('prod');
      cashfreeInstance.XEnvironment = isProdKey ? 'PRODUCTION' : 'SANDBOX';
      
      // Manually set the base path for production
      if (isProdKey) {
        cashfreeInstance.basePath = 'https://api.cashfree.com/pg';
      }
      
      console.log('🔧 Cashfree Environment:', isProdKey ? 'PRODUCTION' : 'SANDBOX');
      console.log('🔧 Cashfree Base URL:', cashfreeInstance.basePath);
      initialized = true;
      console.log('✅ Cashfree payment gateway initialized successfully');
      return cashfreeInstance;
    } else {
      console.warn('Cashfree keys not configured. Payment features will not work.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing Cashfree:', error);
    return null;
  }
};

// Helper function to get the correct base URL
function getBaseUrl(): string {
  // Use the whitelisted domain for Cashfree production
  const prodDomain = 'https://ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev';
  console.log('🌐 Using whitelisted domain for Cashfree:', prodDomain);
  return prodDomain;
}

// Initialize on module load
initializeCashfree();

export const cashfree = cashfreeInstance;

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
  // Ensure Cashfree is initialized
  const cf = await initializeCashfree();
  
  if (!cf) {
    throw new Error('Cashfree not configured. Please provide CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  try {
    const baseUrl = getBaseUrl();
    const returnUrl = data.orderMeta?.returnUrl || `${baseUrl}/payment-success`;
    const notifyUrl = data.orderMeta?.notifyUrl || `${baseUrl}/api/cashfree/webhook`;
    
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
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: data.orderMeta?.paymentMethods || 'cc,dc,nb,upi,paylater,emi,app',
      },
      order_note: data.orderNote || 'Sanwar Salon Booking Payment',
    };

    console.log('Creating Cashfree order:', orderRequest.order_id);
    console.log('📤 Return URL:', returnUrl);
    console.log('📤 Notify URL:', notifyUrl);
    console.log('💰 Order Amount:', orderRequest.order_amount);
    console.log('📋 Full order request:', JSON.stringify(orderRequest, null, 2));
    
    const response = await cf.PGCreateOrder(orderRequest);
    
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
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response?.data) {
      console.error('Cashfree API Error Response:', JSON.stringify(error.response.data, null, 2));
      const errorMsg = error.response.data.message || error.response.data.error_description || 'Unknown Cashfree error';
      throw new Error(`Cashfree API Error: ${errorMsg}`);
    }
    
    throw new Error(`Payment order creation failed: ${error.message}`);
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
  customerId?: string;
  error?: string;
}> {
  console.log('🔍 Verifying payment for order:', orderId);

  // Ensure Cashfree is initialized
  const cf = await initializeCashfree();

  if (!cf) {
    console.error('❌ Cashfree not configured');
    return {
      success: false,
      error: 'Payment gateway not configured'
    };
  }

  try {
    console.log('Verifying Cashfree payment for order:', orderId);
    
    // Fetch both payment and order details
    const [paymentResponse, orderResponse] = await Promise.all([
      cf.PGOrderFetchPayments(orderId),
      cf.PGOrderFetchOrders(orderId)
    ]);
    
    if (paymentResponse.data && paymentResponse.data.length > 0) {
      const payment = paymentResponse.data[0]; // Get the latest payment
      const order = orderResponse.data || {};
      
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
        paymentMode: payment.payment_method_type || 'unknown',
        customerId: order.customer_details?.customer_id
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
    console.error('❌ Cashfree secret key not configured for webhook verification');
    return false;
  }

  try {
    // Cashfree webhook signature format: timestamp.rawBody
    const payload = `${timestamp}.${rawBody}`;
    const computedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(payload)
      .digest('hex');

    const expectedSignature = `sha256=${computedSignature}`;
    
    console.log('🔍 Webhook signature verification:', {
      received: signature,
      expected: expectedSignature,
      matches: signature === expectedSignature
    });

    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

export async function processWebhookData(data: any): Promise<{
  success: boolean;
  orderId?: string;
  orderStatus?: string;
  transactionId?: string;
  paymentAmount?: number;
  error?: string;
}> {
  try {
    console.log('🔄 Processing Cashfree webhook data:', data);

    const eventType = data.type;
    const orderData = data.data?.order || data.data;

    if (!orderData) {
      return {
        success: false,
        error: 'Invalid webhook data: missing order information'
      };
    }

    const result = {
      success: true,
      orderId: orderData.order_id,
      orderStatus: orderData.order_status,
      transactionId: orderData.cf_order_id,
      paymentAmount: parseFloat(orderData.order_amount),
    };

    console.log('✅ Webhook processed successfully:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Error processing webhook data:', error);
    return {
      success: false,
      error: `Failed to process webhook: ${error.message}`
    };
  }
}

export async function refundCashfreePayment(orderId: string, refundAmount?: number): Promise<{
  success: boolean;
  refundId?: string;
  refundStatus?: string;
  error?: string;
}> {
  console.log('🔄 Processing refund for order:', orderId, 'amount:', refundAmount);

  // Ensure Cashfree is initialized
  const cf = await initializeCashfree();

  if (!cf) {
    return {
      success: false,
      error: 'Cashfree not configured'
    };
  }

  try {
    const refundRequest: any = {
      refund_id: `refund_${orderId}_${Date.now()}`,
      refund_note: 'Booking cancellation refund'
    };

    if (refundAmount) {
      refundRequest.refund_amount = refundAmount;
    }

    const response = await cf.PGOrderCreateRefund(orderId, refundRequest);
    
    if (response.data) {
      console.log('✅ Refund processed successfully:', {
        orderId,
        refundId: response.data.refund_id,
        status: response.data.refund_status
      });

      return {
        success: true,
        refundId: response.data.refund_id,
        refundStatus: response.data.refund_status
      };
    } else {
      throw new Error('Invalid refund response from Cashfree');
    }
  } catch (error: any) {
    console.error('❌ Error processing refund:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to process refund'
    };
  }
}

export { initializeCashfree };