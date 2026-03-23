import { Link, useLocation, useLocation as useWouterLocation } from "wouter";
import { Home, CalendarDays, User, Search, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

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

  const { data: convData } = useQuery<any[]>({
    queryKey: ["/api/customer/chat-conversations"],
    enabled: isAuthenticated && userType === "customer",
    refetchInterval: 15000,
  });
  const unreadMsgs = convData ? convData.reduce((s: number, c: any) => s + (Number(c.unread_count) || 0), 0) : 0;

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
      case "messages":
        return location.startsWith("/customer/messages");
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
      badge: 0,
    },
    {
      key: "explore",
      label: "Explore",
      icon: Search,
      href: "/explore",
      onClick: undefined,
      badge: 0,
    },
    {
      key: "bookings",
      label: "Bookings",
      icon: CalendarDays,
      href: isAuthenticated ? "/customer/bookings" : "/auth",
      onClick: handleAuthRequired("/customer/bookings"),
      badge: 0,
    },
    {
      key: "messages",
      label: "Messages",
      icon: MessageSquare,
      href: isAuthenticated ? "/customer/messages" : "/auth",
      onClick: handleAuthRequired("/customer/messages"),
      badge: unreadMsgs,
    },
    {
      key: "profile",
      label: "Profile",
      icon: User,
      href: isAuthenticated ? "/customer/profile" : "/auth",
      onClick: handleAuthRequired("/customer/profile"),
      badge: 0,
    },
  ];

  return (
    <>
      <div className="h-16" />
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {items.map(({ key, label, icon: Icon, href, onClick, badge }) => {
            const active = isActive(key);
            return (
              <Link key={key} href={href} onClick={onClick as any}>
                <button className="flex flex-col items-center justify-center gap-0.5 w-14 h-full group">
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
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
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
