import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Salon, SalonOffer } from "@shared/schema";

interface SalonCardProps {
  salon: Salon & { distance?: number };
}

export default function SalonCard({ salon }: SalonCardProps) {
  // Fetch salon offers
  const { data: offers = [], isLoading, error } = useQuery<SalonOffer[]>({
    queryKey: [`/api/salons/${salon.id}/offers`],
    enabled: !!salon.id,
  });

  const getAvailabilityStatus = () => {
    // In a real app, you'd check actual availability
    const isOpen = true; // Simplified for now
    return isOpen ? "Available Now" : "Busy";
  };

  const getAvailabilityColor = () => {
    const status = getAvailabilityStatus();
    return status === "Available Now" ? "bg-accent text-white" : "bg-orange-500 text-white";
  };

  // Get the best offer to display
  const bestOffer = offers.find(offer => offer.isActive && offer.isVisible);
  const getOfferText = (offer: SalonOffer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `₹${offer.discountValue} OFF`;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img 
          src={salon.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"} 
          alt={salon.name} 
          className="w-full h-48 object-cover"
        />
        {bestOffer && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-500 text-white font-semibold px-3 py-1">
              <Percent className="h-3 w-3 mr-1" />
              {getOfferText(bestOffer)}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{salon.name}</h3>
          <div className="flex items-center text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="ml-1 text-gray-600">
              {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-3 line-clamp-2">
          <MapPin className="h-4 w-4 inline mr-1" />
          {salon.address}
          {salon.distance && (
            <span className="ml-2 text-sm text-blue-600 font-medium">
              {salon.distance < 1 ? `${(salon.distance * 1000).toFixed(0)}m` : `${salon.distance.toFixed(1)}km`} away
            </span>
          )}
        </p>
        
        <div className="flex items-center mb-4">
          <Clock className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">Open now</span>
          <Badge className={`ml-auto ${getAvailabilityColor()}`}>
            {getAvailabilityStatus()}
          </Badge>
        </div>
        
        {/* Services Preview - would need to fetch services for each salon */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Haircut
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Styling
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Color
          </span>
        </div>
        
        {bestOffer && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <Percent className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{bestOffer.title}</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Save {getOfferText(bestOffer)} on services
            </p>
          </div>
        )}
        
        <Link href={`/salon/${salon.id}`}>
          <Button className="w-full bg-primary hover:bg-primary/90">
            {bestOffer ? `Book with ${getOfferText(bestOffer)}` : "View Details & Book"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
