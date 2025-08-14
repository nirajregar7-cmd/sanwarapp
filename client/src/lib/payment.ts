// Cashfree Payment Integration for Sanwar

declare global {
  interface Window {
    Cashfree: any;
  }
}

export interface CashfreeOrderData {
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  gateway: 'cashfree';
}

export interface PaymentOptions {
  orderData: CashfreeOrderData;
  customerDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  onSuccess: (data: any) => void;
  onFailure: (data: any) => void;
}

// Load Cashfree SDK
export const loadCashfreeSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      console.log('✅ Cashfree SDK already loaded');
      resolve();
      return;
    }

    console.log('📦 Loading Cashfree SDK...');
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Cashfree SDK loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load Cashfree SDK');
      reject(new Error('Failed to load Cashfree SDK'));
    };
    document.head.appendChild(script);
  });
};

// Initialize payment with Cashfree Checkout
export const initiateCashfreePayment = async (options: PaymentOptions) => {
  try {
    // Load Cashfree SDK
    await loadCashfreeSDK();

    if (!window.Cashfree) {
      throw new Error('Cashfree SDK not loaded');
    }

    // Initialize Cashfree with production environment
    const cashfree = window.Cashfree({
      mode: 'production'
    });

    const checkoutOptions = {
      paymentSessionId: options.orderData.paymentSessionId,
      redirectTarget: '_parent', // Use _parent to avoid iframe restrictions
      theme: {
        color: '#8B5CF6',
        backgroundColor: '#ffffff'
      },
      appearance: {
        hideOrderSummary: false,
        hideCouponField: true
      }
    };

    console.log('🚀 Initiating Cashfree checkout with options:', checkoutOptions);
    
    // Open Cashfree checkout
    cashfree.checkout(checkoutOptions).then((result: any) => {
      console.log('💳 Cashfree checkout result:', result);
      
      if (result.error) {
        console.error('❌ Cashfree payment error:', result.error);
        options.onFailure(result.error);
      }
      
      if (result.redirect) {
        console.log('🔄 Cashfree payment redirect:', result.redirect);
        // Handle redirect if needed
      }
      
      if (result.paymentDetails) {
        console.log('✅ Cashfree payment success:', result.paymentDetails);
        options.onSuccess(result.paymentDetails);
      }
    }).catch((error: any) => {
      console.error('💥 Cashfree checkout error:', error);
      options.onFailure({ error: error.message || 'Checkout failed to open' });
    });

  } catch (error) {
    console.error('💥 Error initiating Cashfree payment:', error);
    options.onFailure({ 
      error: error instanceof Error ? error.message : 'Failed to load payment interface',
      details: 'Please try again or contact support if the issue persists'
    });
  }
};

// Verify payment status
export const verifyCashfreePayment = async (orderId: string) => {
  try {
    const response = await fetch('/api/bookings/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};