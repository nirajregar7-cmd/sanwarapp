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
  // Additional fields to help prevent risk check failures
  customerDetails?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  // Note: payment methods are configured in Razorpay dashboard
}

export async function createRazorpayOrder(data: CreateOrderData) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  try {
    const options: any = {
      amount: Math.round(data.amount * 100), // Convert to paisa
      currency: data.currency || 'INR',
      receipt: data.receipt || `receipt_${Date.now()}`,
      notes: {
        business_type: 'salon_booking',
        platform: 'sanwar',
        category: 'beauty_wellness',
        purpose: 'booking_confirmation',
        // Keep only essential fields to stay under 15 field limit
        ...(data.notes ? Object.fromEntries(
          Object.entries(data.notes).slice(0, 10) // Limit to 10 additional fields
        ) : {}),
      },
    };

    // Add customer details if provided to help with risk assessment
    if (data.customerDetails?.name) {
      options.notes.customer_name = data.customerDetails.name;
    }
    if (data.customerDetails?.email) {
      options.notes.customer_email = data.customerDetails.email;
    }
    if (data.customerDetails?.contact) {
      options.notes.customer_contact = data.customerDetails.contact;
    }

    // Note: Razorpay's method field is not used in order creation
    // Payment methods are configured in the dashboard or during payment
    // Remove method field to avoid validation errors

    // Add timeout for Razorpay API call
    const orderPromise = razorpay.orders.create(options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Razorpay order creation timeout')), 15000)
    );

    const order = await Promise.race([orderPromise, timeoutPromise]) as any;
    console.log('✅ Razorpay order created successfully:', order.id);
    return order;
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Payment service is currently slow. Please try again in a moment.');
    }
    throw new Error('Failed to create payment order. Please check your connection and try again.');
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

// Automatic Payout System for Salon Owners
export interface PayoutData {
  accountNumber: string;
  ifscCode: string;
  amount: number; // in paisa
  purpose: string;
  fundAccountId?: string;
  mode?: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
  narration?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  status?: string;
  error?: string;
}

// Create fund account for salon owner for payouts
export async function createSalonFundAccount(
  salonId: string,
  bankDetails: BankAccountVerificationData
): Promise<{ success: boolean; fundAccountId?: string; contactId?: string; error?: string }> {
  if (!razorpay) {
    return {
      success: false,
      error: 'Razorpay not configured'
    };
  }

  try {
    // Step 1: Create a contact first
    const contactRequest = {
      name: bankDetails.accountHolderName,
      contact: "9999999999", // Placeholder phone number
      email: `salon.${salonId}@sanwarhub.in`, // Generated email
      type: 'vendor',
      reference_id: salonId,
      notes: {
        salon_id: salonId,
        purpose: 'automatic_payout'
      }
    };

    console.log('Creating contact for salon:', contactRequest);
    // Use the correct Razorpay SDK method - it should be .contact not .contacts
    const contact = await (razorpay as any).contacts.create(contactRequest);
    console.log('Contact created:', contact.id);

    // Step 2: Create fund account with the contact ID
    const fundAccountRequest = {
      contact_id: contact.id,
      account_type: 'bank_account',
      bank_account: {
        name: bankDetails.accountHolderName,
        account_number: bankDetails.accountNumber,
        ifsc: bankDetails.ifscCode
      }
    };

    console.log('Creating fund account for contact:', contact.id);
    // Use the correct Razorpay SDK method - it should be fundAccounts not fundAccount
    const fundAccount = await (razorpay as any).fundAccounts.create(fundAccountRequest);
    console.log('Fund account created:', fundAccount.id);
    
    if (fundAccount.id && fundAccount.active) {
      return {
        success: true,
        fundAccountId: fundAccount.id,
        contactId: contact.id
      };
    } else {
      return {
        success: false,
        error: 'Failed to create fund account'
      };
    }
  } catch (error: any) {
    console.error('Error creating fund account:', error.error || error);
    return {
      success: false,
      error: error.error?.description || error.message || 'Failed to create fund account'
    };
  }
}

// Automatic payout to salon owner
export async function processSalonPayout(
  fundAccountId: string,
  amount: number,
  bookingId: string,
  salonName: string
): Promise<PayoutResult> {
  if (!razorpay) {
    return {
      success: false,
      error: 'Razorpay not configured'
    };
  }

  try {
    const payoutData = {
      account_number: '2323230059316908', // Your Razorpay account number (check dashboard)
      fund_account_id: fundAccountId,
      amount: Math.round(amount * 100), // Convert to paisa
      currency: 'INR',
      mode: 'IMPS' as const,
      purpose: 'payout',
      narration: `Revenue share for booking ${bookingId} - ${salonName}`,
      reference_id: `salon_payout_${bookingId}_${Date.now()}`
    };

    const payout = await razorpay.payouts.create(payoutData);
    
    console.log('Payout created:', payout);

    return {
      success: true,
      payoutId: payout.id,
      status: payout.status
    };
  } catch (error: any) {
    console.error('Error processing payout:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payout'
    };
  }
}