import { useState, useEffect } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  image?: string;
  action?: 'highlight' | 'click' | 'scroll';
}

export function useOnboarding(userType: 'customer' | 'salon-owner' | 'brand-owner') {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    // Check if onboarding was already completed
    const onboardingStatus = localStorage.getItem(`sanwar_onboarding_${userType}`);
    const freshSignup = localStorage.getItem(`sanwar_onboarding_${userType}_fresh_signup`);
    
    console.log(`[Onboarding] Checking status for ${userType}:`, onboardingStatus, 'Fresh signup:', freshSignup);
    
    // Show onboarding if: no status, pending status, OR fresh signup (new user)
    if (!onboardingStatus || onboardingStatus === 'pending' || freshSignup === 'true') {
      // Remove the fresh signup flag so it only triggers once
      if (freshSignup === 'true') {
        localStorage.removeItem(`sanwar_onboarding_${userType}_fresh_signup`);
        console.log(`[Onboarding] Fresh signup detected, triggering onboarding for ${userType}`);
      }
      
      // Set appropriate steps based on user type
      const steps = getOnboardingSteps(userType);
      setOnboardingSteps(steps);
      
      console.log(`[Onboarding] Will show onboarding for ${userType} with ${steps.length} steps`);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setShouldShowOnboarding(true);
      }, 1500); // Increased delay for better reliability
    } else {
      console.log(`[Onboarding] Skipping onboarding for ${userType} - status: ${onboardingStatus}`);
    }
  }, [userType]);

  const completeOnboarding = () => {
    console.log(`[Onboarding] Completing onboarding for ${userType}`);
    setShouldShowOnboarding(false);
    localStorage.setItem(`sanwar_onboarding_${userType}`, 'completed');
  };

  const skipOnboarding = () => {
    console.log(`[Onboarding] Skipping onboarding for ${userType}`);
    setShouldShowOnboarding(false);
    localStorage.setItem(`sanwar_onboarding_${userType}`, 'skipped');
  };

  const resetOnboarding = () => {
    console.log(`[Onboarding] Resetting onboarding for ${userType}`);
    localStorage.removeItem(`sanwar_onboarding_${userType}`);
    setShouldShowOnboarding(false);
    // Trigger re-evaluation
    setTimeout(() => {
      const steps = getOnboardingSteps(userType);
      setOnboardingSteps(steps);
      setShouldShowOnboarding(true);
    }, 100);
  };

  return {
    shouldShowOnboarding,
    onboardingSteps,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}

function getOnboardingSteps(userType: 'customer' | 'salon-owner' | 'brand-owner'): OnboardingStep[] {
  switch (userType) {
    case 'customer':
      return [
        {
          id: 'welcome',
          title: 'Welcome to Sanwar!',
          description: 'Discover and book appointments at the best salons near you. Let\'s get you started!',
          position: 'center'
        },
        {
          id: 'browse-salons',
          title: 'Browse Featured Salons',
          description: 'Explore popular salons in your area. Each salon shows ratings, services, and real-time availability.',
          targetSelector: '[data-testid="featured-salons"]',
          position: 'top'
        },
        {
          id: 'search-functionality',
          title: 'Search for Salons',
          description: 'Use the search bar to find specific salons by name, location, or services offered.',
          targetSelector: '[data-testid="search-input"]',
          position: 'bottom'
        },
        {
          id: 'booking-process',
          title: 'Easy Booking Process',
          description: 'Click on any salon to view services, select time slots, and book instantly with confirmation.',
          targetSelector: '[data-testid="salon-card"]',
          position: 'right'
        },
        {
          id: 'profile-menu',
          title: 'Your Profile & Bookings',
          description: 'Access your bookings, update profile, and manage preferences from the menu.',
          targetSelector: '[data-testid="user-menu"]',
          position: 'left'
        }
      ];
      
    case 'salon-owner':
      return [
        {
          id: 'welcome-owner',
          title: 'Welcome to Your Salon Dashboard!',
          description: 'Manage your salon, bookings, and grow your business with Sanwar\'s powerful tools.',
          position: 'center'
        },
        {
          id: 'salon-overview',
          title: 'Salon Overview',
          description: 'View your salon\'s performance, today\'s bookings, and key metrics at a glance.',
          targetSelector: '[data-testid="salon-stats"]',
          position: 'top'
        },
        {
          id: 'manage-services',
          title: 'Manage Services',
          description: 'Add, edit, or remove services. Set prices and descriptions to attract customers.',
          targetSelector: '[data-testid="services-section"]',
          position: 'right'
        },
        {
          id: 'staff-management',
          title: 'Staff Management',
          description: 'Add staff members, set their working hours, and manage their schedules.',
          targetSelector: '[data-testid="staff-tab"]',
          position: 'bottom'
        },
        {
          id: 'time-slots',
          title: 'Time Slot Management',
          description: 'Create and manage available time slots for bookings. Control your salon\'s availability.',
          targetSelector: '[data-testid="bookings-tab"]',
          position: 'left'
        },
        {
          id: 'settings',
          title: 'Salon Settings',
          description: 'Configure confirmation fees, offers, and other salon preferences.',
          targetSelector: '[data-testid="settings-tab"]',
          position: 'bottom'
        }
      ];
      
    case 'brand-owner':
      return [
        {
          id: 'welcome-brand',
          title: 'Welcome to Brand Management!',
          description: 'Manage multiple salon locations and oversee your brand\'s growth across the platform.',
          position: 'center'
        },
        {
          id: 'brand-overview',
          title: 'Brand Dashboard',
          description: 'Monitor performance across all your salon locations with comprehensive analytics.',
          targetSelector: '[data-testid="brand-stats"]',
          position: 'top'
        },
        {
          id: 'salon-locations',
          title: 'Manage Salon Locations',
          description: 'View and manage all your salon locations. Add new locations or update existing ones.',
          targetSelector: '[data-testid="salon-locations"]',
          position: 'right'
        },
        {
          id: 'analytics',
          title: 'Analytics & Insights',
          description: 'Access detailed analytics, revenue tracking, and customer insights across all locations.',
          targetSelector: '[data-testid="analytics-section"]',
          position: 'left'
        }
      ];
      
    default:
      return [];
  }
}