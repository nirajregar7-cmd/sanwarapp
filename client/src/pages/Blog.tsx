import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Clock, User, ArrowRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  useEffect(() => {
    // Simulate loading time for smooth animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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
        },
        "sameAs": [
          "https://www.instagram.com/vishal14104",
          "https://facebook.com/sanwarhub",
          "https://twitter.com/sanwarhub",
          "https://linkedin.com/company/sanwarhub"
        ]
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

  // Filter blog posts based on category and search query
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white overflow-hidden"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            variants={itemVariants}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              SanwarHub Beauty Blog
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl mb-8 opacity-90"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Expert Beauty Tips, Trends & Professional Advice
            </motion.p>
            <motion.div 
              className="text-sm opacity-75"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/" className="hover:underline transition-all duration-200">Home</Link> 
              <span className="mx-2">›</span> 
              <span>Blog</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 py-12"
        variants={containerVariants}
      >
        {/* Search and Filter Section */}
        <motion.section 
          className="mb-12"
          variants={itemVariants}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search Input */}
              <motion.div 
                className="relative flex-1"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search beauty tips, trends, and advice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                />
              </motion.div>
              
              {/* Category Filter */}
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Blog Posts Grid */}
        <motion.section className="mb-16">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${selectedCategory}-${searchQuery}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              {filteredPosts.length === 0 ? (
                <motion.div 
                  className="col-span-full text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-2">No posts found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </motion.div>
              ) : (
                filteredPosts.map((post, index) => (
                  <motion.article 
                    key={post.id} 
                    className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
                    variants={cardHoverVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
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
                  </motion.article>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* Categories Section */}
        <motion.section 
          className="mb-16"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-3xl font-bold text-center mb-12 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Explore Beauty Categories
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            {categories.map((category, index) => (
              <motion.div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-md cursor-pointer text-center"
                variants={itemVariants}
                whileHover={{ 
                  y: -5, 
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.name)}
                transition={{ duration: 0.3 }}
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
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Ready to Book Your Beauty Appointment?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 opacity-90"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Find and book the best salons in your area with SanwarHub
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/">
              <motion.button 
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-300"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Book Now
              </motion.button>
            </Link>
          </motion.div>
        </motion.section>
      </motion.div>
    </motion.div>
  );
}