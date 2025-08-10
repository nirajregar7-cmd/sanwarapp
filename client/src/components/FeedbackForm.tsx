import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MoodRatingSelector } from "@/components/MoodRatingSelector";
import { MoodRating } from "@shared/schema";
import { Star, MessageSquare, Bug, Lightbulb, AlertCircle, HelpCircle, Heart } from "lucide-react";

const feedbackSchema = z.object({
  category: z.enum(["bug_report", "feature_request", "general_feedback", "complaint", "suggestion", "help_request"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  rating: z.number().min(1).max(5).optional(),
  moodRating: z.number().min(1).max(5).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const categoryIcons = {
  bug_report: Bug,
  feature_request: Lightbulb,
  general_feedback: MessageSquare,
  complaint: AlertCircle,
  suggestion: Heart,
  help_request: HelpCircle,
};

const categoryLabels = {
  bug_report: "Bug Report",
  feature_request: "Feature Request", 
  general_feedback: "General Feedback",
  complaint: "Complaint",
  suggestion: "Suggestion",
  help_request: "Help Request",
};

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "customer" | "salon_owner";
}

export function FeedbackForm({ isOpen, onClose, userType }: FeedbackFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [starRating, setStarRating] = useState<number>(0);
  const [moodRating, setMoodRating] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<MoodRating | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      priority: "medium",
    }
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      return apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it and get back to you.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      reset();
      setStarRating(0);
      setMoodRating(0);
      setSelectedMood(undefined);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    const finalData = {
      ...data,
      rating: starRating || undefined,
      moodRating: moodRating || undefined,
    };
    submitFeedbackMutation.mutate(finalData);
  };

  const category = watch("category");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Send Feedback
          </DialogTitle>
          <p className="text-muted-foreground">
            Help us improve Sanwar by sharing your thoughts and suggestions
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              onValueChange={(value) => setValue("category", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feedback category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => {
                  const IconComponent = categoryIcons[value as keyof typeof categoryIcons];
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              defaultValue="medium"
              onValueChange={(value) => setValue("priority", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              {...register("subject")}
              placeholder="Brief summary of your feedback"
              className="w-full"
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Details *</Label>
            <Textarea
              {...register("message")}
              placeholder="Please provide detailed feedback..."
              rows={4}
              className="w-full resize-none"
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          {/* Optional Rating Section */}
          {category && ["general_feedback", "complaint", "suggestion"].includes(category) && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How would you rate your experience? (Optional)
              </Label>
              
              {/* Star Rating */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Star Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= starRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 hover:text-yellow-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Rating */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Mood Rating</Label>
                <MoodRatingSelector
                  selectedMood={selectedMood}
                  onMoodSelect={(mood, rating) => {
                    setSelectedMood(mood);
                    setMoodRating(rating);
                  }}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}