import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Menu, X } from "lucide-react";
import sanwarLogo from "@/assets/sanwar-logo.png";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Get Salon Job" },
  { href: "/hire-staff", label: "Hire Staff" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <img
                src={sanwarLogo}
                alt="Sanwar"
                className="w-16 h-16 object-contain transform group-hover:scale-110 transition-all duration-300"
              />
              <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                Sanwar
              </span>
              <p className="text-xs text-gray-500 font-medium -mt-1">Smart Salon Booking</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 transition-all font-semibold group ${
                    isActive ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}

            {isAuthenticated ? (
              <Link
                href="/"
                className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2"
              >
                <span>Login / Register</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 px-4 bg-white">
            <div className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      isActive
                        ? "text-purple-600 bg-purple-50"
                        : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2">
                {isAuthenticated ? (
                  <Link
                    href="/"
                    className="block text-center bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-3 rounded-full font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-3 rounded-full font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login / Register <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
