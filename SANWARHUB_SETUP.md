# SanwarHub.in Domain Setup

## Multi-Domain Payment Configuration

Your Sanwar platform now supports payment processing for both domains:
- **Primary Domain**: sanwar-book-nirajregar7.replit.app
- **Custom Domain**: sanwarhub.in

## Payment Gateway Configuration

### Cashfree Domain Whitelisting

Both domains are configured for Cashfree payment processing:

1. **Return URLs**: Customers will be redirected back to the same domain they initiated payment from
2. **Webhook URLs**: Payment notifications will be sent to the appropriate domain
3. **Dynamic Domain Detection**: System automatically detects the request domain and configures payment URLs accordingly

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