import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MoodRatingSelector } from "@/components/MoodRatingSelector";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Camera, X } from "lucide-react";
import type { MoodRating } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  moodRating: z.string().optional() as z.ZodOptional<z.ZodType<MoodRating>>,
  comment: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  salonId: string;
  bookingId?: string;
  onSubmitSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ReviewForm({ salonId, bookingId, onSubmitSuccess, trigger }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      moodRating: "very_happy",
      comment: "",
      photos: [],
    },
  });

  // Handle photo upload completion
  const handlePhotoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const newPhotos = (result.successful || []).map((file) => {
      // Get the uploaded file URL - could be from uploadURL or response
      let photoUrl = file.uploadURL || file.response?.uploadURL || file.response?.body || '';
      
      // If it's a full Google Cloud Storage URL, keep it as is for now
      // The server will normalize it when saving the review
      return photoUrl;
    }).filter(Boolean) as string[];
    
    if (newPhotos.length > 0) {
      const updatedPhotos = [...uploadedPhotos, ...newPhotos];
      setUploadedPhotos(updatedPhotos);
      form.setValue('photos', updatedPhotos);
      
      toast({
        title: "Photos uploaded successfully",
        description: `${newPhotos.length} photo(s) added to your review.`,
      });
    }
  };

  // Handle photo removal
  const removePhoto = (photoUrl: string) => {
    const updatedPhotos = uploadedPhotos.filter(url => url !== photoUrl);
    setUploadedPhotos(updatedPhotos);
    form.setValue('photos', updatedPhotos);
  };

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", {
        ...data,
        photos: uploadedPhotos,
        salonId,
        bookingId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for sharing your experience!",
      });
      
      // Refresh salon data and reviews
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/reviews`] });
      
      setIsOpen(false);
      form.reset();
      setUploadedPhotos([]);
      onSubmitSuccess?.();
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };

  const handleMoodSelect = (mood: MoodRating, rating: number) => {
    form.setValue("moodRating", mood);
    form.setValue("rating", rating);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Star className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Share Your Experience
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mood Rating Selector */}
            <FormField
              control={form.control}
              name="moodRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How was your experience?</FormLabel>
                  <FormControl>
                    <div className="py-4">
                      <MoodRatingSelector
                        selectedMood={field.value}
                        onMoodSelect={handleMoodSelect}
                        size="md"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Traditional Star Rating Display */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Rating:</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < form.watch("rating")
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{form.watch("rating")}/5</span>
            </div>

            {/* Comment Field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share more details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about your experience..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload Section */}
            <FormItem>
              <FormLabel>Add Photos (optional)</FormLabel>
              <div className="space-y-3">
                <ObjectUploader
                  maxNumberOfFiles={3}
                  maxFileSize={5485760} // 5MB
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("POST", "/api/objects/upload");
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={handlePhotoUploadComplete}
                  buttonClassName="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </ObjectUploader>
                
                {/* Display uploaded photos */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {uploadedPhotos.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photoUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormItem>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={reviewMutation.isPending}
                className="flex-1"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}