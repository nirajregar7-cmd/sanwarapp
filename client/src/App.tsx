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
import NotFound from "@/pages/not-found";

function Router() {
  // Temporarily show landing page while we fix authentication
  // TODO: Re-enable authentication once the core app is working
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/customer" component={CustomerHome} />
        <Route path="/salon/:id" component={SalonDetail} />
        <Route path="/bookings" component={CustomerBookings} />
        <Route path="/owner" component={OwnerDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
