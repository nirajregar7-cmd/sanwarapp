# SanwarHub.in Domain Setup

## Multi-Domain Payment Configuration

Your Sanwar platform now supports payment processing for both domains:
- **Primary Domain**: sanwar-book-nirajregar7.replit.app
- **Custom Domain**: sanwarhub.in

## Payment Gateway Configuration

### Cashfree Domain Whitelisting

**IMPORTANT**: You need to whitelist sanwarhub.in in your Cashfree merchant dashboard before it can accept payments.

### Steps to Whitelist sanwarhub.in in Cashfree:

1. **Login to Cashfree Merchant Dashboard**
   - Go to: https://merchant.cashfree.com/
   - Login with your merchant credentials

2. **Navigate to Webhooks & Return URLs**
   - Go to Developers → Webhooks
   - Or Settings → Payment Configuration

3. **Add sanwarhub.in Domain**
   - Add these URLs to your whitelist:
     - `https://sanwarhub.in/payment-callback`
     - `https://sanwarhub.in/api/cashfree/webhook`
     - `https://sanwarhub.in/payment-success`

4. **Submit for Approval**
   - Submit the whitelisting request
   - Wait for Cashfree to approve (usually 24-48 hours)

### Current Configuration:
- **Temporary Solution**: All payments currently redirect to the whitelisted Replit domain
- **After Approval**: System will automatically use sanwarhub.in for customers accessing from that domain

### Payment Flow Status:
1. **Return URLs**: Currently using whitelisted Replit domain until sanwarhub.in is approved
2. **Webhook URLs**: Payment notifications go to Replit domain for now
3. **Dynamic Domain Detection**: Ready to switch to sanwarhub.in once whitelisted

### Domain-Specific Features

**When customers use sanwarhub.in:**
- Payment callbacks redirect to `https://sanwarhub.in/payment-callback`
- Webhook notifications go to `https://sanwarhub.in/api/cashfree/webhook`
- All booking confirmations and emails reference sanwarhub.in

**When customers use the original domain:**
- Payment callbacks redirect to the original Replit domain
- Maintains existing payment flow

## DNS Configuration Required

To make sanwarhub.in fully functional, configure these DNS records:

```
Type: CNAME
Name: @
Value: ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev

Type: CNAME
Name: www
Value: ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev
```

## Environment Variables

Add this environment variable for production:

```
BASE_URL=https://sanwarhub.in
```

This will make sanwarhub.in the primary domain for all payment callbacks.

## Testing Payment Flow

1. **Test on Original Domain**: Continue using existing Replit URL for testing
2. **Test on SanwarHub.in**: Once DNS is configured, test payment flow on custom domain
3. **Cross-Domain Compatibility**: Both domains should work seamlessly

## Benefits

- **Professional Branding**: sanwarhub.in provides better brand recognition
- **Seamless Payments**: Payment gateway works on both domains
- **Flexibility**: Can switch between domains without breaking payment flow
- **Future-Ready**: Easy to add more custom domains

## Next Steps

1. Configure DNS records with your domain registrar
2. Wait for DNS propagation (5-60 minutes)
3. Test payment flow on sanwarhub.in
4. Set BASE_URL environment variable if needed
5. Monitor payment success rates on both domains

## Technical Implementation

The system uses dynamic domain detection:

```typescript
// Automatically detects request domain
const requestHost = req.get('host');
const baseUrl = getBaseUrl(requestHost);

// Configures payment URLs based on detected domain
returnUrl: `${baseUrl}/payment-callback?...`
notifyUrl: `${baseUrl}/api/cashfree/webhook`
```

This ensures customers always return to the same domain they started the payment from.