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
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { HelpCircle, Settings, CreditCard, Calendar, Info, Users } from "lucide-react";

const helpTicketSchema = z.object({
  category: z.enum(["technical_issue", "account_problem", "payment_issue", "booking_problem", "feature_inquiry", "general_support"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type HelpTicketFormData = z.infer<typeof helpTicketSchema>;

const categoryIcons = {
  technical_issue: Settings,
  account_problem: Users,
  payment_issue: CreditCard,
  booking_problem: Calendar,
  feature_inquiry: Info,
  general_support: HelpCircle,
};

const categoryLabels = {
  technical_issue: "Technical Issue",
  account_problem: "Account Problem",
  payment_issue: "Payment Issue",
  booking_problem: "Booking Problem", 
  feature_inquiry: "Feature Inquiry",
  general_support: "General Support",
};

interface HelpTicketFormProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "customer" | "salon_owner";
}

export function HelpTicketForm({ isOpen, onClose, userType }: HelpTicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<HelpTicketFormData>({
    resolver: zodResolver(helpTicketSchema),
    defaultValues: {
      priority: "medium",
    }
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: HelpTicketFormData) => {
      return apiRequest("POST", "/api/help-tickets", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Help Request Submitted",
        description: `Your ticket #${data.ticketNumber} has been created. We'll respond within 24 hours.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/help-tickets"] });
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit help request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HelpTicketFormData) => {
    submitTicketMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <HelpCircle className="w-6 h-6 text-green-600" />
            Get Help
          </DialogTitle>
          <DialogDescription>
            Need assistance? Submit a help request and our support team will assist you
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Issue Category *</Label>
            <Select
              onValueChange={(value) => setValue("category", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the type of issue" />
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
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Low - General questions
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Medium - Moderate issues
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    High - Urgent assistance needed
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Urgent - Critical issue
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              {...register("subject")}
              placeholder="Brief description of the issue"
              className="w-full"
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              {...register("description")}
              placeholder="Please provide as much detail as possible about the issue you're experiencing. Include any error messages, steps to reproduce the problem, or relevant information that might help us assist you better."
              rows={5}
              className="w-full resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* User Type Specific Help Text */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {userType === "customer" ? "Customer Support Tips:" : "Salon Owner Support Tips:"}
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {userType === "customer" ? (
                <>
                  <li>• For booking issues, include the booking ID or salon name</li>
                  <li>• For payment problems, mention the payment method used</li>
                  <li>• Screenshots can be very helpful for technical issues</li>
                </>
              ) : (
                <>
                  <li>• For salon setup issues, mention your salon name</li>
                  <li>• For payment/revenue questions, include relevant dates</li>
                  <li>• For feature requests, describe your business needs</li>
                </>
              )}
            </ul>
          </div>

          {/* Response Time Notice */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📞 <strong>Expected Response Time:</strong>
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-500 mt-1 space-y-1">
              <li>• Low/Medium: Within 24 hours</li>
              <li>• High: Within 12 hours</li>
              <li>• Urgent: Within 2 hours</li>
            </ul>
          </div>

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
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Help Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}