import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import CustomerHome from "@/pages/customer/home";
import SalonDetail from "@/pages/customer/salon-detail";
import CustomerBookings from "@/pages/customer/bookings";
import OwnerDashboard from "@/pages/owner/dashboard";
import TimeSlots from "@/pages/owner/time-slots";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Landing page without Layout (has its own footer design) */}
      <Route path="/" component={Landing} />
      
      {/* Other pages with Layout */}
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
