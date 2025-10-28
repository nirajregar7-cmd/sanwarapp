# Sanwar Design Guidelines - India's Smart Salon Booking Platform

## Design Approach

**Selected Approach:** Reference-Based Design drawing from Airbnb's booking patterns, premium wellness apps (Headspace), and modern SaaS aesthetics (Stripe, Linear) to create a sophisticated salon discovery and booking experience.

**Core Principles:**
- Premium, aspirational feel that elevates the salon booking experience
- Trust-building through social proof and visual clarity
- Smooth, delightful micro-interactions without overwhelming users
- Mobile-first responsive design for on-the-go bookings

---

## Typography System

**Primary Font:** Inter or Poppins (via Google Fonts) - modern, clean, professional
**Secondary Font:** Playfair Display or Cormorant for elegant accent headlines

**Hierarchy:**
- Hero Headlines: 3xl to 6xl (font-bold), tracking-tight
- Section Headers: 2xl to 4xl (font-semibold)
- Card Titles: lg to xl (font-medium)
- Body Text: base to lg (font-normal), leading-relaxed for readability
- Small Print/Labels: sm to xs (font-medium)

---

## Layout & Spacing System

**Tailwind Spacing Units:** Consistently use 4, 6, 8, 12, 16, 20, 24, 32
- Component padding: p-4 to p-8
- Section vertical spacing: py-16 to py-32
- Card gaps: gap-6 to gap-8
- Container max-width: max-w-7xl with px-4 to px-8

**Grid Patterns:**
- Desktop: 3-column salon cards (grid-cols-3)
- Tablet: 2-column (md:grid-cols-2)
- Mobile: Single column (grid-cols-1)

---

## Core Page Sections

### 1. Hero Section (80vh)
**Layout:** Full-width with blurred overlay treatment
- Large hero headline with typewriter effect animation on key phrase
- Subheadline explaining value proposition
- Dual CTA buttons (Primary: "Book Now" | Secondary: "Explore Salons") with backdrop-blur-md bg-white/20 treatment
- Search bar component: location + service type + date picker in a unified card below headline
- Floating trust indicators: "200+ Premium Salons" "50k+ Happy Customers" "Verified Reviews"

### 2. Featured Salons Grid
**Layout:** 3-column masonry-style cards
- Salon card components: Large image (aspect-ratio-4/3), salon name, rating stars, price range, quick services list, "View Details" CTA
- Hover effect: Subtle lift (translate-y-1) with shadow enhancement
- Filter pills above grid: "Near Me" "Top Rated" "Women's Salons" "Men's Grooming" "Unisex"

### 3. How It Works Section
**Layout:** Horizontal 3-step timeline with connecting line
- Numbered circular icons (1, 2, 3)
- Step titles: "Discover" "Book" "Experience"
- Brief descriptions under each
- Supporting illustration or photo for each step

### 4. Services Showcase
**Layout:** 4-column icon grid
- Service cards: Icon, service name, starting price
- Categories: Haircut, Styling, Spa, Bridal, Massage, Makeup, Grooming, Skincare
- "View All Services" link below

### 5. Why Choose Sanwar
**Layout:** 2-column split - left: bold feature list, right: app mockup image
- Features with checkmark icons: Instant booking, Verified professionals, Secure payments, Flexible rescheduling, Exclusive deals, Quality guarantee
- Micro-interaction: Features fade in on scroll

### 6. Customer Testimonials
**Layout:** 3-column testimonial cards with carousel on mobile
- Customer photo, quote, name, service booked, 5-star rating
- Subtle card border with shadow-lg
- Auto-rotating carousel (8s intervals)

### 7. Mobile App Promotion (if applicable)
**Layout:** Full-width section with diagonal split
- Left: App store badges, feature bullets
- Right: Phone mockup showing app interface
- Floating UI elements showcasing app features

### 8. Partner CTA Section
**Layout:** Centered content with supporting imagery
- Headline: "Own a Salon? Join Sanwar"
- Benefits: Reach more customers, Manage bookings, Grow revenue
- "Partner with Us" CTA button
- Background: Subtle pattern or salon workspace image

### 9. Footer
**Comprehensive footer with:**
- Logo + tagline
- Quick links columns: Services, Cities, About Us, Careers, Blog
- Contact information with icons
- Social media links
- Newsletter signup: Email input + Subscribe button
- Trust badges: Payment methods, certifications
- Copyright + legal links

---

## Component Library

### Navigation Header
**Layout:** Sticky header (backdrop-blur-lg)
- Logo (left), Main nav links (center): Services, Cities, For Business, Help
- Right: Login + Sign Up button (outlined + solid treatment)
- Mobile: Hamburger menu with slide-in drawer

### Salon Cards
- Bordered cards with rounded-2xl
- Image with aspect ratio lock, overlay gradient on hover
- Quick info badges: Distance, Rating, Price range
- Favorite icon (heart) top-right
- Smooth shadow transition on hover

### Search Component
- Unified search bar with 3 segments: Location dropdown, Service selector, Date picker
- Prominent search icon button on right
- Floating card treatment (shadow-2xl)

### CTA Buttons
- Primary: Larger padding (px-8 py-4), font-semibold, rounded-full
- Secondary: Outlined variant with same padding
- On images: backdrop-blur-md with semi-transparent background

### Filter Pills
- Rounded-full chips with border
- Active state: Filled background
- Smooth transition on selection

---

## Animation Strategy

**Sparingly Used, High Impact:**
1. **Typewriter Effect:** Hero headline only - animates key phrase character by character
2. **Scroll Fade-Ins:** Section headers and feature lists (opacity + slight translateY)
3. **Card Hover:** Subtle lift (2-4px) with shadow enhancement (0.3s transition)
4. **Loading States:** Skeleton screens for salon cards during data fetch
5. **Carousel:** Testimonials auto-rotate with crossfade (1s duration, ease-in-out)
6. **Button Ripple:** Subtle scale on click (scale-95)

**Avoid:** Parallax scrolling, continuous animations, distracting motion

---

## Images Section

### Hero Image
**Placement:** Full-width background of hero section
**Description:** High-quality, aspirational image showing a modern, premium salon interior with soft natural lighting. Customers visible in soft focus receiving services (hair styling, spa). Warm, inviting atmosphere with contemporary design elements. Image should have a subtle gradient overlay (dark to transparent, bottom to top) for text legibility.

### Featured Salon Cards
**Description:** Professional photographs of salon interiors, stylists at work, or elegant salon spaces. Each card needs a unique, high-quality image showing the ambiance and professionalism. Mix of wide shots and detail shots.

### How It Works Section
**Description:** Simple, modern illustrations or photos for each step - phone showing app, stylist consultation, happy customer post-service.

### App Mockup (if applicable)
**Description:** iPhone mockup displaying the Sanwar app interface with booking flow visible on screen.

### Partner CTA Background
**Description:** Wide shot of modern salon workspace with styling stations, mirrors, and professional equipment. Slightly desaturated to keep focus on CTA content.

**Note:** All images should convey premium quality, cleanliness, modern aesthetics, and professionalism. Diverse representation of customers and stylists across imagery.

---

## Accessibility Standards

- All interactive elements: min touch target 44x44px
- Form inputs: Clear labels, visible focus states (ring-2 treatment)
- Color contrast: Ensure text readability over all backgrounds
- Icon buttons: Include aria-labels
- Keyboard navigation: Full tab-index support across all interactive elements