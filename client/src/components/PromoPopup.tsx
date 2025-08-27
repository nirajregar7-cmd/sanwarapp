import { useState, useEffect } from "react";
import { X, Star, Users, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface PromoPopupProps {
  onClose?: () => void;
}

export function PromoPopup({ onClose }: PromoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem('sanwar_promo_shown');
    
    if (!popupShown && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('sanwar_promo_shown', 'true');
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const ShopkeeperOffer = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
          <Star className="h-8 w-8 text-white" />
        </div>
      </div>
      
      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        ✨ Join Sanwar – Grow Your Salon Business 🚀 ✨
      </DialogTitle>
      
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <Gift className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800">🆓 Free to Join – No subscription, no setup cost</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-800">💇 Keep 100% of your service fee</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <Star className="h-5 w-5 text-orange-600" />
          <span className="font-semibold text-orange-800">💰 Set your own Confirmation Fee (₹0–30) – Your salon, your rules!</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-800">⭐ Get 7 Days Free Featured Listing + Verified Badge</span>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <Gift className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-indigo-800">📲 Free SMS/WhatsApp credits to connect with customers</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg text-white text-center">
        <p className="font-bold text-lg">👉 More Customers. More Control. More Profit.</p>
        <p className="text-sm opacity-90">Start today with Sanwar!</p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
          onClick={() => window.open('/auth/register?type=owner', '_blank')}
          data-testid="button-join-shopkeeper"
        >
          Join as Salon Owner
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClose}
          data-testid="button-close-promo"
        >
          Maybe Later
        </Button>
      </div>
    </div>
  );

  const CustomerOffer = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-full">
          <Gift className="h-8 w-8 text-white" />
        </div>
      </div>
      
      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
        🎉 Sanwar Special Customer Offer 🎉
      </DialogTitle>
      
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-green-600" />
            <span className="font-bold text-green-800 text-lg">👥 Invite 5 friends → Your first booking is FREE</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-6 w-6 text-orange-600" />
            <span className="font-bold text-orange-800 text-lg">🏪 Add 1 Salon (Shopkeeper) → Earn ₹99 reward instantly</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-purple-800 text-lg">✨ More Referrals = More Rewards ✨</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-lg text-white text-center">
        <p className="font-bold text-lg">👉 Book smarter. Save bigger. Only with SanwarHub 🚀</p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
          onClick={() => {
            if (isAuthenticated) {
              window.location.href = '/customer/dashboard';
            } else {
              window.location.href = '/auth/register?type=customer';
            }
          }}
          data-testid="button-claim-customer-offer"
        >
          {isAuthenticated ? 'Claim Offers' : 'Join & Claim Offers'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClose}
          data-testid="button-close-promo"
        >
          Maybe Later
        </Button>
      </div>
    </div>
  );

  const CombinedOffer = () => (
    <div className="text-center space-y-6">
      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
        🔥 Sanwar Special Offers 🔥
      </DialogTitle>
      
      {/* Shopkeeper Offer - Top Priority */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
            <Star className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-purple-800 mb-3">
          ✨ For Salon Owners - Join Sanwar Today! ✨
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 justify-center">
            <Gift className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-800">🆓 Free to Join – No subscription, no setup cost</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-800">💇 Keep 100% of your service fee</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Star className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-orange-800">💰 Set your own Confirmation Fee (₹0–30)</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-purple-800">⭐ Get 7 Days Free Featured Listing</span>
          </div>
        </div>
        
        <div className="mt-3 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg text-white">
          <p className="font-bold">👉 More Customers. More Control. More Profit.</p>
        </div>
        
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
          onClick={() => window.location.href = '/auth'}
          data-testid="button-join-shopkeeper"
        >
          Join as Salon Owner
        </Button>
      </div>

      {/* Customer Offer - Secondary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border-2 border-green-200">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 rounded-full">
            <Gift className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-green-800 mb-3">
          🎉 For Customers - Special Rewards! 🎉
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 justify-center">
            <Users className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-800">👥 Invite 5 friends → Your first booking is FREE</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Star className="h-4 w-4 text-orange-600" />
            <span className="font-bold text-orange-800">🏪 Add 1 Salon → Earn ₹99 reward instantly</span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="font-bold text-purple-800">✨ More Referrals = More Rewards</span>
          </div>
        </div>
        
        <div className="mt-3 bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg text-white">
          <p className="font-bold">👉 Book smarter. Save bigger. Only with SanwarHub 🚀</p>
        </div>
        
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
          onClick={() => {
            if (isAuthenticated) {
              window.location.href = '/customer/home';
            } else {
              window.location.href = '/auth';
            }
          }}
          data-testid="button-claim-customer-offer"
        >
          {isAuthenticated ? 'Claim Customer Offers' : 'Join & Claim Offers'}
        </Button>
      </div>
      
      <Button 
        variant="outline" 
        onClick={handleClose}
        className="w-full"
        data-testid="button-close-promo"
      >
        Maybe Later
      </Button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={handleClose}
            data-testid="button-close-promo-x"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <CombinedOffer />
      </DialogContent>
    </Dialog>
  );
}