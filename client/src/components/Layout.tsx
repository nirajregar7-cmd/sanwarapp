import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Scissors, User, Store, Calendar, ChevronDown, Menu, X, LogOut, Home, BarChart3, Settings, Gift, Search, UserPlus, MessageSquare, Package, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const { t } = useTranslation();
  
  // Auto-detect user type based on current route or authenticated user
  const isOwnerRoute = location.includes('/owner');
  const userType = (user as any)?.userType || (isOwnerRoute ? "salon_owner" : "customer");



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <div className="flex items-center space-x-2 text-lg sm:text-2xl font-bold text-primary cursor-pointer">
                  <Scissors className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="hidden sm:inline">Sanwar</span>
                </div>
              </Link>
              
              {/* Navigation Links */}
              {isAuthenticated && !isMobile && (
                <nav className="flex items-center space-x-2 lg:space-x-4">
                  <Link 
                    href="/" 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {userType === "salon_owner" ? "Dashboard" : "Home"}
                  </Link>
                  {userType === "customer" && (
                    <>
                      <Link 
                        href="/customer/search" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Find Salons
                      </Link>
                      <Link 
                        href="/customer/bookings" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Bookings
                      </Link>
                      <Link 
                        href="/customer/profile" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Profile
                      </Link>
                      <Link 
                        href="/customer/refer-earn" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Refer & Earn
                      </Link>
                    </>
                  )}
                  {userType === "salon_owner" && (
                    <>
                      <Link 
                        href="/shopkeeper/walk-in-bookings" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Walk-in Customers
                      </Link>
                      <Link 
                        href="/shopkeeper/products-facilities" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Products & Facilities
                      </Link>
                      <Link 
                        href="/shopkeeper/account-details" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Account Details
                      </Link>
                    </>
                  )}
                  {(userType === "admin" || userType === "super_admin") && (
                    <>
                      <Link 
                        href="/admin/dashboard" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Admin Dashboard
                      </Link>
                      <Link 
                        href="/admin/salons" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Salons
                      </Link>
                      <Link 
                        href="/admin/users" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Users
                      </Link>
                      <Link 
                        href="/admin/brand-owners" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Brand Owners
                      </Link>
                      <Link 
                        href="/admin/feedback-support" 
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Support
                      </Link>
                    </>
                  )}
                  {/* Feedback link - available for all authenticated users */}
                  <Link 
                    href="/feedback" 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-2 lg:px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden lg:inline">Feedback</span>
                  </Link>
                </nav>
              )}
            </div>
            
            {/* Desktop Navigation */}
            {isAuthenticated && !isMobile && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Profile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 px-2 sm:px-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <span className="hidden md:block text-gray-700 text-sm">Profile</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {userType === "customer" && (
                      <DropdownMenuItem asChild>
                        <Link href="/bookings">
                          <Calendar className="h-4 w-4 mr-2" />
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()}
                      className="cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Right side items */}
            <div className="flex items-center space-x-2">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {!isAuthenticated && (
                <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 sm:px-4">
                  <a href="/api/login">{t('nav.login')}</a>
                </Button>
              )}

              {/* Mobile Menu Button */}
              {isAuthenticated && isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 h-10 w-10 flex items-center justify-center"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {isAuthenticated && isMobile && mobileMenuOpen && (
            <div className="border-t border-gray-200 dark:border-gray-700 py-3 bg-white dark:bg-gray-900">
              <div className="space-y-3">
                {/* Navigation Links Mobile */}
                <div className="space-y-2 px-4">
                  <Link 
                    href="/" 
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4 mr-3" />
                    {userType === "salon_owner" ? "Dashboard" : "Home"}
                  </Link>
                  {userType === "customer" && (
                    <>
                      <Link 
                        href="/customer/search" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Search className="h-4 w-4 mr-3" />
                        Find Salons
                      </Link>
                      <Link 
                        href="/customer/bookings" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        My Bookings
                      </Link>
                      <Link 
                        href="/customer/profile" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        My Profile
                      </Link>
                      <Link 
                        href="/customer/refer-earn" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Gift className="h-4 w-4 mr-3" />
                        Refer & Earn
                      </Link>
                    </>
                  )}
                  {userType === "salon_owner" && (
                    <>
                      <Link 
                        href="/shopkeeper/time-slots" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Time Slots
                      </Link>
                      <Link 
                        href="/shopkeeper/walk-in-bookings" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="h-4 w-4 mr-3" />
                        Walk-in Customers
                      </Link>
                      <Link 
                        href="/shopkeeper/products-facilities" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 mr-3" />
                        Products & Facilities
                      </Link>
                      <Link 
                        href="/shopkeeper/account-details" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Account Details
                      </Link>
                    </>
                  )}
                  
                  {/* Admin Mobile Links */}
                  {(userType === "admin" || userType === "super_admin") && (
                    <>
                      <Link 
                        href="/admin/dashboard" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Admin Dashboard
                      </Link>
                      <Link 
                        href="/admin/salons" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store className="h-4 w-4 mr-3" />
                        Salons
                      </Link>
                      <Link 
                        href="/admin/users" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Users
                      </Link>
                      <Link 
                        href="/admin/brand-owners" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Crown className="h-4 w-4 mr-3" />
                        Brand Owners
                      </Link>
                      <Link 
                        href="/admin/feedback-support" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageSquare className="h-4 w-4 mr-3" />
                        Support
                      </Link>
                    </>
                  )}
                  
                  {/* Feedback link - available for all authenticated users */}
                  <Link 
                    href="/feedback" 
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Feedback & Support
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 px-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      logoutMutation.mutate();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                <Scissors className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Sanwar</span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                Connecting customers with the best salon services in their area.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Customers</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-white text-sm transition-colors">Find Salons</Link></li>
                <li><Link href="/bookings" className="hover:text-white text-sm transition-colors">My Bookings</Link></li>
                <li><a href="#" className="hover:text-white text-sm transition-colors">Help & Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Salon Owners</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white text-sm transition-colors">List Your Salon</a></li>
                <li><a href="#" className="hover:text-white text-sm transition-colors">Manage Bookings</a></li>
                <li><a href="#" className="hover:text-white text-sm transition-colors">Business Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="text-sm">nirajregar7@gmail.com</li>
                <li className="text-sm">+91 95875 59061</li>
                <li className="text-sm">Mumbai, India</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-sm">&copy; 2024 Sanwar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
