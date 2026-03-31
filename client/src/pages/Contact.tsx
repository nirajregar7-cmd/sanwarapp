import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, Users, HelpCircle } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { useState } from "react";

export default function Contact() {
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <PublicNav />

      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            We're here to help! Reach out to us for any questions, support, or partnership opportunities.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      data-testid="input-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      data-testid="input-subject"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      rows={5}
                      data-testid="textarea-message"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    data-testid="button-send-message"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-gray-600">support@sanwarhub.in</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-gray-600">+91 XXX-XXX-XXXX</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-gray-600">India</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Support Hours</div>
                    <div className="text-gray-600">24/7 Customer Support</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.instagram.com/vishal14104" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    data-testid="link-instagram"
                  >
                    <SiInstagram className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://facebook.com/sanwarhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                    data-testid="link-facebook"
                  >
                    <SiFacebook className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://twitter.com/sanwarhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-black text-white rounded-lg hover:shadow-lg transition-all"
                    data-testid="link-twitter"
                  >
                    <SiX className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/sanwarhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-700 text-white rounded-lg hover:shadow-lg transition-all"
                    data-testid="link-linkedin"
                  >
                    <SiLinkedin className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-purple-600" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">For Customers</div>
                    <div className="text-gray-600">Booking issues, cancellations, payment queries</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">For Salon Owners</div>
                    <div className="text-gray-600">Partnership, dashboard support, business growth</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Technical Support</div>
                    <div className="text-gray-600">App issues, account problems, feature requests</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" data-testid="button-view-faqs">
                  <Link href="/feedback">View All FAQs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Partnership Section */}
        <div className="mt-16">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-4">Partner with Sanwar</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Are you a salon owner looking to grow your business? Join our platform and reach thousands of potential customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  data-testid="button-partner-signup"
                >
                  <Link href="/auth">Become a Partner</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                  data-testid="button-learn-partnership"
                >
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}