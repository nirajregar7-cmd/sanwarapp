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

export interface BankAccountVerificationData {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  accountHolderName?: string;
  message?: string;
  error?: string;
}

export async function verifyBankAccount(data: BankAccountVerificationData): Promise<VerificationResult> {
  if (!razorpay) {
    return {
      success: false,
      verified: false,
      error: 'Razorpay not configured. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    };
  }

  try {
    // Use Razorpay's Fund Account API for verification
    const fundAccountRequest = {
      account_type: 'bank_account',
      bank_account: {
        name: data.accountHolderName,
        account_number: data.accountNumber,
        ifsc: data.ifscCode
      }
    };

    // Create fund account (this validates the bank details)
    const fundAccount = await razorpay.fundAccount.create(fundAccountRequest);
    
    console.log('Bank verification response:', fundAccount);

    // Check if fund account was created successfully
    if (fundAccount.id && fundAccount.active) {
      // Compare account holder names (case-insensitive, ignore extra spaces)
      const normalizeString = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
      const providedName = normalizeString(data.accountHolderName);
      const bankName = normalizeString(fundAccount.bank_account?.name || '');
      
      const nameMatches = providedName === bankName;
      
      return {
        success: true,
        verified: nameMatches,
        accountHolderName: fundAccount.bank_account?.name,
        message: nameMatches 
          ? 'Bank account verified successfully' 
          : 'Account holder name does not match bank records'
      };
    } else {
      return {
        success: true,
        verified: false,
        message: 'Bank account verification failed - invalid account details'
      };
    }
  } catch (error: any) {
    console.error('Error verifying bank account:', error);
    
    // Handle specific Razorpay errors
    if (error.error?.code === 'BAD_REQUEST_ERROR') {
      return {
        success: false,
        verified: false,
        error: 'Invalid bank account details provided'
      };
    }
    
    return {
      success: false,
      verified: false,
      error: 'Failed to verify bank account. Please try again later.'
    };
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