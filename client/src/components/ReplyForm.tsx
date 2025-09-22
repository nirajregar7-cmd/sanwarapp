import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Edit, Trash2, Send, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ReviewReply } from "@shared/schema";

interface ReplyFormProps {
  reviewId: string;
  existingReply?: ReviewReply;
  onReplySuccess: () => void;
}

export function ReplyForm({ reviewId, existingReply, onReplySuccess }: ReplyFormProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState(existingReply?.replyText || "");

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (data: { reviewId: string; replyText: string }) => {
      return apiRequest("POST", `/api/reviews/${data.reviewId}/replies`, { replyText: data.replyText });
    },
    onSuccess: () => {
      toast({ title: "Reply posted successfully!", variant: "default" });
      setReplyText("");
      setIsReplying(false);
      onReplySuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to post reply", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: async (data: { replyId: string; replyText: string }) => {
      return apiRequest("PUT", `/api/reviews/replies/${data.replyId}`, { replyText: data.replyText });
    },
    onSuccess: () => {
      toast({ title: "Reply updated successfully!", variant: "default" });
      setIsEditing(false);
      onReplySuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update reply", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      return apiRequest("DELETE", `/api/reviews/replies/${replyId}`);
    },
    onSuccess: () => {
      toast({ title: "Reply deleted successfully!", variant: "default" });
      onReplySuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete reply", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast({ title: "Please enter a reply", variant: "destructive" });
      return;
    }

    if (isEditing && existingReply) {
      updateReplyMutation.mutate({ replyId: existingReply.id, replyText: replyText.trim() });
    } else {
      createReplyMutation.mutate({ reviewId, replyText: replyText.trim() });
    }
  };

  const handleDelete = () => {
    if (existingReply && window.confirm("Are you sure you want to delete this reply?")) {
      deleteReplyMutation.mutate(existingReply.id);
    }
  };

  const isSubmitting = createReplyMutation.isPending || updateReplyMutation.isPending;

  // If there's an existing reply and we're not editing, show manage options
  if (existingReply && !isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsEditing(true);
            setReplyText(existingReply.replyText);
          }}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid={`button-edit-reply-${existingReply.id}`}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit Reply
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleteReplyMutation.isPending}
          className="text-red-600 border-red-200 hover:bg-red-50"
          data-testid={`button-delete-reply-${existingReply.id}`}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {deleteReplyMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    );
  }

  // If we're replying or editing, show the form
  if (isReplying || isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply to this review..."
          className="min-h-[100px] resize-none border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          disabled={isSubmitting}
          data-testid={`textarea-reply-${reviewId}`}
        />
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !replyText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid={`button-submit-reply-${reviewId}`}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? "Posting..." : isEditing ? "Update Reply" : "Post Reply"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsReplying(false);
              setIsEditing(false);
              setReplyText(existingReply?.replyText || "");
            }}
            disabled={isSubmitting}
            data-testid={`button-cancel-reply-${reviewId}`}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  // If no existing reply and not replying, show the reply button
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsReplying(true)}
      className="text-blue-600 border-blue-200 hover:bg-blue-50"
      data-testid={`button-start-reply-${reviewId}`}
    >
      <MessageSquare className="h-4 w-4 mr-1" />
      Reply to Review
    </Button>
  );
}