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
    
    // Debug logging for salon status calculation
    console.log(`[SALON DEBUG] ${salon.name} (${salon.id}):`);
    console.log(`[SALON DEBUG] Current IST time: ${istTime.toLocaleString()}`);
    console.log(`[SALON DEBUG] Current day: ${currentDay} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]})`);
    console.log(`[SALON DEBUG] Current time in minutes: ${currentTime} (${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2, '0')})`);
    console.log(`[SALON DEBUG] Working hours data:`, workingHours);
    console.log(`[SALON DEBUG] Staff data:`, staff);
    
    // If no working hours data available, fall back to basic logic
    if (!workingHours || workingHours.length === 0) {
      console.log(`[SALON DEBUG] No working hours data, using fallback logic`);
      const isBusinessHours = currentTime >= 9 * 60 && currentTime < 21 * 60; // 9 AM to 9 PM
      const hasStaff = staff && staff.length > 0;
      const isOpen = isBusinessHours;
      const hasAvailability = hasStaff && isOpen;
      
      console.log(`[SALON DEBUG] Fallback: isBusinessHours=${isBusinessHours}, hasStaff=${hasStaff}, isOpen=${isOpen}`);
      
      return {
        status: isOpen ? "Open now" : "Closed now",
        isOpen,
        hasAvailability
      };
    }
    
    // Find working hours for current day
    const todayWorkingHours = workingHours.find((wh: any) => wh.dayOfWeek === currentDay);
    console.log(`[SALON DEBUG] Today's working hours:`, todayWorkingHours);
    
    if (!todayWorkingHours || !todayWorkingHours.isOpen) {
      console.log(`[SALON DEBUG] No working hours for today or closed: todayWorkingHours=${!!todayWorkingHours}, isOpen=${todayWorkingHours?.isOpen}`);
      return { status: "Closed today", isOpen: false, hasAvailability: false };
    }
    
    // Check if current time is within working hours
    let isWithinHours = false;
    
    if (todayWorkingHours.openTime && todayWorkingHours.closeTime) {
      const openTime = parseTimeToMinutes(todayWorkingHours.openTime);
      const closeTime = parseTimeToMinutes(todayWorkingHours.closeTime);
      
      console.log(`[SALON DEBUG] Open time: ${todayWorkingHours.openTime} (${openTime} minutes)`);
      console.log(`[SALON DEBUG] Close time: ${todayWorkingHours.closeTime} (${closeTime} minutes)`);
      
      isWithinHours = currentTime >= openTime && currentTime <= closeTime;
      console.log(`[SALON DEBUG] Is within hours: ${isWithinHours} (${currentTime} >= ${openTime} && ${currentTime} <= ${closeTime})`);
      
      // Check if currently in break time
      if (isWithinHours && todayWorkingHours.breakStartTime && todayWorkingHours.breakEndTime) {
        const breakStart = parseTimeToMinutes(todayWorkingHours.breakStartTime);
        const breakEnd = parseTimeToMinutes(todayWorkingHours.breakEndTime);
        console.log(`[SALON DEBUG] Break time: ${todayWorkingHours.breakStartTime} - ${todayWorkingHours.breakEndTime}`);
        if (currentTime >= breakStart && currentTime <= breakEnd) {
          isWithinHours = false; // Currently on break
          console.log(`[SALON DEBUG] Currently on break, setting isWithinHours to false`);
        }
      }
    } else {
      console.log(`[SALON DEBUG] Missing open/close times: openTime=${todayWorkingHours.openTime}, closeTime=${todayWorkingHours.closeTime}`);
    }
    
    const hasStaff = staff && staff.length > 0;
    const hasAvailability = hasStaff && isWithinHours;
    
    console.log(`[SALON DEBUG] Final result: isWithinHours=${isWithinHours}, hasStaff=${hasStaff}, hasAvailability=${hasAvailability}`);
    
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
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img 
          src={salon.primaryImageUrl || salon.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"} 
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

        {/* Confirmation Fee Display */}
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Confirmation Fee:</span>
          <span className="text-sm font-bold text-blue-700">
            {formatConfirmationFee(salon.confirmationAmount || 300)}
          </span>
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
