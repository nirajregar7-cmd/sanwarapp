import type { Express } from "express";
import path from "path";

// Near me pages content for local SEO
const nearMePages = {
  "salon-near-me": {
    title: "Best Salon Near Me | Find Top-Rated Beauty Salons - Sanwar",
    description: "Find the best salon near you! Book appointments at top-rated beauty salons instantly. Verified reviews, professional staff, best prices guaranteed.",
    h1: "Best Salon Near Me",
    content: "Discover top-rated beauty salons in your area with Sanwar. Book appointments instantly at verified salons with professional staff and excellent reviews."
  },
  "haircut-near-me": {
    title: "Haircut Near Me | Professional Hair Styling Services - Sanwar", 
    description: "Find professional haircut services near you! Book men's, women's & kids haircuts at top salons. Expert stylists, latest trends, affordable prices.",
    h1: "Haircut Near Me",
    content: "Get the perfect haircut from expert stylists near you. From classic cuts to trendy styles, book professional haircut services instantly."
  },
  "spa-near-me": {
    title: "Spa Near Me | Relaxing Massage & Wellness Treatments - Sanwar",
    description: "Find relaxing spa treatments near you! Book massages, body treatments, and wellness services. Professional therapists, serene environment.",
    h1: "Spa Near Me", 
    content: "Indulge in relaxing spa treatments and massages near you. Professional therapists providing rejuvenating wellness services in serene environments."
  },
  "beauty-salon-near-me": {
    title: "Beauty Salon Near Me | Complete Beauty Services - Sanwar",
    description: "Find complete beauty services near you! Facial, makeup, hair care, nail services. Professional beauticians, quality products, affordable rates.",
    h1: "Beauty Salon Near Me",
    content: "Get comprehensive beauty services from professional beauticians near you. From facial treatments to complete makeovers, book quality beauty services."
  },
  "bridal-makeup-near-me": {
    title: "Bridal Makeup Near Me | Professional Wedding Makeup - Sanwar",
    description: "Find professional bridal makeup artists near you! HD makeup, pre-bridal treatments, engagement makeup. Experienced artists, quality products.",
    h1: "Bridal Makeup Near Me",
    content: "Look stunning on your special day with professional bridal makeup artists near you. HD makeup, airbrush techniques, and complete bridal packages."
  },
  "facial-near-me": {
    title: "Facial Near Me | Professional Skin Care Treatments - Sanwar",
    description: "Find professional facial treatments near you! Deep cleansing, anti-aging, brightening facials. Expert aestheticians, quality products.",
    h1: "Facial Near Me",
    content: "Rejuvenate your skin with professional facial treatments near you. Expert aestheticians providing customized facial services for all skin types."
  },
  "best-salon-near-me": {
    title: "Best Salon Near Me | Top-Rated Beauty & Hair Salons - Sanwar",
    description: "Find the best salon near you! Top-rated beauty and hair salons with verified reviews. Professional services, expert staff, excellent results.",
    h1: "Best Salon Near Me",
    content: "Discover the best salons near you with verified reviews and top ratings. Professional beauty and hair services from expert stylists and beauticians."
  },
  "hair-salon-near-me": {
    title: "Hair Salon Near Me | Professional Hair Care Services - Sanwar",
    description: "Find professional hair salons near you! Haircuts, styling, coloring, treatments. Expert hair stylists, quality products, latest trends.",
    h1: "Hair Salon Near Me",
    content: "Transform your hair at professional hair salons near you. Expert stylists providing cutting-edge hair services and treatments for all hair types."
  },
  "unisex-salon-near-me": {
    title: "Unisex Salon Near Me | Hair & Beauty for Men & Women - Sanwar",
    description: "Find unisex salons near you! Complete hair and beauty services for men and women. Professional stylists, modern facilities, affordable prices.",
    h1: "Unisex Salon Near Me", 
    content: "Enjoy comprehensive hair and beauty services for both men and women at unisex salons near you. Modern facilities with professional stylists."
  },
  "mens-salon-near-me": {
    title: "Men's Salon Near Me | Professional Male Grooming - Sanwar",
    description: "Find men's salon services near you! Haircuts, beard grooming, facial treatments. Professional male grooming specialists, modern techniques.",
    h1: "Men's Salon Near Me",
    content: "Get professional male grooming services at men's salons near you. Expert barbers and stylists specializing in men's haircuts and grooming."
  },
  "womens-salon-near-me": {
    title: "Women's Salon Near Me | Beauty & Hair Services for Women - Sanwar",
    description: "Find women's salon services near you! Hair styling, beauty treatments, nail services. Professional beauticians specializing in women's needs.",
    h1: "Women's Salon Near Me",
    content: "Pamper yourself at women's salons near you. Professional beauticians providing specialized hair, beauty, and wellness services for women."
  },
  "manicure-pedicure-near-me": {
    title: "Manicure Pedicure Near Me | Professional Nail Care - Sanwar",
    description: "Find manicure pedicure services near you! Professional nail care, nail art, gel polish. Expert nail technicians, hygienic conditions.",
    h1: "Manicure Pedicure Near Me",
    content: "Get beautiful nails with professional manicure and pedicure services near you. Expert nail technicians providing complete nail care and art."
  },
  "waxing-near-me": {
    title: "Waxing Near Me | Professional Hair Removal Services - Sanwar",
    description: "Find professional waxing services near you! Full body waxing, facial hair removal. Expert aestheticians, hygienic conditions, pain-free experience.",
    h1: "Waxing Near Me",
    content: "Get smooth skin with professional waxing services near you. Expert aestheticians providing safe and hygienic hair removal treatments."
  },
  "threading-near-me": {
    title: "Threading Near Me | Precise Eyebrow & Facial Threading - Sanwar",
    description: "Find precise threading services near you! Eyebrow shaping, facial hair removal. Expert threading specialists, natural and precise results.",
    h1: "Threading Near Me",
    content: "Get perfectly shaped eyebrows with professional threading services near you. Expert specialists providing precise and natural-looking results."
  },
  "hair-color-near-me": {
    title: "Hair Color Near Me | Professional Hair Coloring Services - Sanwar",
    description: "Find professional hair coloring services near you! Hair dye, highlights, balayage, ombre. Expert colorists, quality products, latest trends.",
    h1: "Hair Color Near Me",
    content: "Transform your look with professional hair coloring services near you. Expert colorists using premium products for stunning, long-lasting results."
  }
};

function generateNearMePage(service: string, data: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <meta name="description" content="${data.description}">
    <meta name="keywords" content="${service.replace(/-/g, ' ')}, ${service.replace(/-/g, ' ')} booking, beauty services, salon booking">
    
    <!-- Local SEO Meta Tags -->
    <meta name="geo.region" content="IN">
    <meta name="geo.placename" content="India">
    <meta name="ICBM" content="20.5937, 78.9629">
    <meta name="DC.title" content="${data.h1} - Sanwar">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${data.title}">
    <meta property="og:description" content="${data.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sanwarhub.in/${service}/">
    <meta property="og:image" content="https://sanwarhub.in/og-image.jpg">
    <meta property="og:site_name" content="Sanwar">
    <meta property="og:locale" content="en_IN">
    
    <!-- Local Business Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Sanwar - ${data.h1}",
        "description": "${data.description}",
        "url": "https://sanwarhub.in",
        "telephone": "+91-9999999999",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN",
            "addressRegion": "India"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "20.5937",
            "longitude": "78.9629"
        },
        "openingHours": "Mo-Su 00:00-23:59",
        "priceRange": "₹₹",
        "serviceType": ["${service.replace(/-/g, ' ')}"],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "1500"
        }
    }
    </script>
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DBC4KWYHJJ"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-DBC4KWYHJJ');
    </script>
    
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #333; font-size: 2.5em; margin-bottom: 20px; text-align: center; }
        h2 { color: #555; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 18px; margin: 20px 0; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature { padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .highlight { background: #f0f7ff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${data.h1}</h1>
        
        <div class="highlight">
            <p style="font-size: 18px; margin: 0;">${data.content}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://sanwarhub.in" class="cta-button">Find ${data.h1} ➜</a>
        </div>
        
        <h2>Why Choose Sanwar for ${data.h1}?</h2>
        
        <div class="features">
            <div class="feature">
                <h3>🌟 Verified Professionals</h3>
                <p>All service providers are verified with excellent ratings and reviews.</p>
            </div>
            <div class="feature">
                <h3>⚡ Instant Booking</h3>
                <p>Book appointments instantly without phone calls or waiting.</p>
            </div>
            <div class="feature">
                <h3>💰 Best Prices</h3>
                <p>Compare prices and get the best deals on beauty services.</p>
            </div>
            <div class="feature">
                <h3>📍 Near You</h3>
                <p>Find services exactly where you need them, close to your location.</p>
            </div>
        </div>
        
        <h2>How It Works</h2>
        <ol style="font-size: 18px; line-height: 1.8;">
            <li><strong>Search:</strong> Find ${service.replace(/-/g, ' ')} services near your location</li>
            <li><strong>Compare:</strong> View ratings, reviews, and prices</li>
            <li><strong>Book:</strong> Select your preferred time and confirm instantly</li>
            <li><strong>Enjoy:</strong> Get professional service at your chosen location</li>
        </ol>
        
        <div style="background: #667eea; color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0;">
            <h2 style="color: white; border: none;">Ready to Book ${data.h1}?</h2>
            <p style="font-size: 18px;">Join thousands of satisfied customers who trust Sanwar for their beauty needs.</p>
            <a href="https://sanwarhub.in" style="background: white; color: #667eea; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 18px;">Book Now</a>
        </div>
        
        <footer style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; margin-top: 40px;">
            <p>&copy; 2025 Sanwar. India's #1 platform for ${service.replace(/-/g, ' ')} services.</p>
        </footer>
    </div>
</body>
</html>`;
}

export function setupSEORoutes(app: Express) {
  // Serve individual near me pages
  Object.keys(nearMePages).forEach(service => {
    app.get(`/${service}/`, (req, res) => {
      const pageData = nearMePages[service as keyof typeof nearMePages];
      const html = generateNearMePage(service, pageData);
      res.send(html);
    });
  });
  
  // Generic near me page handler
  app.get('/salon-near-me/', (req, res) => {
    const html = generateNearMePage('salon-near-me', nearMePages['salon-near-me']);
    res.send(html);
  });
}