import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "@/components/FeedbackForm";
import { HelpTicketForm } from "@/components/HelpTicketForm";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  MessageCircle,
  ThumbsUp,
  HeartHandshake,
  Star
} from "lucide-react";

interface Feedback {
  id: string;
  category: string;
  subject: string;
  message: string;
  rating?: number;
  moodRating?: number;
  priority: string;
  status: "pending" | "in_review" | "resolved" | "closed";
  adminResponse?: string;
  createdAt: string;
}

interface HelpTicket {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  priority: string;
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackHelp() {
  const { user, isLoading: authLoading } = useAuth();
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [helpFormOpen, setHelpFormOpen] = useState(false);

  const { data: feedback, isLoading: feedbackLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
    enabled: !!user,
  });

  const { data: helpTickets, isLoading: ticketsLoading } = useQuery<HelpTicket[]>({
    queryKey: ["/api/help-tickets"],
    enabled: !!user,
  });

  if (authLoading || feedbackLoading || ticketsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Please log in to access feedback and help features.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": case "open":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "in_review": case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "waiting_customer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "resolved": case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Feedback & Support
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Share your thoughts, report issues, or get help from our support team
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-6 translate-x-6"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Send Feedback
            </CardTitle>
            <CardDescription>
              Help us improve by sharing your thoughts, suggestions, or reporting bugs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setFeedbackFormOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Give Feedback
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-6 translate-x-6"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-green-600" />
              Get Help
            </CardTitle>
            <CardDescription>
              Need assistance? Submit a support ticket and we'll help you out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setHelpFormOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <HeartHandshake className="w-4 h-4 mr-2" />
              Request Help
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {feedback && feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Your Recent Feedback
            </CardTitle>
            <CardDescription>
              Track the status of your submitted feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.slice(0, 5).map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.subject}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatCategory(item.category)}</span>
                    <div className="flex items-center gap-4">
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{item.rating}/5</span>
                        </div>
                      )}
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {item.adminResponse && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Admin Response:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {item.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Help Tickets */}
      {helpTickets && helpTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-green-600" />
              Your Support Tickets
            </CardTitle>
            <CardDescription>
              Track the progress of your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {helpTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          #{ticket.ticketNumber}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCategory(ticket.category)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status === "waiting_customer" ? "awaiting response" : ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {ticket.status === "waiting_customer" && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Response Required</span>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Our support team is waiting for your response.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {(!feedback || feedback.length === 0) && (!helpTickets || helpTickets.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feedback or tickets yet
            </h3>
            <p className="text-muted-foreground mb-6">
              When you submit feedback or create support tickets, they'll appear here
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setFeedbackFormOpen(true)} variant="outline">
                Share Feedback
              </Button>
              <Button onClick={() => setHelpFormOpen(true)}>
                Get Help
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms */}
      <FeedbackForm
        isOpen={feedbackFormOpen}
        onClose={() => setFeedbackFormOpen(false)}
        userType={user.userType}
      />
      
      <HelpTicketForm
        isOpen={helpFormOpen}
        onClose={() => setHelpFormOpen(false)}
        userType={user.userType}
      />
    </div>
  );
}