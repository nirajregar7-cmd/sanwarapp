import { Link, useLocation, useLocation as useWouterLocation } from "wouter";
import { Home, CalendarDays, User, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const HIDE_ON_ROUTES = [
  "/owner",
  "/admin",
  "/brand",
  "/auth",
  "/business-signup",
  "/clerk-",
  "/user-type-selection",
  "/landing",
  "/email-verification",
  "/forgot-password",
  "/payment-callback",
];

export function CustomerBottomNav() {
  const [location, navigate] = useWouterLocation();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const userType = (user as any)?.userType;

  const shouldHide =
    HIDE_ON_ROUTES.some((r) => location.startsWith(r)) ||
    userType === "salon_owner" ||
    userType === "admin" ||
    userType === "brand_owner";

  if (!isMobile || shouldHide) return null;

  const homeHref = isAuthenticated ? "/customer/home" : "/";

  const handleAuthRequired = (dest: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      navigate(dest);
    }
  };

  const isActive = (key: string) => {
    switch (key) {
      case "home":
        return location === "/" || location === "/customer/home";
      case "explore":
        return (
          location.startsWith("/explore") ||
          location.startsWith("/salon/") ||
          location.startsWith("/salons") ||
          location.startsWith("/customer/search")
        );
      case "bookings":
        return location.startsWith("/customer/bookings") || location.startsWith("/bookings");
      case "profile":
        return location.startsWith("/customer/profile");
      default:
        return false;
    }
  };

  const items = [
    {
      key: "home",
      label: "Home",
      icon: Home,
      href: homeHref,
      onClick: undefined,
    },
    {
      key: "explore",
      label: "Explore",
      icon: Search,
      href: "/explore",
      onClick: undefined,
    },
    {
      key: "bookings",
      label: "Bookings",
      icon: CalendarDays,
      href: isAuthenticated ? "/customer/bookings" : "/auth",
      onClick: handleAuthRequired("/customer/bookings"),
    },
    {
      key: "profile",
      label: "Profile",
      icon: User,
      href: isAuthenticated ? "/customer/profile" : "/auth",
      onClick: handleAuthRequired("/customer/profile"),
    },
  ];

  return (
    <>
      <div className="h-16" />
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {items.map(({ key, label, icon: Icon, href, onClick }) => {
            const active = isActive(key);
            return (
              <Link key={key} href={href} onClick={onClick as any}>
                <button className="flex flex-col items-center justify-center gap-0.5 w-16 h-full group">
                  <div
                    className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                      active ? "bg-purple-100" : "group-active:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-all duration-200 ${
                        active ? "text-purple-700 stroke-[2.5]" : "text-gray-400 stroke-[1.8]"
                      }`}
                    />
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-600" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      active ? "text-purple-700" : "text-gray-400"
                    }`}
                  >
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
