import { useEffect } from 'react';
import { Link } from 'wouter';
import { Clock, User, ArrowRight } from 'lucide-react';

export default function Blog() {
  useEffect(() => {
    // Set SEO meta tags
    document.title = "Beauty & Salon Tips Blog - SanwarHub | Expert Beauty Advice & Trends";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover expert beauty tips, salon trends, hair care advice, and skincare routines on SanwarHub blog. Get professional beauty insights from top salons across India.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Discover expert beauty tips, salon trends, hair care advice, and skincare routines on SanwarHub blog. Get professional beauty insights from top salons across India.';
      document.head.appendChild(meta);
    }

    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'beauty blog, salon tips, hair care, skincare, beauty trends, salon booking, beauty advice, makeup tips, hair styling, spa treatments, beauty parlour, salon services');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'beauty blog, salon tips, hair care, skincare, beauty trends, salon booking, beauty advice, makeup tips, hair styling, spa treatments, beauty parlour, salon services';
      document.head.appendChild(meta);
    }

    // Add Open Graph meta tags
    const setOGMeta = (property: string, content: string) => {
      const existing = document.querySelector(`meta[property="${property}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    setOGMeta('og:title', 'Beauty & Salon Tips Blog - SanwarHub');
    setOGMeta('og:description', 'Expert beauty tips, salon trends, and professional advice from India\'s leading salon booking platform.');
    setOGMeta('og:type', 'website');
    setOGMeta('og:url', window.location.href);

    // Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "SanwarHub Beauty Blog",
      "description": "Expert beauty tips, salon trends, and professional advice from India's leading salon booking platform",
      "url": window.location.href,
      "publisher": {
        "@type": "Organization",
        "name": "SanwarHub",
        "url": "https://sanwarhub.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sanwarhub.in/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      document.title = "SanwarHub - Smart Salon Booking Platform";
    };
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: "10 Essential Hair Care Tips for Healthy, Shiny Hair",
      excerpt: "Discover professional hair care secrets that salon experts use to keep your hair healthy, strong, and beautiful all year round.",
      category: "Hair Care",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
      author: "SanwarHub Team",
      publishedAt: "2024-09-01"
    },
    {
      id: 2,
      title: "The Ultimate Skincare Routine for Indian Skin",
      excerpt: "Learn about the best skincare practices tailored specifically for Indian skin types and climate conditions.",
      category: "Skincare",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=200&fit=crop",
      author: "Beauty Expert",
      publishedAt: "2024-08-28"
    },
    {
      id: 3,
      title: "Latest Makeup Trends for 2024: What's Hot This Season",
      excerpt: "Stay updated with the latest makeup trends and techniques that are dominating the beauty industry this year.",
      category: "Makeup",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
      author: "Makeup Artist",
      publishedAt: "2024-08-25"
    },
    {
      id: 4,
      title: "How to Choose the Right Salon for Your Beauty Needs",
      excerpt: "A comprehensive guide to selecting the perfect salon that matches your requirements, budget, and expectations.",
      category: "Salon Tips",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
      author: "SanwarHub Team",
      publishedAt: "2024-08-22"
    },
    {
      id: 5,
      title: "Top 5 Spa Treatments for Stress Relief and Relaxation",
      excerpt: "Explore the most effective spa treatments that help you unwind, destress, and rejuvenate your mind and body.",
      category: "Spa & Wellness",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=200&fit=crop",
      author: "Wellness Expert",
      publishedAt: "2024-08-20"
    },
    {
      id: 6,
      title: "Complete Bridal Beauty Guide: From Skincare to Makeup",
      excerpt: "Everything you need to know about bridal beauty preparations, timelines, and tips for your special day.",
      category: "Bridal Beauty",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=200&fit=crop",
      author: "Bridal Expert",
      publishedAt: "2024-08-18"
    }
  ];

  const categories = [
    { name: "Hair Care", description: "Tips, treatments & styling advice", count: 12 },
    { name: "Skincare", description: "Routines, products & expert advice", count: 18 },
    { name: "Makeup", description: "Trends, tutorials & product reviews", count: 15 },
    { name: "Spa & Wellness", description: "Relaxation & therapeutic treatments", count: 8 },
    { name: "Salon Tips", description: "Choosing services & salon etiquette", count: 10 },
    { name: "Bridal Beauty", description: "Wedding preparation & special occasions", count: 6 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              SanwarHub Beauty Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Expert Beauty Tips, Trends & Professional Advice
            </p>
            <div className="text-sm opacity-75">
              <Link href="/" className="hover:underline">Home</Link> 
              <span className="mx-2">›</span> 
              <span>Blog</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Blog Posts Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article 
                key={post.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-800 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Explore Beauty Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
              >
                <h3 className="text-xl font-semibold text-purple-600 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-3">
                  {category.description}
                </p>
                <span className="text-sm text-gray-500">
                  {category.count} articles
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Beauty Appointment?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Find and book the best salons in your area with SanwarHub
          </p>
          <Link href="/">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 text-lg">
              Book Now
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
}