// Quick test script to debug Cashfree payment creation
const { createCashfreeOrder } = require('./server/cashfree-payment.ts');

async function testPayment() {
  try {
    console.log('🧪 Testing Cashfree payment order creation...');
    
    const testOrder = await createCashfreeOrder({
      amount: 2,
      orderId: 'test_' + Date.now(),
      customerDetails: {
        customerId: 'test123',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '9999999999'
      },
      orderNote: 'Test booking - ₹2',
      orderMeta: {
        returnUrl: 'https://sanwar-book-nirajregar7.replit.app/payment-callback',
        notifyUrl: 'https://sanwar-book-nirajregar7.replit.app/api/cashfree/webhook',
        paymentMethods: 'upi,nb,cc,dc'
      }
    });
    
    console.log('✅ Success! Order created:', testOrder);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testPayment();