import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCountryConfig } from "@/hooks/useCountryConfig";

import { InstallPrompt } from "@/components/InstallPrompt";
import { MobileInstallButton } from "@/components/MobileInstallButton";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { AppClerkProvider } from "@/lib/clerk-provider";
import { LocationProvider } from "@/contexts/LocationContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

import Layout from "@/components/Layout";

// Pages
import Landing from "@/pages/landing";
import ExplorePage from "@/pages/explore";
import FindSalons from "@/pages/customer/find-salons";
import SalonDiscovery from "@/pages/SalonDiscovery";
import AuthPage from "@/pages/auth";

import ForgotPasswordPage from "@/pages/forgot-password";
import EmailVerification from "@/pages/email-verification";
import UserTypeSelection from "@/pages/user-type-selection";
import CustomerHome from "@/pages/customer/home";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import SalonDetail from "@/pages/customer/salon-detail";
import SalonOffersPage from "@/pages/customer/salon-offers";
import CustomerBookings from "@/pages/customer/bookings";
import CustomerMessages from "@/pages/customer/messages";
import CustomerProfile from "@/pages/customer/customer-profile";
import ReferEarnPage from "@/pages/customer/refer-earn";
import SalonSearchPage from "@/pages/customer/salon-search";
import DiscountEnrollment from "@/pages/customer/discount-enrollment";
import FeedbackHelp from "@/pages/feedback-help";
import CountryOnboarding from "@/pages/CountryOnboarding";
import CountrySettings from "@/pages/CountrySettings";
import OwnerDashboard from "@/pages/owner/dashboard";
import TimeSlots from "@/pages/owner/time-slots";
import TimeSlotManagement from "@/pages/owner/time-slot-management";
import StaffSchedulePage from "@/pages/owner/staff-schedule";
import StaffManagement from "@/pages/owner/staff-management";
import StaffSlotGenerator from "@/pages/owner/staff-slot-generator";
import AccountDetails from "@/pages/owner/account-details";
import OwnerMessages from "@/pages/owner/messages";
import DiscountCustomers from "@/pages/owner/discount-customers";
import ReferEarn from "@/pages/owner/refer-earn";
import WalkInBookings from "@/pages/salon-owner/walk-in-bookings";
import ProductsFacilities from "@/pages/salon-owner/products-facilities";
import EmergencyBookings from "@/pages/salon-owner/emergency-bookings";
import MediaGallery from "@/pages/salon-owner/media-gallery";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/admin-dashboard";
import SalonManagement from "@/pages/admin/salon-management";
import UserManagement from "@/pages/admin/user-management";
import ActivityLogs from "@/pages/admin/activity-logs";
import AdminFeedbackSupportPage from "@/pages/admin-feedback-support";
import BrandOwnerManagement from "@/pages/admin/brand-owner-management";
import ImpersonatePage from "@/pages/admin/impersonate";

// Clerk Auth Pages
import ClerkSignInPage, { ClerkSignUpPage } from "@/pages/clerk-auth";

// Brand Owner Pages
import BrandDashboard from "@/pages/brand-owner/brand-dashboard";

// USA SEO Pages
import USAHub from "@/pages/usa/usa-hub";
import USCityDetail from "@/pages/usa/city-detail";

// Blog Page
import Blog from "@/pages/Blog";

// Info Pages
import About from "@/pages/About";
import Services from "@/pages/Services";
import HireStaff from "@/pages/hire-staff";
import Contact from "@/pages/Contact";
import StaffRegistration from "@/pages/staff-registration";
import StaffLogin from "@/pages/staff-login";
import StaffDashboard from "@/pages/staff-dashboard";
import ProfessionalPortal from "@/pages/professional-portal";
import ProfessionalLogin from "@/pages/professional-login";
import ProfessionalDashboard from "@/pages/professional-dashboard";



// Payment Pages
import PaymentCallback from "@/pages/PaymentCallback";

// Owner Settings Pages
import ConfirmationSettings from "@/pages/owner/confirmation-settings";
import OffersPage from "@/pages/owner/offers";
import Analytics from "@/pages/owner/analytics";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isConfigured } = useCountryConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show country onboarding if not configured
  if (!isConfigured) {
    return <CountryOnboarding />;
  }

  return (
    <>
      <ImpersonationBanner />
      <Switch>
        {/* Authentication pages */}
        <Route path="/auth" component={AuthPage} />



      <Route path="/business-signup" component={AuthPage} />
      <Route path="/clerk-signin" component={ClerkSignInPage} />
      <Route path="/clerk-signup" component={ClerkSignUpPage} />
      <Route path="/user-type-selection" component={UserTypeSelection} />
      
      {/* Email verification page */}
      <Route path="/email-verification" component={EmailVerification} />
      <Route path="/email-verification/:userType" component={EmailVerification} />
      
      {/* Password reset page */}
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      
      {/* Payment callback page */}
      <Route path="/payment-callback" component={PaymentCallback} />
      
      {/* Discount enrollment - accessible to all users */}
      <Route path="/discount-enrollment/:salonId" component={DiscountEnrollment} />
      
      {/* Landing page - accessible to all users */}
      <Route path="/landing" component={Landing} />
      
      {/* Explore page - accessible to all users */}
      <Route path="/explore" component={ExplorePage} />

      {/* Salon discovery/listing pages - accessible to all users */}
      <Route path="/salons">
        <Layout>
          <SalonDiscovery />
        </Layout>
      </Route>
      <Route path="/salon">
        <Layout>
          <SalonDiscovery />
        </Layout>
      </Route>
      
      {/* Salon detail pages - accessible to all users */}
      <Route path="/salon/:salonId">
        <Layout>
          <SalonDetail />
        </Layout>
      </Route>
      
      {/* USA SEO pages - accessible to all users */}
      <Route path="/usa" component={USAHub} />
      <Route path="/usa/:slug" component={USCityDetail} />
      
      {/* Blog page - accessible to all users */}
      <Route path="/blog">
        <Layout>
          <Blog />
        </Layout>
      </Route>

      {/* Main routes based on authentication */}
      {!user || !isAuthenticated ? (
        <>
          {/* Home page for non-authenticated users */}
          <Route path="/" component={FindSalons} />
          <Route path="/landing" component={Landing} />
          <Route path="/discover" component={SalonDiscovery} />
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
            ) : (user as any).userType === 'brand_owner' ? (
              <Layout>
                <BrandDashboard />
              </Layout>
            ) : (
              <FindSalons />
            )}
          </Route>

          {/* Dedicated Customer Routes */}
          {(user as any)?.userType === 'customer' && (
            <>
              <Route path="/customer/home" component={FindSalons} />
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
              {/* Alias routes so notifications and links always work */}
              <Route path="/owner/dashboard">
                <Layout>
                  <OwnerDashboard />
                </Layout>
              </Route>
              <Route path="/owner/bookings">
                <Layout>
                  <OwnerDashboard />
                </Layout>
              </Route>
            </>
          )}
          
          {/* Brand Owner Routes */}
          {(user as any)?.userType === 'brand_owner' && (
            <>
              <Route path="/brand/dashboard">
                <Layout>
                  <BrandDashboard />
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
          <Route path="/salon/:salonId/offers">
            <Layout>
              <SalonOffersPage />
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

              <Route path="/customer/messages">
                <Layout>
                  <CustomerMessages />
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
              <Route path="/admin/brand-owners">
                <Layout>
                  <BrandOwnerManagement />
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
              <Route path="/admin/impersonate/:userId">
                <ImpersonatePage />
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
              <Route path="/shopkeeper/time-slot-management">
                <Layout>
                  <TimeSlotManagement />
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
              <Route path="/shopkeeper/emergency-bookings">
                <Layout>
                  <EmergencyBookings />
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
              <Route path="/shopkeeper/discount-customers">
                <Layout>
                  <DiscountCustomers />
                </Layout>
              </Route>
              <Route path="/shopkeeper/confirmation-settings">
                <Layout>
                  <ConfirmationSettings />
                </Layout>
              </Route>
              <Route path="/shopkeeper/offers">
                <Layout>
                  <OffersPage />
                </Layout>
              </Route>
              <Route path="/shopkeeper/analytics">
                <Layout>
                  <Analytics />
                </Layout>
              </Route>
              <Route path="/shopkeeper/media-gallery">
                <Layout>
                  <MediaGallery />
                </Layout>
              </Route>
              
              {/* Legacy owner routes for backward compatibility */}
              <Route path="/owner/time-slots">
                <Layout>
                  <TimeSlots />
                </Layout>
              </Route>
              <Route path="/owner/time-slot-management">
                <Layout>
                  <TimeSlotManagement />
                </Layout>
              </Route>

              <Route path="/owner/staff-schedule">
                <Layout>
                  <StaffSchedulePage />
                </Layout>
              </Route>
              
              <Route path="/owner/staff-management">
                <Layout>
                  <StaffManagement />
                </Layout>
              </Route>
              
              <Route path="/owner/staff-slot-generator">
                <Layout>
                  <StaffSlotGenerator />
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
              <Route path="/owner/confirmation-settings">
                <Layout>
                  <ConfirmationSettings />
                </Layout>
              </Route>
              <Route path="/owner/offers">
                <Layout>
                  <OffersPage />
                </Layout>
              </Route>
              <Route path="/owner/analytics">
                <Layout>
                  <Analytics />
                </Layout>
              </Route>
              <Route path="/owner/media-gallery">
                <Layout>
                  <MediaGallery />
                </Layout>
              </Route>
              <Route path="/owner/messages">
                <Layout>
                  <OwnerMessages />
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

          {/* Country settings route - available for all authenticated users */}
          <Route path="/country-settings">
            <Layout>
              <CountrySettings />
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

      {/* Public Info Pages */}
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/hire-staff" component={HireStaff} />
      <Route path="/contact" component={Contact} />
      <Route path="/staff-registration" component={StaffRegistration} />
      <Route path="/staff-login" component={StaffLogin} />
      <Route path="/staff-dashboard" component={StaffDashboard} />
      <Route path="/professional-portal" component={ProfessionalPortal} />
      <Route path="/professional-login" component={ProfessionalLogin} />
      <Route path="/professional-dashboard" component={ProfessionalDashboard} />

      {/* Fallback routes */}
      <Route path="/landing" component={Landing} />
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <AppClerkProvider>
      <QueryClientProvider client={queryClient}>
        <LocationProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
            <CustomerBottomNav />
            <InstallPrompt />
            <MobileInstallButton />
          </TooltipProvider>
        </LocationProvider>
      </QueryClientProvider>
    </AppClerkProvider>
  );
}

export default App;
