export const REVENUE_SHARE = {
  PLATFORM_PERCENTAGE: 20, // Platform gets 20%
  SALON_PERCENTAGE: 80,     // Salon owner gets 80%
} as const;

export function calculateRevenueShare(confirmationAmount: number) {
  const platformShare = (confirmationAmount * REVENUE_SHARE.PLATFORM_PERCENTAGE) / 100;
  const salonShare = (confirmationAmount * REVENUE_SHARE.SALON_PERCENTAGE) / 100;
  
  return {
    platformShare: Math.round(platformShare * 100) / 100, // Round to 2 decimal places
    salonShare: Math.round(salonShare * 100) / 100,
    total: confirmationAmount
  };
}

export type RevenueShare = ReturnType<typeof calculateRevenueShare>;