import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin, Percent, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Salon, SalonOffer } from "@shared/schema";

interface SalonCardProps {
  salon: Salon & { distance?: number; primaryImageUrl?: string | null };
}

export default function SalonCard({ salon }: SalonCardProps) {
  // Fetch salon offers
  const { data: offers = [], isLoading, error } = useQuery<SalonOffer[]>({
    queryKey: [`/api/salons/${salon.id}/offers`],
    enabled: !!salon.id,
  });

  // Fetch salon staff to determine availability
  const { data: staff = [] } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon.id}/staff`],
    enabled: !!salon.id,
  });

  // Fetch salon working hours
  const { data: workingHours = [] } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon.id}/working-hours`],
    enabled: !!salon.id,
  });

  const getSalonStatus = () => {
    // Get current time in IST (Indian Standard Time)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentDay = istTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = istTime.getHours() * 60 + istTime.getMinutes(); // minutes since midnight
    
    // If no working hours data available, fall back to basic logic
    if (!workingHours || workingHours.length === 0) {
      const isBusinessHours = currentTime >= 9 * 60 && currentTime < 21 * 60; // 9 AM to 9 PM
      const hasStaff = staff && staff.length > 0;
      const isOpen = isBusinessHours;
      const hasAvailability = hasStaff && isOpen;
      
      return {
        status: isOpen ? "Open now" : "Closed now",
        isOpen,
        hasAvailability
      };
    }
    
    // Find working hours for current day
    const todayWorkingHours = workingHours.find((wh: any) => wh.dayOfWeek === currentDay);
    
    if (!todayWorkingHours || !todayWorkingHours.isOpen) {
      return { status: "Closed today", isOpen: false, hasAvailability: false };
    }
    
    // Check if current time is within working hours
    let isWithinHours = false;
    
    if (todayWorkingHours.openTime && todayWorkingHours.closeTime) {
      const openTime = parseTimeToMinutes(todayWorkingHours.openTime);
      const closeTime = parseTimeToMinutes(todayWorkingHours.closeTime);
      
      isWithinHours = currentTime >= openTime && currentTime <= closeTime;
      
      // Check if currently in break time
      if (isWithinHours && todayWorkingHours.breakStartTime && todayWorkingHours.breakEndTime) {
        const breakStart = parseTimeToMinutes(todayWorkingHours.breakStartTime);
        const breakEnd = parseTimeToMinutes(todayWorkingHours.breakEndTime);
        if (currentTime >= breakStart && currentTime <= breakEnd) {
          isWithinHours = false; // Currently on break
        }
      }
    }
    
    const hasStaff = staff && staff.length > 0;
    const hasAvailability = hasStaff && isWithinHours;
    
    return {
      status: isWithinHours ? "Open now" : "Closed now",
      isOpen: isWithinHours,
      hasAvailability
    };
  };
  
  // Helper function to parse time string (HH:MM) to minutes since midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const { status, isOpen, hasAvailability } = getSalonStatus();

  const getStatusColor = () => {
    if (isOpen && hasAvailability) {
      return "text-green-600";
    } else if (isOpen) {
      return "text-orange-600";
    } else {
      return "text-red-600";
    }
  };

  const getAvailabilityBadgeColor = () => {
    if (hasAvailability) {
      return "bg-green-500 text-white";
    } else {
      return "bg-red-500 text-white";
    }
  };

  // Format confirmation amount from paise to rupees
  const formatConfirmationFee = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toFixed(0)}`;
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
    <Link href={`/salon/${salon.id}`} data-testid={`link-salon-card-${salon.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-[1.02] hover:ring-2 hover:ring-primary/20 h-full flex flex-col">
        <div className="relative">
          <img 
            src={salon.primaryImageUrl || salon.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"} 
            alt={salon.name} 
            className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
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
        
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">{salon.name}</h3>
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-gray-600">
                {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-2 line-clamp-1 text-sm">
            <MapPin className="h-4 w-4 inline mr-1" />
            {salon.address}
          </p>
          
          {salon.distance && (
            <p className="text-sm text-blue-600 font-medium mb-3">
              {salon.distance < 1 ? `${(salon.distance * 1000).toFixed(0)}m away` : `${salon.distance.toFixed(1)}km away`}
            </p>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <span className={`text-sm font-medium ${getStatusColor()}`}>{status}</span>
            </div>
            {hasAvailability && (
              <Badge className={getAvailabilityBadgeColor()}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Available now
              </Badge>
            )}
          </div>
          
          {/* Queue Wait Time Display with Urgency */}
          {salon.queueWaitTime && (
            <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-lg relative overflow-hidden">
              {/* Pulsing background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-amber-100 animate-pulse opacity-50"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center text-orange-700">
                  <Clock className="h-4 w-4 mr-2 animate-pulse" />
                  <span className="text-sm font-bold">
                    Next slot in ~{salon.queueWaitTime} min
                  </span>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-200 px-2 py-1 rounded-full animate-pulse">
                  BOOK NOW
                </span>
              </div>
            </div>
          )}

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
          
          {/* Offer section with consistent height */}
          <div className="mb-3 h-16 flex items-center">
            {bestOffer ? (
              <div className="w-full p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <Percent className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{bestOffer.title}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Save {getOfferText(bestOffer)} on services
                </p>
              </div>
            ) : (
              <div className="w-full h-full"></div>
            )}
          </div>
          
          <div className="mt-auto">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 group-hover:bg-primary/80 group-hover:scale-105 transition-all duration-200 group-hover:shadow-lg"
              data-testid={`button-book-salon-${salon.id}`}
            >
              {bestOffer ? `Book with ${getOfferText(bestOffer)}` : "View Details & Book"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
