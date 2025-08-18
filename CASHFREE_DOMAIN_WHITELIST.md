# Cashfree Domain Whitelisting Guide

## Issue
Cashfree is showing "Broken Link" error because `sanwarhub.in` is not whitelisted in your merchant account.

## Solution Steps

### 1. Login to Cashfree Merchant Dashboard
- Go to: https://merchant.cashfree.com/
- Login with your merchant account credentials

### 2. Navigate to Domain Settings
You can find domain whitelisting in one of these locations:
- **Settings** → **Payment Configuration** → **Return URL Settings**
- **Developers** → **Webhooks** → **Domain Whitelist**
- **API & Webhooks** → **Return URL Management**

### 3. Add These URLs for Whitelisting

**Return URLs to Add:**
```
https://sanwarhub.in/payment-callback
https://sanwarhub.in/payment-success
https://sanwarhub.in/
```

**Webhook URLs to Add:**
```
https://sanwarhub.in/api/cashfree/webhook
```

### 4. Submit Request
- Click "Add Domain" or "Whitelist Domain"
- Add each URL individually
- Submit the whitelisting request
- You may need to provide business justification

### 5. Wait for Approval
- Cashfree typically takes 24-48 hours to approve
- You'll receive email confirmation once approved
- Some accounts get instant approval

## Alternative Temporary Solution

Until sanwarhub.in is approved, you have two options:

### Option 1: Use Current Replit Domain
- Payments work immediately on: `ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev`
- Already whitelisted and working

### Option 2: Deploy to Vercel (if faster approval needed)
- Deploy your app to Vercel
- Vercel domains are often pre-approved by payment gateways
- Connect sanwarhub.in to Vercel deployment

## Current System Behavior

**Right Now:**
- All payments redirect to whitelisted Replit domain for successful processing
- Customers can book from sanwarhub.in but payment completion happens on Replit domain

**After Approval:**
- Customers visiting sanwarhub.in will stay on sanwarhub.in for entire payment flow
- No code changes needed - system will automatically detect and use correct domain

## Contact Information

**If you need help with Cashfree:**
- Support: support@cashfree.com
- Phone: Available in your merchant dashboard
- Live Chat: Available in merchant dashboard

**What to tell Cashfree support:**
"I need to whitelist my custom domain sanwarhub.in for payment callbacks and webhooks. I'm currently using the production API keys and need to add return URLs for my custom domain."

## Testing After Approval

Once approved, test the payment flow:
1. Visit sanwarhub.in
2. Make a test booking
3. Verify payment redirects stay on sanwarhub.in
4. Check that webhooks are received properly

The system is fully configured and ready - just waiting for Cashfree approval!