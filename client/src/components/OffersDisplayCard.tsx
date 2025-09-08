import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, IndianRupee, Percent, Tag } from "lucide-react";

interface Offer {
  id: string;
  salonId: string;
  salonName: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  validFrom: string;
  validUntil: string;
  maxUsagePerCustomer: number;
  currentUsageCount: number;
  maxTotalUsage?: number;
  promoCode?: string;
  isPromoCodeRequired: boolean;
  priority: number;
  customerUsageCount: number;
  canUse: boolean;
}

interface OffersDisplayCardProps {
  offer: Offer;
  className?: string;
}

export default function OffersDisplayCard({ offer, className = "" }: OffersDisplayCardProps) {
  const formatDiscount = () => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}% off`;
    }
    return `₹${offer.discountValue} off`;
  };

  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const isExpired = new Date(offer.validUntil) < istNow;
  const isUpcoming = new Date(offer.validFrom) > istNow;

  const getStatusBadge = () => {
    if (isExpired) return <Badge variant="destructive">Expired</Badge>;
    if (isUpcoming) return <Badge variant="outline">Upcoming</Badge>;
    if (!offer.canUse) return <Badge variant="secondary">Used</Badge>;
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <Card className={`${className} ${!offer.canUse || isExpired ? 'opacity-75' : ''}`} data-testid={`card-offer-${offer.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold" data-testid={`text-offer-title-${offer.id}`}>
              {offer.title}
            </CardTitle>
            <CardDescription className="text-primary font-medium text-base" data-testid={`text-offer-discount-${offer.id}`}>
              {formatDiscount()}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground mt-2" data-testid={`text-offer-description-${offer.id}`}>
          {offer.description}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-offer-validity-${offer.id}`}>
              Valid till {new Date(offer.validUntil).toLocaleDateString()}
            </span>
          </div>

          {offer.minOrderAmount && parseFloat(offer.minOrderAmount) > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="w-4 h-4" />
              <span data-testid={`text-offer-min-amount-${offer.id}`}>
                Min order: ₹{offer.minOrderAmount}
              </span>
            </div>
          )}

          {offer.discountType === "percentage" && offer.maxDiscountAmount && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="w-4 h-4" />
              <span data-testid={`text-offer-max-discount-${offer.id}`}>
                Max discount: ₹{offer.maxDiscountAmount}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span data-testid={`text-offer-usage-${offer.id}`}>
              Used {offer.customerUsageCount} of {offer.maxUsagePerCustomer} times
            </span>
          </div>

          {offer.promoCode && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4" />
              <span className="font-medium">Code: </span>
              <Badge variant="outline" className="font-mono" data-testid={`badge-promo-code-${offer.id}`}>
                {offer.promoCode}
              </Badge>
            </div>
          )}

          <div className="text-xs text-muted-foreground" data-testid={`text-offer-salon-${offer.id}`}>
            Available at: {offer.salonName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}