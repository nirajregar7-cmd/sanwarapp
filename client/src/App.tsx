import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import UserTypeSelection from "@/pages/user-type-selection";
import CustomerHome from "@/pages/customer/home";
import SalonDetail from "@/pages/customer/salon-detail";
import CustomerBookings from "@/pages/customer/bookings";
import OwnerDashboard from "@/pages/owner/dashboard";
import TimeSlots from "@/pages/owner/time-slots";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing page for non-authenticated users */}
      {!user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/customer/salon/:salonId">
            <Layout>
              <SalonDetail />
            </Layout>
          </Route>
        </>
      ) : (user as any)?.userType ? (
        // Authenticated users with user type set
        <>
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
          
          {/* Customer routes */}
          <Route path="/customer">
            <Layout>
              <CustomerHome />
            </Layout>
          </Route>
          <Route path="/customer/salon/:salonId">
            <Layout>
              <SalonDetail />
            </Layout>
          </Route>
          <Route path="/bookings">
            <Layout>
              <CustomerBookings />
            </Layout>
          </Route>

          {/* Owner routes */}
          <Route path="/owner">
            <Layout>
              <OwnerDashboard />
            </Layout>
          </Route>
          <Route path="/owner/time-slots">
            <Layout>
              <TimeSlots />
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
