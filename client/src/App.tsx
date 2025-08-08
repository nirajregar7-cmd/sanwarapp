import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import UserTypeSelection from "@/pages/user-type-selection";
import CustomerHome from "@/pages/customer/home";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import SalonDetail from "@/pages/customer/salon-detail";
import CustomerBookings from "@/pages/customer/bookings";
import ReferEarnPage from "@/pages/customer/refer-earn";
import SalonSearchPage from "@/pages/customer/salon-search";
import OwnerDashboard from "@/pages/owner/dashboard";
import TimeSlots from "@/pages/owner/time-slots";
import AccountDetails from "@/pages/owner/account-details";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Authentication page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Landing page - accessible to all users */}
      <Route path="/landing" component={Landing} />
      
      {/* Salon detail pages - accessible to all users */}
      <Route path="/salon/:salonId">
        <Layout>
          <SalonDetail />
        </Layout>
      </Route>

      {/* Main routes based on authentication */}
      {!user || !isAuthenticated ? (
        <>
          {/* Home page for non-authenticated users */}
          <Route path="/" component={Landing} />
        </>
      ) : (user as any)?.userType ? (
        // Authenticated users with user type set
        <>
          {/* Home page - shows appropriate content based on user type */}
          <Route path="/">
            {(user as any).userType === 'salon_owner' ? (
              <Layout>
                <OwnerDashboard />
              </Layout>
            ) : (
              <Layout>
                <CustomerHome />
              </Layout>
            )}
          </Route>
          
          {/* Salon detail pages */}
          <Route path="/salon/:salonId">
            <Layout>
              <SalonDetail />
            </Layout>
          </Route>
          <Route path="/customer/salon/:salonId">
            <Layout>
              <SalonDetail />
            </Layout>
          </Route>
          
          {/* Customer-specific routes */}
          <Route path="/bookings">
            <Layout>
              <CustomerBookings />
            </Layout>
          </Route>

          {/* Customer Refer & Earn page */}
          <Route path="/refer-earn">
            <Layout>
              <ReferEarnPage />
            </Layout>
          </Route>

          {/* Salon Search page */}
          <Route path="/search">
            <Layout>
              <SalonSearchPage />
            </Layout>
          </Route>

          {/* Owner-specific routes */}
          <Route path="/owner/time-slots">
            <Layout>
              <TimeSlots />
            </Layout>
          </Route>
          <Route path="/owner/account-details">
            <Layout>
              <AccountDetails />
            </Layout>
          </Route>
          
          {/* Notification settings route */}
          <Route path="/notifications">
            <Layout>
              <NotificationSettingsPage />
            </Layout>
          </Route>
        </>
      ) : (
        // Authenticated users without user type - show selection page
        <Route path="/" component={UserTypeSelection} />
      )}

      {/* Fallback routes */}
      <Route path="/landing" component={Landing} />
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
