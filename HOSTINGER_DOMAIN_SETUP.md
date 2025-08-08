# Hostinger Domain को Render से Connect करना

## Overview
आपका Hostinger से खरीदा गया domain (sanwarhub.in) को Render platform के साथ connect करना बहुत आसान है।

## Step-by-Step Guide

### Step 1: Render पर App Deploy करें
पहले आपको अपना Sanwar app Render पर deploy करना होगा:
1. Backend (API) deploy करें → मिलेगा URL: `https://sanwar-api.onrender.com`
2. Frontend deploy करें → मिलेगा URL: `https://sanwar-frontend.onrender.com`

### Step 2: Hostinger DNS Settings में जाएं
1. **Hostinger Dashboard** में login करें
2. **Domains** section में जाएं
3. आपका domain `sanwarhub.in` select करें
4. **DNS Zone** या **DNS Management** पर click करें

### Step 3: DNS Records Add करें

#### A. Main Website के लिए (Frontend):
```
Type: CNAME
Name: www
Target: sanwar-frontend.onrender.com
TTL: 14400 (or Auto)
```

```
Type: A
Name: @
Target: 216.24.57.1 (Render का IP)
TTL: 14400
```

#### B. API के लिए (Backend):
```
Type: CNAME  
Name: api
Target: sanwar-api.onrender.com
TTL: 14400
```

### Step 4: Render पर Custom Domain Add करें

#### Frontend के लिए:
1. Render dashboard में आपके frontend service पर जाएं
2. **Settings** → **Custom Domains** 
3. Add domains:
   - `sanwarhub.in`
   - `www.sanwarhub.in`

#### Backend के लिए:
1. Render dashboard में आपके backend service पर जाएं  
2. **Settings** → **Custom Domains**
3. Add domain:
   - `api.sanwarhub.in`

### Step 5: SSL Certificate (Automatic)
- Render automatically free SSL certificate provide करेगा
- 24-48 hours में आपका domain HTTPS के साथ live हो जाएगा

### Step 6: Frontend Configuration Update करें
आपके React app में API URL update करना होगा:

```javascript
// Production में API URL update करें
const API_BASE_URL = 'https://api.sanwarhub.in';
```

## Expected Final URLs:
- **Main Website**: `https://sanwarhub.in`
- **API Endpoint**: `https://api.sanwarhub.in`
- **SSL**: Automatic free certificate

## DNS Propagation Time:
- **Hostinger**: Usually 2-6 hours
- **Global**: Up to 24-48 hours maximum

## Verification Steps:
1. `nslookup sanwarhub.in` - should show Render's IP
2. `https://sanwarhub.in` - should load your Sanwar app
3. `https://api.sanwarhub.in/api/platform/stats` - should return API response

## Important Notes:
- Hostinger के DNS management interface में कभी-कभी @ symbol की जगह domain name लिखना पड़ता है
- TTL value 14400 (4 hours) recommended है fast propagation के लिए
- Render का IP address change हो सकता है, इसलिए CNAME records prefer करें A records से

## Troubleshooting:
- अगर domain connect नहीं हो रहा: DNS propagation wait करें (24 hours तक)
- SSL certificate issue: Render support को contact करें
- Hostinger DNS issue: Hostinger support से help लें

## Cost:
- Domain: आपका existing Hostinger cost
- Render deployment: Free tier या $14/month
- SSL Certificate: Free with Render
- DNS management: Free

आपका domain बिल्कुल काम करेगा और professional look मिलेगा आपके Sanwar platform को!