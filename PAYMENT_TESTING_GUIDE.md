# Payment Testing Guide for Sanwar

## Current Status
✅ Razorpay live keys configured successfully  
✅ Payment order creation working (`order_R4uHj2YIBkaDOv`)  
⚠️ Payment verification needs testing  

## Testing Payment Flow

### Step 1: Make a Test Booking
1. Go to salon page: `/salon/70c56a53-af63-4186-a882-f55c74106536`
2. Select a service (e.g., "Beard" - ₹40)
3. Choose a staff member and time slot
4. Fill in customer details
5. Click "Book Now"

### Step 2: Complete Payment
When Razorpay popup appears:
- **Test Card**: 4111 1111 1111 1111
- **Expiry**: Any future date (12/25)
- **CVV**: Any 3 digits (123)
- **OTP**: Any 6 digits for test transactions

### Step 3: Monitor Logs
Check browser console (F12) for:
- Payment success confirmation
- Verification API call to `/api/bookings/verify-payment`
- Any error messages

### Expected Flow
1. Payment order created ✅
2. Razorpay popup opens
3. Payment completed successfully
4. Verification API called with:
   - `razorpay_order_id`
   - `razorpay_payment_id`
   - `razorpay_signature`
5. Booking created in database
6. Success message shown

### Troubleshooting Common Issues

#### Payment Popup Doesn't Open
- Check browser console for JavaScript errors
- Ensure Razorpay script is loaded
- Verify no popup blockers

#### Payment Verification Fails
- Check if verification API is being called
- Monitor server logs for verification attempts
- Ensure all Razorpay response data is passed correctly

#### Network Timeouts
- Payment verification has 30-second timeout
- 3 retry attempts for failed verifications
- Check network connectivity

### Server Log Monitoring
Watch for these log messages:
```
✅ Razorpay order created successfully: order_XXXXX
💳 Payment completed in XXXXms
🔄 Retrying verification in 2 seconds...
✅ Payment verified and booking created in XXXXms
```

### Live vs Test Mode
- Currently using **LIVE** keys: `rzp_live_gLQWs1F7KYlX7n`
- Real money transactions will be processed
- Use test cards for testing to avoid charges

### Success Indicators
- Booking appears in customer's booking list
- Salon owner sees booking in dashboard
- Email confirmation sent (if configured)
- SMS notification sent (if Twilio configured)

## Current Payment Features
- ✅ Individual staff slot booking
- ✅ Real-time slot availability
- ✅ Referral code discounts
- ✅ Automatic revenue sharing calculation
- ✅ Payment retry logic with timeouts
- ✅ Comprehensive error handling