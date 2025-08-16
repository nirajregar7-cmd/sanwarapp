import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Calendar, Users, IndianRupee, ArrowLeft, Clock, Percent, Tag } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: string;
  duration: number;
  description?: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  validFrom: string;
  validUntil: string;
  maxUsagePerCustomer: number;
  maxTotalUsage?: number;
  currentUsageCount: number;
  isActive: boolean;
  isVisible: boolean;
  priority: number;
  promoCode?: string;
  isPromoCodeRequired: boolean;
  applicableServices?: string[];
  isApplicableToAllServices: boolean;
  createdAt: string;
}

interface Salon {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  imageUrl?: string;
}

export default function SalonOffersPage() {
  const { salonId } = useParams<{ salonId: string }>();

  // Fetch salon details
  const { data: salon } = useQuery<Salon>({
    queryKey: ["/api/salons", salonId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) throw new Error("Failed to fetch salon");
      return response.json();
    },
  });

  // Fetch salon offers
  const { data: offers = [], isLoading: isLoadingOffers } = useQuery<Offer[]>({
    queryKey: ["/api/salons", salonId, "offers"],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/offers`);
      if (!response.ok) throw new Error("Failed to fetch offers");
      return response.json();
    },
  });

  // Fetch salon services for service-specific offers
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/salons", salonId, "services"],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}% OFF`;
    } else {
      return `₹${offer.discountValue} OFF`;
    }
  };

  const getOfferStatus = (offer: Offer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);

    if (!offer.isActive) {
      return { label: "Inactive", variant: "secondary" as const };
    }

    if (now < validFrom) {
      return { label: "Upcoming", variant: "outline" as const };
    }

    if (now > validUntil) {
      return { label: "Expired", variant: "destructive" as const };
    }

    if (offer.maxTotalUsage && offer.currentUsageCount >= offer.maxTotalUsage) {
      return { label: "Fully Used", variant: "secondary" as const };
    }

    return { label: "Active", variant: "default" as const };
  };

  const getApplicableServices = (offer: Offer) => {
    if (offer.isApplicableToAllServices) {
      return "All Services";
    }

    if (!offer.applicableServices || offer.applicableServices.length === 0) {
      return "No specific services";
    }

    const applicableServiceNames = services
      .filter(service => offer.applicableServices?.includes(service.id))
      .map(service => service.name);

    if (applicableServiceNames.length === 0) {
      return "Services not found";
    }

    if (applicableServiceNames.length <= 3) {
      return applicableServiceNames.join(", ");
    }

    return `${applicableServiceNames.slice(0, 2).join(", ")} +${applicableServiceNames.length - 2} more`;
  };

  const activeOffers = offers.filter(offer => {
    const status = getOfferStatus(offer);
    return offer.isVisible && status.label === "Active";
  });

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/salon/${salonId}`}>
              <Button variant="ghost" size="sm" data-testid="button-back-to-salon">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Salon
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Special Offers at {salon.name}
              </h1>
              <p className="text-gray-600">Discover amazing deals and discounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingOffers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeOffers.length === 0 ? (
          <Card className="text-center py-12" data-testid="card-no-offers">
            <CardContent>
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No active offers</h3>
              <p className="text-muted-foreground mb-4">
                This salon doesn't have any active promotional offers at the moment.
              </p>
              <Link href={`/salon/${salonId}`}>
                <Button>
                  View Services & Book
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOffers.map((offer: Offer) => {
              const status = getOfferStatus(offer);
              const applicableServices = getApplicableServices(offer);
              
              return (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow" data-testid={`card-offer-${offer.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2" data-testid={`text-offer-title-${offer.id}`}>
                          {offer.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {formatDiscount(offer)}
                          </Badge>
                          <Badge variant={status.variant} data-testid={`badge-offer-status-${offer.id}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground" data-testid={`text-offer-desc-${offer.id}`}>
                      {offer.description}
                    </p>

                    {/* Applicable Services */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Applicable to:</span>
                      </div>
                      <p className="text-sm text-gray-600 pl-6" data-testid={`text-applicable-services-${offer.id}`}>
                        {applicableServices}
                      </p>
                    </div>

                    {/* Validity Period */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span data-testid={`text-offer-validity-${offer.id}`}>
                        Valid till {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Usage Information */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span data-testid={`text-offer-usage-${offer.id}`}>
                        Used {offer.currentUsageCount} times
                        {offer.maxTotalUsage && ` of ${offer.maxTotalUsage}`}
                      </span>
                    </div>

                    {/* Minimum Order Amount */}
                    {offer.minOrderAmount && parseFloat(offer.minOrderAmount) > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="w-4 h-4 text-orange-600" />
                        <span data-testid={`text-offer-min-amount-${offer.id}`}>
                          Min order: ₹{offer.minOrderAmount}
                        </span>
                      </div>
                    )}

                    {/* Maximum Discount */}
                    {offer.discountType === "percentage" && offer.maxDiscountAmount && (
                      <div className="flex items-center gap-2 text-sm">
                        <Percent className="w-4 h-4 text-red-600" />
                        <span data-testid={`text-offer-max-discount-${offer.id}`}>
                          Max discount: ₹{offer.maxDiscountAmount}
                        </span>
                      </div>
                    )}

                    {/* Promo Code */}
                    {offer.promoCode && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Promo Code:</div>
                        <Badge variant="outline" className="font-mono text-sm" data-testid={`badge-promo-code-${offer.id}`}>
                          {offer.promoCode}
                        </Badge>
                        {offer.isPromoCodeRequired && (
                          <p className="text-xs text-amber-600">
                            ⚠️ Promo code required to avail this offer
                          </p>
                        )}
                      </div>
                    )}

                    {/* Usage Limit */}
                    <div className="text-xs text-gray-500">
                      Can be used {offer.maxUsagePerCustomer} time(s) per customer
                    </div>

                    {/* Book Now Button */}
                    <Link href={`/salon/${salonId}`}>
                      <Button className="w-full mt-4" data-testid={`button-book-with-offer-${offer.id}`}>
                        Book Now with This Offer
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        {activeOffers.length > 0 && (
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <Gift className="w-8 h-8 mx-auto text-primary mb-4" />
                <h3 className="font-semibold mb-2">Ready to Save?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your appointment now and enjoy these amazing offers!
                </p>
                <Link href={`/salon/${salonId}`}>
                  <Button size="lg" className="w-full">
                    View All Services & Book
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}