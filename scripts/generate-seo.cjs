/*
SanwarHub SEO Page Generator
---------------------------------
What this does:
- Generates static SEO pages for Indian cities + services
- Creates city pages: /salons/<city>/index.html (e.g., /salons/chennai/)
- Creates service pages: /salons/<city>/<service>/index.html (e.g., /salons/chennai/haircut/)
- Builds sitemap.xml and robots.txt

How to use (on Replit/Node):
1) Add this file as scripts/generate-seo.js
2) Run:  node scripts/generate-seo.js
3) Deploy the generated /public folder to your hosting and map it to sanwarhub.in
4) Submit https://sanwarhub.in/sitemap.xml in Google Search Console

Customize:
- Edit the CITIES and SERVICES arrays below to add/remove items.
- Replace EXAMPLE_SALONS lookup with real salons from your DB when available.

Notes:
- All pages include: <title>, meta description, H1, internal links, and JSON-LD schema.
- Canonical URLs are set to avoid duplicates.
*/

const fs = require('fs');
const path = require('path');

// ----------------------------------------------
// 1) Config
// ----------------------------------------------
const SITE = {
  domain: 'https://sanwarhub.in',
  brand: 'Sanwar',
  outDir: path.join(process.cwd(), 'public', 'seo'),
  today: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
};

// Top Indian cities including your asks (Chennai, Trichy) + state capitals + major smart cities
const CITIES = [
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Bengaluru', alt: 'Bangalore', state: 'Karnataka' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Ranchi', state: 'Jharkhand' },
  { name: 'Bhubaneswar', state: 'Odisha' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Tiruchirappalli', alt: 'Trichy', state: 'Tamil Nadu' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Kochi', alt: 'Cochin', state: 'Kerala' },
  { name: 'Thiruvananthapuram', alt: 'Trivandrum', state: 'Kerala' },
  { name: 'Visakhapatnam', alt: 'Vizag', state: 'Andhra Pradesh' },
  { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Dehradun', state: 'Uttarakhand' },
  { name: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Gurugram', alt: 'Gurgaon', state: 'Haryana' },
  { name: 'Faridabad', state: 'Haryana' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Prayagraj', alt: 'Allahabad', state: 'Uttar Pradesh' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Meerut', state: 'Uttar Pradesh' },
  { name: 'Ludhiana', state: 'Punjab' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Jalandhar', state: 'Punjab' },
  { name: 'Jammu', state: 'Jammu and Kashmir' },
  { name: 'Srinagar', state: 'Jammu and Kashmir' },
  { name: 'Raipur', state: 'Chhattisgarh' },
  { name: 'Dhanbad', state: 'Jharkhand' },
  { name: 'Jamshedpur', state: 'Jharkhand' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Aurangabad', state: 'Maharashtra' },
  { name: 'Thane', state: 'Maharashtra' },
  { name: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  { name: 'Mysuru', alt: 'Mysore', state: 'Karnataka' },
  { name: 'Mangaluru', alt: 'Mangalore', state: 'Karnataka' },
  { name: 'Hubballi', alt: 'Hubli', state: 'Karnataka' },
  { name: 'Warangal', state: 'Telangana' },
  { name: 'Tirupati', state: 'Andhra Pradesh' }
];

// Services you want to rank for
const SERVICES = [
  { slug: 'haircut', label: 'Haircut' },
  { slug: 'spa', label: 'Spa' },
  { slug: 'bridal-makeup', label: 'Bridal Makeup' },
  { slug: 'facial', label: 'Facials' },
  { slug: 'hair-color', label: 'Hair Color' },
  { slug: 'manicure', label: 'Manicure' },
  { slug: 'pedicure', label: 'Pedicure' },
  { slug: 'waxing', label: 'Waxing' },
  { slug: "men's-haircut", label: "Men's Haircut" },
  { slug: 'kids-haircut', label: 'Kids Haircut' },
  { slug: 'massage', label: 'Massage' },
  { slug: 'threading', label: 'Threading' },
  { slug: 'hair-spa', label: 'Hair Spa' },
  { slug: 'beard-grooming', label: 'Beard Grooming' },
  { slug: 'makeup', label: 'Makeup' }
];

// Example salons to showcase (replace with dynamic data)
const EXAMPLE_SALONS = [
  { name: 'Elite Hair Studio', rating: 4.8, reviews: 120, services: ['Haircut', 'Spa', 'Bridal Makeup'], area: 'Central' },
  { name: 'Glow & Beauty Lounge', rating: 4.6, reviews: 95, services: ['Facials', 'Hair Spa', 'Styling'], area: 'South' },
  { name: 'Style Street Salon', rating: 4.5, reviews: 80, services: ['Haircut', 'Hair Color', 'Waxing'], area: 'North' },
  { name: 'Royal Beauty Parlour', rating: 4.7, reviews: 110, services: ['Bridal Makeup', 'Facial', 'Manicure'], area: 'East' },
  { name: 'Modern Cuts & Spa', rating: 4.4, reviews: 65, services: ['Men\'s Haircut', 'Beard Grooming', 'Massage'], area: 'West' }
];

// ----------------------------------------------
// 2) Helpers
// ----------------------------------------------
const slugify = (str) => str
  .toString()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const writeFile = (filePath, content) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
};

const canonical = (url) => `<link rel="canonical" href="${url}" />`;

// ----------------------------------------------
// 3) HTML Templates
// ----------------------------------------------
const baseHead = ({ title, description, url }) => `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
${canonical(url)}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="${SITE.domain}/favicon.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${SITE.domain}/favicon.jpg" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.header { background: linear-gradient(135deg, #8B5CF6 0%, #764ba2 100%); color: white; padding: 20px 0; }
.header h1 { margin: 0; font-size: 2rem; }
.header p { margin: 5px 0 0; opacity: 0.9; }
.breadcrumb { font-size: 14px; color: #666; margin: 20px 0 10px; }
.breadcrumb a { color: #8B5CF6; text-decoration: none; }
.salon-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 15px 0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.salon-card h3 { margin: 0 0 10px; color: #8B5CF6; }
.salon-card .rating { color: #fbbf24; font-weight: bold; }
.btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
.btn:hover { background: #7c3aed; }
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
.service-link { background: #f8fafc; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-decoration: none; color: #374151; display: block; }
.service-link:hover { background: #f1f5f9; border-color: #8B5CF6; }
.footer { background: #f8fafc; padding: 40px 0; margin-top: 50px; border-top: 1px solid #e5e7eb; }
.cta-section { background: #f8f4ff; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; }
</style>
`;

const headerNav = () => `
<header class="header">
  <div class="container">
    <a href="/" style="text-decoration:none;color:inherit">
      <h1>${SITE.brand}</h1>
      <p>Smart Salon Booking Platform - Book Instantly Across India</p>
    </a>
  </div>
</header>`;

const footer = () => `
<footer class="footer">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
      <div>
        <h4>${SITE.brand}</h4>
        <p>India's leading salon booking platform. Find and book the best salons near you.</p>
      </div>
      <div>
        <h4>Popular Cities</h4>
        <p><a href="/seo/salons/delhi/">Delhi</a> | <a href="/seo/salons/mumbai/">Mumbai</a> | <a href="/seo/salons/bengaluru/">Bangalore</a></p>
        <p><a href="/seo/salons/chennai/">Chennai</a> | <a href="/seo/salons/hyderabad/">Hyderabad</a> | <a href="/seo/salons/pune/">Pune</a></p>
      </div>
      <div>
        <h4>Services</h4>
        <p>Haircut | Spa | Bridal Makeup | Facial | Hair Color</p>
        <p>Manicure | Pedicure | Waxing | Massage</p>
      </div>
    </div>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="text-align: center; color: #666;">© ${new Date().getFullYear()} ${SITE.brand}. All rights reserved. India's Smart Salon Booking Platform.</p>
  </div>
</footer>`;

const citySchema = ({ cityName, url }) => `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Best Salons in ${cityName}",
  "description": "Top-rated salons and beauty parlours in ${cityName} for haircuts, spa, bridal makeup, and more.",
  "itemListElement": [
    ${EXAMPLE_SALONS.map((s, i) => `{
      "@type": "LocalBusiness",
      "position": ${i + 1},
      "name": "${s.name}",
      "description": "Professional salon in ${cityName}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${cityName}"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${s.rating}",
        "reviewCount": "${s.reviews}"
      },
      "url": "${url}#salon-${i+1}"
    }`).join(',\n    ')}
  ]
}
</script>`;

const serviceSchema = ({ cityName, serviceLabel, url }) => `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "${serviceLabel} Services in ${cityName}",
  "description": "Best ${serviceLabel.toLowerCase()} services and salons in ${cityName}",
  "itemListElement": [
    ${EXAMPLE_SALONS.map((s, i) => `{
      "@type": "LocalBusiness",
      "position": ${i + 1},
      "name": "${s.name} - ${serviceLabel}",
      "description": "${serviceLabel} services in ${cityName}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${cityName}"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${s.rating}",
        "reviewCount": "${s.reviews}"
      },
      "url": "${url}#salon-${i+1}"
    }`).join(',\n    ')}
  ]
}
</script>`;

const salonCard = (s, i, citySlug, cityName) => `
<article id="salon-${i+1}" class="salon-card">
  <h3><a href="/${slugify(s.name)}-${citySlug}/" style="text-decoration:none;color:inherit">${s.name}</a></h3>
  <div class="rating">⭐ ${s.rating} (${s.reviews} reviews)</div>
  <p><strong>Services:</strong> ${s.services.join(', ')}</p>
  <p><strong>Area:</strong> ${s.area} ${cityName}</p>
  <p><strong>Specialties:</strong> Professional hair styling, relaxing spa treatments, expert beauty services</p>
  <a href="/" class="btn">View Details & Book Now</a>
</article>`;

const cityPageHTML = ({ cityName, citySlug, altName, state }) => {
  const url = `${SITE.domain}/seo/salons/${citySlug}/`;
  const title = `Best Salons in ${cityName} - Book Haircuts, Spa & Beauty Services | ${SITE.brand}`;
  const description = `Find top-rated salons in ${cityName}, ${state}. Book haircuts, spa treatments, bridal makeup, facials & more. Compare prices, read reviews & book instantly with ${SITE.brand}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${baseHead({ title, description, url })}
${citySchema({ cityName, url })}
</head>
<body>
${headerNav()}
<main class="container">
  <div class="breadcrumb">
    <a href="/">Home</a> › <a href="/seo/salons/">Salons</a> › ${cityName}
  </div>
  
  <h1>Best Salons in ${cityName}${altName ? ` (${altName})` : ''}, ${state}</h1>
  
  <div class="cta-section">
    <h2>Find & Book Top Salons in ${cityName}</h2>
    <p>Discover ${cityName}'s best salons for haircuts, spa treatments, bridal makeup, and beauty services. Book instantly with verified reviews and transparent pricing.</p>
    <a href="/" class="btn">Browse All Salons in ${cityName}</a>
  </div>

  <section>
    <h2>Popular Beauty Services in ${cityName}</h2>
    <div class="services-grid">
      ${SERVICES.map(s => `<a href="/seo/salons/${citySlug}/${s.slug}/" class="service-link">
        <strong>${s.label} in ${cityName}</strong>
        <br><small>Professional ${s.label.toLowerCase()} services</small>
      </a>`).join('\n      ')}
    </div>
  </section>

  <section>
    <h2>Top-Rated Salons in ${cityName}</h2>
    <p>These are some of the highest-rated salons in ${cityName}, known for their quality services and customer satisfaction:</p>
    ${EXAMPLE_SALONS.map((s, i) => salonCard(s, i, citySlug, cityName)).join('\n    ')}
  </section>

  <section style="margin: 40px 0;">
    <h2>Why Choose ${SITE.brand} for Salon Bookings in ${cityName}?</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
      <div>
        <h3>🔍 Easy Discovery</h3>
        <p>Find the perfect salon in ${cityName} with our smart search and filtering options.</p>
      </div>
      <div>
        <h3>⭐ Verified Reviews</h3>
        <p>Read authentic reviews from real customers to make informed decisions.</p>
      </div>
      <div>
        <h3>💰 Best Prices</h3>
        <p>Compare prices across multiple salons and get the best deals in ${cityName}.</p>
      </div>
      <div>
        <h3>📱 Instant Booking</h3>
        <p>Book your appointment in seconds with our easy online booking system.</p>
      </div>
    </div>
  </section>

  <section style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0;">
    <h2>About Salon Services in ${cityName}</h2>
    <p>${cityName} offers a vibrant beauty and wellness scene with numerous professional salons catering to diverse needs. Whether you're looking for a simple haircut, luxurious spa treatment, or stunning bridal makeup, ${cityName}'s salons provide world-class services.</p>
    <p>Popular areas for salons in ${cityName} include the central business district, residential neighborhoods, and shopping complexes. Most salons offer services like haircuts, hair coloring, facials, spa treatments, bridal makeup, manicures, pedicures, and waxing.</p>
  </section>
</main>
${footer()}
</body>
</html>`;
};

const servicePageHTML = ({ cityName, citySlug, serviceSlug, serviceLabel, state }) => {
  const url = `${SITE.domain}/seo/salons/${citySlug}/${serviceSlug}/`;
  const title = `Best ${serviceLabel} in ${cityName} - Top Salons & Prices | ${SITE.brand}`;
  const description = `Find the best ${serviceLabel.toLowerCase()} services in ${cityName}, ${state}. Compare salons, read reviews, check prices & book instantly with ${SITE.brand}. Professional ${serviceLabel.toLowerCase()} near you.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${baseHead({ title, description, url })}
${serviceSchema({ cityName, serviceLabel, url })}
</head>
<body>
${headerNav()}
<main class="container">
  <div class="breadcrumb">
    <a href="/">Home</a> › <a href="/seo/salons/">Salons</a> › <a href="/seo/salons/${citySlug}/">${cityName}</a> › ${serviceLabel}
  </div>
  
  <h1>Best ${serviceLabel} in ${cityName}, ${state}</h1>
  
  <div class="cta-section">
    <h2>Professional ${serviceLabel} Services in ${cityName}</h2>
    <p>Discover top-rated salons offering expert ${serviceLabel.toLowerCase()} services in ${cityName}. Compare prices, read authentic reviews, and book your appointment instantly.</p>
    <a href="/" class="btn">Book ${serviceLabel} Now</a>
  </div>

  <section>
    <h2>Top Salons for ${serviceLabel} in ${cityName}</h2>
    <p>These salons in ${cityName} are highly rated for their ${serviceLabel.toLowerCase()} services:</p>
    ${EXAMPLE_SALONS.filter(s => s.services.some(service => 
      service.toLowerCase().includes(serviceLabel.toLowerCase()) || 
      serviceLabel.toLowerCase().includes(service.toLowerCase())
    )).map((s, i) => salonCard(s, i, citySlug, cityName)).join('\n    ')}
    
    ${EXAMPLE_SALONS.filter(s => !s.services.some(service => 
      service.toLowerCase().includes(serviceLabel.toLowerCase()) || 
      serviceLabel.toLowerCase().includes(service.toLowerCase())
    )).slice(0, 2).map((s, i) => salonCard(s, i + 10, citySlug, cityName)).join('\n    ')}
  </section>

  <section style="margin: 40px 0;">
    <h2>What to Expect from ${serviceLabel} in ${cityName}</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
      <div>
        <h3>🎯 Expert Technicians</h3>
        <p>Skilled professionals trained in the latest ${serviceLabel.toLowerCase()} techniques and trends.</p>
      </div>
      <div>
        <h3>🏆 Quality Products</h3>
        <p>Premium brands and high-quality products used for all ${serviceLabel.toLowerCase()} services.</p>
      </div>
      <div>
        <h3>💎 Personalized Service</h3>
        <p>Customized ${serviceLabel.toLowerCase()} treatments based on your specific needs and preferences.</p>
      </div>
      <div>
        <h3>🏢 Hygienic Environment</h3>
        <p>Clean, safe, and well-maintained salon spaces following industry standards.</p>
      </div>
    </div>
  </section>

  <section style="background: #f8fafc; padding: 30px; border-radius: 12px;">
    <h2>Popular ${serviceLabel} Trends in ${cityName}</h2>
    <p>Stay updated with the latest ${serviceLabel.toLowerCase()} trends popular in ${cityName}. Our partner salons are always equipped with the newest techniques and styles to keep you looking your best.</p>
    
    <h3>Other Popular Services in ${cityName}</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
      ${SERVICES.filter(s => s.slug !== serviceSlug).slice(0, 6).map(s => 
        `<a href="/seo/salons/${citySlug}/${s.slug}/" style="background: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; color: #8B5CF6; border: 1px solid #e5e7eb; font-size: 14px;">${s.label}</a>`
      ).join('\n      ')}
    </div>
  </section>
</main>
${footer()}
</body>
</html>`;
};

// ----------------------------------------------
// 4) Generator
// ----------------------------------------------
function generate() {
  ensureDir(SITE.outDir);

  // robots.txt
  writeFile(path.join(SITE.outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.domain}/sitemap.xml\n`);

  const sitemapUrls = [];

  CITIES.forEach((city) => {
    const citySlug = slugify(city.name);

    // City page
    const cityDir = path.join(SITE.outDir, 'salons', citySlug);
    const cityUrl = `${SITE.domain}/seo/salons/${citySlug}/`;
    writeFile(path.join(cityDir, 'index.html'), cityPageHTML({
      cityName: city.name,
      citySlug,
      altName: city.alt || '',
      state: city.state
    }));
    sitemapUrls.push({ url: cityUrl, lastmod: SITE.today });

    // Service pages
    SERVICES.forEach((svc) => {
      const svcDir = path.join(cityDir, svc.slug);
      const svcUrl = `${SITE.domain}/seo/salons/${citySlug}/${svc.slug}/`;
      writeFile(path.join(svcDir, 'index.html'), servicePageHTML({
        cityName: city.name,
        citySlug,
        serviceSlug: svc.slug,
        serviceLabel: svc.label,
        state: city.state
      }));
      sitemapUrls.push({ url: svcUrl, lastmod: SITE.today });
    });
  });

  // Main sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n    <loc>${SITE.domain}/</loc>\n    <lastmod>${SITE.today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n` +
    sitemapUrls.map(({ url, lastmod }) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`;
  writeFile(path.join(SITE.outDir, 'sitemap.xml'), sitemap);

  console.log(`✅ Generated ${sitemapUrls.length} SEO pages + sitemap.xml + robots.txt in:`, SITE.outDir);
  console.log(`📁 City pages: ${CITIES.length}`);
  console.log(`🔧 Service pages per city: ${SERVICES.length}`);
  console.log(`🌐 Total SEO pages: ${CITIES.length * (SERVICES.length + 1)}`);
  console.log(`\n📝 Next steps:`);
  console.log(`1. Run: node scripts/generate-seo.js`);
  console.log(`2. Submit sitemap: ${SITE.domain}/sitemap.xml to Google Search Console`);
  console.log(`3. SEO pages will be available at: ${SITE.domain}/seo/salons/[city]/`);
}

generate();