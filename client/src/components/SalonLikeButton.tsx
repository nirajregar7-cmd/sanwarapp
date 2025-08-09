import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SalonLikeButtonProps {
  salonId: string;
  showCount?: boolean;
}

export default function SalonLikeButton({ salonId, showCount = true }: SalonLikeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Query to get like status
  const { data: likeStatus } = useQuery({
    queryKey: [`/api/salons/${salonId}/like-status`],
    enabled: !!salonId && !!isAuthenticated && user?.userType === 'customer',
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/like-status`);
      return await response.json();
    },
    retry: false,
  });

  // Update local state when like status is fetched
  useEffect(() => {
    if (likeStatus) {
      setIsLiked(likeStatus.isLiked || false);
      setLikesCount(likeStatus.likesCount || 0);
    }
  }, [likeStatus]);

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/salons/${salonId}/like`);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
      toast({
        title: data.isLiked ? "Salon Saved!" : "Salon Removed",
        description: data.message,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/like-status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to save salons to your favorites.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (user?.userType !== 'customer') {
      toast({
        title: "Customer Account Required",
        description: "Only customers can save salons.",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate();
  };

  if (!isAuthenticated || user?.userType !== 'customer') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={likeMutation.isPending}
      className="p-1 h-auto"
    >
      <div className="flex items-center text-red-500">
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        {showCount && (
          <span className="ml-1 text-gray-600 text-sm">
            {likesCount}
          </span>
        )}
      </div>
    </Button>
  );
}