import { Link, useLocation } from "wouter";
import { Home, CalendarDays, User, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const CUSTOMER_ROUTES = [
  "/",
  "/customer/home",
  "/customer/bookings",
  "/customer/profile",
  "/salons",
  "/salon",
  "/find-salons",
  "/salon-search",
];

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/find-salons", icon: Search, label: "Explore" },
  { href: "/customer/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/customer/profile", icon: User, label: "Profile" },
];

export function CustomerBottomNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const userType = (user as any)?.userType;

  const isCustomerPage = CUSTOMER_ROUTES.some(
    (route) => location === route || location.startsWith(route + "/") || location.startsWith("/salon/") || location.startsWith("/salons")
  );

  const isOwnerOrAdmin = userType === "salon_owner" || userType === "admin" || location.startsWith("/owner") || location.startsWith("/admin") || location.startsWith("/brand");

  if (!isMobile || isOwnerOrAdmin || !isCustomerPage) return null;

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "/customer/home";
    if (href === "/find-salons") return location.startsWith("/find-salons") || location.startsWith("/salon-search") || location.startsWith("/salon/") || location.startsWith("/salons");
    return location.startsWith(href);
  };

  return (
    <>
      <div className="h-16" />
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}>
                <button className="flex flex-col items-center justify-center gap-0.5 w-16 h-full group">
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${active ? "bg-purple-100" : "group-active:bg-gray-100"}`}>
                    <Icon
                      className={`h-5 w-5 transition-all duration-200 ${active ? "text-purple-700 stroke-[2.5]" : "text-gray-400 stroke-[1.8]"}`}
                    />
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-600" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? "text-purple-700" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
