import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, Gift } from "lucide-react";
import type { SalonOffer, Service } from "@shared/schema";

interface ServiceSpecificOffersProps {
  offers: SalonOffer[];
  services: Service[];
  showTitle?: boolean;
}

export function ServiceSpecificOffers({ offers, services, showTitle = true }: ServiceSpecificOffersProps) {
  if (!offers || offers.length === 0) return null;

  // Group offers by service to show individual service discounts
  const getServiceOffers = () => {
    const serviceOffers: { [serviceId: string]: { name: string; discounts: string[] } } = {};
    
    offers.forEach(offer => {
      if (!offer.isApplicableToAllServices && offer.applicableServices) {
        offer.applicableServices.forEach(serviceId => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            if (!serviceOffers[serviceId]) {
              serviceOffers[serviceId] = { name: service.name, discounts: [] };
            }
            const discount = offer.discountType === "percentage" 
              ? `${offer.discountValue}%` 
              : `₹${offer.discountValue}`;
            serviceOffers[serviceId].discounts.push(discount);
          }
        });
      }
    });
    
    return serviceOffers;
  };

  const serviceOffers = getServiceOffers();
  const hasServiceSpecificOffers = Object.keys(serviceOffers).length > 0;

  if (!hasServiceSpecificOffers && offers.every(offer => offer.isApplicableToAllServices)) {
    // Show all services offers
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Gift className="w-5 h-5" />
              Special Offers
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <div className="space-y-3">
            {offers.map(offer => (
              <div key={offer.id} className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">{offer.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">All Services</p>
                </div>
                <Badge className="bg-red-500 text-white">
                  {offer.discountType === "percentage" ? `${offer.discountValue}%` : `₹${offer.discountValue}`} OFF
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasServiceSpecificOffers) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Percent className="w-5 h-5" />
            Service Offers
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(serviceOffers).map(([serviceId, serviceOffer]) => (
            <div 
              key={serviceId}
              className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white/80 transition-colors"
            >
              <div>
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {serviceOffer.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Limited time offer
                </p>
              </div>
              <div className="flex gap-1">
                {serviceOffer.discounts.map((discount, index) => (
                  <Badge 
                    key={index}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xs"
                  >
                    {discount} OFF
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary text showing format like "Haircut 10%, Haircolor 15%, Beard 5%" */}
        <div className="mt-4 p-3 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg">
          <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
            Current Active Offers:
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {Object.entries(serviceOffers)
              .map(([_, serviceOffer]) => 
                `${serviceOffer.name} ${serviceOffer.discounts.join("/")}`
              )
              .join(", ")
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}