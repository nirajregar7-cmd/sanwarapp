import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Scissors, User, Store, Calendar, ChevronDown, Menu, X, LogOut, Home, BarChart3, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logoutMutation } = useAuth();
  
  // Auto-detect user type based on current route or authenticated user
  const isOwnerRoute = location.includes('/owner');
  const userType = (user as any)?.userType || (isOwnerRoute ? "salon_owner" : "customer");

  const handleUserTypeSwitch = (type: "customer" | "salon_owner") => {
    // Navigate to the appropriate route
    if (type === "salon_owner") {
      window.location.href = "/owner";
    } else {
      window.location.href = "/customer";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <div className="flex items-center space-x-2 text-lg sm:text-2xl font-bold text-primary cursor-pointer">
                  <Scissors className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="hidden xs:inline sm:inline">Sanwar</span>
                </div>
              </Link>
              
              {/* Navigation Links */}
              {isAuthenticated && !isMobile && (
                <nav className="flex items-center space-x-4">
                  <Link 
                    href="/landing" 
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Home
                  </Link>
                  {userType === "customer" && (
                    <>
                      <Link 
                        href="/salons" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Salons
                      </Link>
                      <Link 
                        href="/bookings" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Bookings
                      </Link>
                    </>
                  )}
                  {userType === "salon_owner" && (
                    <>
                      <Link 
                        href="/owner/dashboard" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/owner/salon-setup" 
                        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                      >
                        Setup
                      </Link>
                    </>
                  )}
                </nav>
              )}
            </div>
            
            {/* Desktop Navigation */}
            {isAuthenticated && !isMobile && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Home Button */}
                <Link href="/landing">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                  >
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
                
                {/* User Type Switcher */}
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all text-gray-700 hover:text-gray-900 ${
                      userType === "customer" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-200"
                    }`}
                    onClick={() => handleUserTypeSwitch("customer")}
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Customer</span>
                    <span className="sm:hidden">User</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all text-gray-700 hover:text-gray-900 ${
                      userType === "salon_owner" ? "bg-green-100 text-green-700" : "hover:bg-gray-200"
                    }`}
                    onClick={() => handleUserTypeSwitch("salon_owner")}
                  >
                    <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Salon Owner</span>
                    <span className="sm:hidden">Owner</span>
                  </Button>
                </div>
                
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

            {!isAuthenticated && (
              <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 sm:px-4">
                <a href="/api/login">Login</a>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          {isAuthenticated && isMobile && mobileMenuOpen && (
            <div className="border-t border-gray-200 py-3 bg-white">
              <div className="space-y-3">
                {/* Navigation Links Mobile */}
                <div className="space-y-2">
                  <Link 
                    href="/" 
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4 mr-3" />
                    Home
                  </Link>
                  {userType === "customer" && (
                    <>
                      <Link 
                        href="/salons" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store className="h-4 w-4 mr-3" />
                        Salons
                      </Link>
                      <Link 
                        href="/bookings" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        My Bookings
                      </Link>
                    </>
                  )}
                  {userType === "salon_owner" && (
                    <>
                      <Link 
                        href="/owner/dashboard" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/owner/salon-setup" 
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Setup
                      </Link>
                    </>
                  )}
                </div>

                {/* User Type Switcher Mobile */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-gray-700">Switch Mode:</p>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 text-xs font-medium ${
                        userType === "customer" ? "bg-blue-100 text-blue-700" : "text-gray-700"
                      }`}
                      onClick={() => {
                        handleUserTypeSwitch("customer");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Customer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 text-xs font-medium ${
                        userType === "salon_owner" ? "bg-green-100 text-green-700" : "text-gray-700"
                      }`}
                      onClick={() => {
                        handleUserTypeSwitch("salon_owner");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Salon Owner
                    </Button>
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {userType === "customer" && (
                    <Link href="/bookings">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        My Bookings
                      </Button>
                    </Link>
                  )}
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
                <li className="text-sm">support@sanwar.com</li>
                <li className="text-sm">+91 98765 43210</li>
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
