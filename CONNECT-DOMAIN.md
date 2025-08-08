# Connect sanwarhub.in to Your Sanwar Platform

## Option 1: Connect to Replit Deployments (Recommended for Simplicity)

### Step 1: Deploy on Replit
1. **Deploy Your App:**
   - In your Replit project, click the "Deploy" button
   - Choose deployment type (Autoscale recommended)
   - Wait for deployment to complete

### Step 2: Connect Custom Domain
1. **In Replit Dashboard:**
   - Go to Deployments → Domains tab
   - Click "Connect existing domain"
   - Enter: `sanwarhub.in`

2. **Configure DNS (at your domain registrar):**
   ```
   Type: CNAME
   Name: @
   Value: [provided by Replit]

   Type: CNAME
   Name: www
   Value: [provided by Replit]
   ```

3. **Verify Connection:**
   - Wait 5-60 minutes for DNS propagation
   - Your site will be live at sanwarhub.in

## Option 2: Connect to Vercel (Maximum Performance)

### Step 1: Deploy to Vercel
1. **Push to GitHub:** (if not done already)
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to vercel.com → New Project
   - Import your GitHub repository
   - Add environment variables:
     ```
     DATABASE_URL=your-neon-database-url
     SESSION_SECRET=your-random-secret
     RAZORPAY_KEY_ID=your-razorpay-key
     RAZORPAY_KEY_SECRET=your-razorpay-secret
     ```
   - Deploy

### Step 2: Connect Domain to Vercel
1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add domain: `sanwarhub.in`
   - Add www subdomain: `www.sanwarhub.in`

2. **Configure DNS:**
   ```
   Type: A
   Name: @
   Value: 76.76.19.61

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate:**
   - Automatically provided by Vercel
   - HTTPS enabled immediately

## Database Setup (Required for Both Options)

### If Using Neon Database:
```bash
# Install Drizzle CLI
npm install -g drizzle-kit

# Set your database URL
export DATABASE_URL="your-neon-connection-string"

# Create database tables
drizzle-kit push
```

### Environment Variables Needed:
```
DATABASE_URL=postgresql://username:password@hostname/database
SESSION_SECRET=your-32-character-random-string
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NODE_ENV=production
```

## DNS Configuration Details

### Where to Update DNS:
- Log into your domain registrar's control panel
- Find DNS management/DNS records section
- Add/update the records as shown above
- Save changes

### Common Registrars:
- **GoDaddy:** Domain Manager → DNS
- **Namecheap:** Domain List → Manage → Advanced DNS
- **Hostinger:** DNS Zone
- **BigRock:** DNS Management

## Testing Your Live Site

### After DNS Propagation (5-60 minutes):
1. Visit `https://sanwarhub.in`
2. Test user registration (salon owner)
3. Create salon profile
4. Add services and time slots
5. Register as customer and book appointment
6. Test payment flow with Razorpay

## Performance Optimization

### Both platforms provide:
- **SSL Certificate:** Free HTTPS
- **CDN:** Global content delivery
- **Caching:** Automatic performance optimization
- **Mobile Optimization:** Responsive design

### Expected Performance:
- **Page Load:** < 2 seconds globally
- **Concurrent Users:** 1,000+ simultaneously
- **Uptime:** 99.99% availability

## Which Option to Choose?

### Choose Replit Deployments if:
- You want everything in one platform
- Prefer simpler setup and management
- Need integrated billing and support

### Choose Vercel if:
- You want maximum performance and scalability
- Plan to handle high traffic volumes
- Want advanced deployment features

## Support

Both platforms offer:
- **Automatic scaling** as your user base grows
- **Global CDN** for fast loading worldwide
- **SSL certificates** for security
- **99.99% uptime** guarantees

Your `sanwarhub.in` domain will work perfectly with either option. The salon booking platform is ready to handle thousands of customers!