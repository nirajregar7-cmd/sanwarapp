import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Scissors, User, Store, Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [userType, setUserType] = useState<"customer" | "salon_owner">("customer");
  
  // Temporarily disable authentication for development
  const isAuthenticated = location.includes('/customer') || location.includes('/owner');

  const handleUserTypeSwitch = (type: "customer" | "salon_owner") => {
    setUserType(type);
    // In a real app, you'd update user preferences here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 text-2xl font-bold text-primary cursor-pointer">
                <Scissors className="h-6 w-6" />
                <span>Sanwar</span>
              </div>
            </Link>
            
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                {/* User Type Switcher */}
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      userType === "customer" ? "customer-active" : ""
                    }`}
                    onClick={() => handleUserTypeSwitch("customer")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Customer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      userType === "salon_owner" ? "owner-active" : ""
                    }`}
                    onClick={() => handleUserTypeSwitch("salon_owner")}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Salon Owner
                  </Button>
                </div>
                
                {/* Profile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="hidden sm:block">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <ChevronDown className="h-4 w-4" />
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
                    <DropdownMenuItem asChild>
                      <a href="/api/logout">
                        Logout
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!isAuthenticated && (
              <Button asChild>
                <a href="/api/login">Login</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 text-2xl font-bold mb-4">
                <Scissors className="h-6 w-6" />
                <span>Sanwar</span>
              </div>
              <p className="text-gray-300">
                Connecting customers with the best salon services in their area.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Customers</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-white">Find Salons</Link></li>
                <li><Link href="/bookings" className="hover:text-white">My Bookings</Link></li>
                <li><a href="#" className="hover:text-white">Help & Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Salon Owners</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">List Your Salon</a></li>
                <li><a href="#" className="hover:text-white">Manage Bookings</a></li>
                <li><a href="#" className="hover:text-white">Business Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-300">
                <li>support@sanwar.com</li>
                <li>+91 98765 43210</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sanwar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
