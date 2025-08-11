import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { InstallPrompt } from "@/components/InstallPrompt";

import Layout from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import ForgotPasswordPage from "@/pages/forgot-password";
import UserTypeSelection from "@/pages/user-type-selection";
import CustomerHome from "@/pages/customer/home";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import SalonDetail from "@/pages/customer/salon-detail";
import CustomerBookings from "@/pages/customer/bookings";
import CustomerProfile from "@/pages/customer/customer-profile";
import ReferEarnPage from "@/pages/customer/refer-earn";
import SalonSearchPage from "@/pages/customer/salon-search";
import FeedbackHelp from "@/pages/feedback-help";
import OwnerDashboard from "@/pages/owner/dashboard";
import TimeSlots from "@/pages/owner/time-slots";
import AccountDetails from "@/pages/owner/account-details";
import ReferEarn from "@/pages/owner/refer-earn";
import WalkInBookings from "@/pages/salon-owner/walk-in-bookings";
import ProductsFacilities from "@/pages/salon-owner/products-facilities";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/admin-dashboard";
import SalonManagement from "@/pages/admin/salon-management";
import UserManagement from "@/pages/admin/user-management";
import ActivityLogs from "@/pages/admin/activity-logs";
import AdminFeedbackSupportPage from "@/pages/admin-feedback-support";

// Clerk Auth Pages
import ClerkSignInPage, { ClerkSignUpPage } from "@/pages/clerk-auth";

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
      {/* Authentication pages */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/clerk-signin" component={ClerkSignInPage} />
      <Route path="/clerk-signup" component={ClerkSignUpPage} />
      <Route path="/user-type-selection" component={UserTypeSelection} />
      
      {/* Password reset page */}
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      
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
          {/* Home page redirects based on user type */}
          <Route path="/">
            {(user as any).userType === 'admin' || (user as any).userType === 'super_admin' ? (
              <Layout>
                <AdminDashboard />
              </Layout>
            ) : (user as any).userType === 'salon_owner' ? (
              <Layout>
                <OwnerDashboard />
              </Layout>
            ) : (
              <Layout>
                <CustomerHome />
              </Layout>
            )}
          </Route>

          {/* Dedicated Customer Routes */}
          {(user as any)?.userType === 'customer' && (
            <>
              <Route path="/customer/home">
                <Layout>
                  <CustomerHome />
                </Layout>
              </Route>
            </>
          )}

          {/* Dedicated Shopkeeper Routes */}
          {(user as any)?.userType === 'salon_owner' && (
            <>
              <Route path="/shopkeeper/dashboard">
                <Layout>
                  <OwnerDashboard />
                </Layout>
              </Route>
            </>
          )}
          
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
          {(user as any)?.userType === 'customer' && (
            <>
              <Route path="/customer/bookings">
                <Layout>
                  <CustomerBookings />
                </Layout>
              </Route>

              <Route path="/customer/profile">
                <Layout>
                  <CustomerProfile />
                </Layout>
              </Route>

              <Route path="/customer/refer-earn">
                <Layout>
                  <ReferEarnPage />
                </Layout>
              </Route>

              <Route path="/customer/search">
                <Layout>
                  <SalonSearchPage />
                </Layout>
              </Route>
              
              {/* Legacy customer routes for backward compatibility */}
              <Route path="/bookings">
                <Layout>
                  <CustomerBookings />
                </Layout>
              </Route>

              <Route path="/refer-earn">
                <Layout>
                  <ReferEarnPage />
                </Layout>
              </Route>

              <Route path="/search">
                <Layout>
                  <SalonSearchPage />
                </Layout>
              </Route>
            </>
          )}

          {/* Admin specific routes */}
          {((user as any)?.userType === 'admin' || (user as any)?.userType === 'super_admin') && (
            <>
              <Route path="/admin/dashboard">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </Route>
              <Route path="/admin/salons">
                <Layout>
                  <SalonManagement />
                </Layout>
              </Route>
              <Route path="/admin/users">
                <Layout>
                  <UserManagement />
                </Layout>
              </Route>
              <Route path="/admin/activity-logs">
                <Layout>
                  <ActivityLogs />
                </Layout>
              </Route>
              <Route path="/admin/feedback-support">
                <Layout>
                  <AdminFeedbackSupportPage />
                </Layout>
              </Route>
            </>
          )}

          {/* Shopkeeper-specific routes */}
          {(user as any)?.userType === 'salon_owner' && (
            <>
              <Route path="/shopkeeper/time-slots">
                <Layout>
                  <TimeSlots />
                </Layout>
              </Route>
              <Route path="/shopkeeper/walk-in-bookings">
                <Layout>
                  <WalkInBookings />
                </Layout>
              </Route>
              <Route path="/shopkeeper/products-facilities">
                <Layout>
                  <ProductsFacilities />
                </Layout>
              </Route>
              <Route path="/shopkeeper/refer-earn">
                <Layout>
                  <ReferEarn />
                </Layout>
              </Route>
              <Route path="/shopkeeper/account-details">
                <Layout>
                  <AccountDetails />
                </Layout>
              </Route>
              
              {/* Legacy owner routes for backward compatibility */}
              <Route path="/owner/time-slots">
                <Layout>
                  <TimeSlots />
                </Layout>
              </Route>
              <Route path="/owner/walk-in-bookings">
                <Layout>
                  <WalkInBookings />
                </Layout>
              </Route>
              <Route path="/owner/refer-earn">
                <Layout>
                  <ReferEarn />
                </Layout>
              </Route>
              <Route path="/owner/account-details">
                <Layout>
                  <AccountDetails />
                </Layout>
              </Route>
            </>
          )}
          
          {/* Notification settings route */}
          <Route path="/notifications">
            <Layout>
              <NotificationSettingsPage />
            </Layout>
          </Route>
          
          {/* Feedback and Help route - available for all authenticated users */}
          <Route path="/feedback">
            <Layout>
              <FeedbackHelp />
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
        <Router />
        <Toaster />
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
