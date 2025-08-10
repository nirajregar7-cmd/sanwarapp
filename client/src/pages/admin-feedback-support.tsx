import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Star, Clock, User, Building, AlertTriangle, CheckCircle, X } from "lucide-react";

interface Feedback {
  id: string;
  userId: string;
  userType: 'customer' | 'salon_owner';
  salonId?: string;
  rating: number;
  moodRating: 'very_disappointed' | 'disappointed' | 'neutral' | 'satisfied' | 'absolutely_amazing';
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  salon?: {
    name: string;
  };
}

interface HelpTicket {
  id: string;
  userId: string;
  userType: 'customer' | 'salon_owner';
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'salon_owner' | 'admin';
  message: string;
  createdAt: string;
  sender?: {
    name: string;
    email: string;
  };
}

const moodEmojis = {
  very_disappointed: '😞',
  disappointed: '😕',
  neutral: '😐',
  satisfied: '😊',
  absolutely_amazing: '😍'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800'
};

export default function AdminFeedbackSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const { toast } = useToast();

  // Fetch all feedback
  const { data: feedbackList = [], isLoading: loadingFeedback } = useQuery<Feedback[]>({
    queryKey: ['/api/admin/feedback'],
    enabled: true,
  });

  // Fetch all help tickets
  const { data: helpTickets = [], isLoading: loadingTickets } = useQuery<HelpTicket[]>({
    queryKey: ['/api/admin/help-tickets'],
    enabled: true,
  });

  // Fetch ticket messages
  const { data: ticketMessages = [], isLoading: loadingMessages } = useQuery<TicketMessage[]>({
    queryKey: ['/api/admin/help-tickets', selectedTicket?.id, 'messages'],
    enabled: !!selectedTicket,
  });

  // Update feedback status
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: string; response?: string }) => {
      return apiRequest('PUT', `/api/admin/feedback/${id}`, { status, response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      toast({ title: "Feedback updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update help ticket status
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      return apiRequest('PUT', `/api/admin/help-tickets/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/help-tickets'] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send response to help ticket
  const sendResponseMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      return apiRequest('POST', `/api/admin/help-tickets/${ticketId}/messages`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/help-tickets', selectedTicket?.id, 'messages'] });
      setResponseMessage('');
      toast({ title: "Response sent successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFeedbackAction = (feedback: Feedback, action: 'resolve' | 'in_progress') => {
    updateFeedbackMutation.mutate({
      id: feedback.id,
      status: action === 'resolve' ? 'resolved' : 'in_progress',
    });
  };

  const handleTicketAction = (ticket: HelpTicket, action: 'assign' | 'resolve' | 'in_progress') => {
    updateTicketMutation.mutate({
      id: ticket.id,
      status: action === 'resolve' ? 'resolved' : action === 'assign' ? 'in_progress' : 'in_progress',
      adminNotes: action === 'assign' ? 'Assigned to admin for review' : undefined,
    });
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    
    sendResponseMutation.mutate({
      ticketId: selectedTicket.id,
      message: responseMessage.trim(),
    });
  };

  if (loadingFeedback || loadingTickets) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const openFeedback = feedbackList.filter((f: Feedback) => f.status === 'open');
  const openTickets = helpTickets.filter((t: HelpTicket) => t.status === 'open');
  const urgentTickets = helpTickets.filter((t: HelpTicket) => t.priority === 'urgent');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customer Support Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage feedback and help tickets from customers and salon owners</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Feedback</p>
                  <p className="text-2xl font-bold">{openFeedback.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold">{openTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent Tickets</p>
                  <p className="text-2xl font-bold">{urgentTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold">{feedbackList.length + helpTickets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
            <TabsTrigger value="tickets">Help Tickets</TabsTrigger>
          </TabsList>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Customer & Salon Owner Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackList.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No feedback submissions yet</p>
                    </div>
                  ) : (
                    feedbackList.map((feedback: Feedback) => (
                      <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={feedback.userType === 'customer' ? 'default' : 'secondary'}>
                                {feedback.userType === 'customer' ? (
                                  <><User className="w-3 h-3 mr-1" /> Customer</>
                                ) : (
                                  <><Building className="w-3 h-3 mr-1" /> Salon Owner</>
                                )}
                              </Badge>
                              <Badge className={statusColors[feedback.status as keyof typeof statusColors]}>
                                {feedback.status}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {feedback.user?.name || 'Anonymous'}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">{feedback.subject}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < feedback.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-lg">
                                {moodEmojis[feedback.moodRating as keyof typeof moodEmojis]}
                              </span>
                              <Badge variant="outline">{feedback.category}</Badge>
                            </div>
                            <p className="text-gray-700 mt-2">{feedback.message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Submitted: {new Date(feedback.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="ml-4 space-y-2">
                            {feedback.status === 'open' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFeedbackAction(feedback, 'in_progress')}
                                  disabled={updateFeedbackMutation.isPending}
                                >
                                  Mark In Progress
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleFeedbackAction(feedback, 'resolve')}
                                  disabled={updateFeedbackMutation.isPending}
                                >
                                  Mark Resolved
                                </Button>
                              </>
                            )}
                            {feedback.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => handleFeedbackAction(feedback, 'resolve')}
                                disabled={updateFeedbackMutation.isPending}
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Help Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {helpTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No help tickets yet</p>
                    </div>
                  ) : (
                    helpTickets.map((ticket: HelpTicket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={ticket.userType === 'customer' ? 'default' : 'secondary'}>
                                {ticket.userType === 'customer' ? (
                                  <><User className="w-3 h-3 mr-1" /> Customer</>
                                ) : (
                                  <><Building className="w-3 h-3 mr-1" /> Salon Owner</>
                                )}
                              </Badge>
                              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                                {ticket.status}
                              </Badge>
                              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                {ticket.priority}
                              </Badge>
                              <span className="text-sm text-gray-500 font-mono">
                                {ticket.ticketNumber}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600 mb-1">
                              Category: {ticket.category} | User: {ticket.user?.name || 'Anonymous'}
                            </p>
                            <p className="text-gray-700 mt-2">{ticket.description}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Created: {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="ml-4 space-y-2 flex flex-col">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>
                                    Ticket: {ticket.ticketNumber} - {ticket.subject}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Ticket Details */}
                                  <div className="md:col-span-2">
                                    <ScrollArea className="h-96">
                                      <div className="space-y-4">
                                        <div className="p-3 bg-gray-50 rounded">
                                          <p className="font-semibold">Original Request:</p>
                                          <p className="text-gray-700 mt-1">{ticket.description}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        {/* Messages */}
                                        <div className="space-y-3">
                                          <h4 className="font-semibold">Conversation:</h4>
                                          {loadingMessages ? (
                                            <div className="animate-pulse space-y-2">
                                              {[1, 2].map((i) => (
                                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                              ))}
                                            </div>
                                          ) : (
                                            ticketMessages.map((message: TicketMessage) => (
                                              <div
                                                key={message.id}
                                                className={`p-3 rounded-lg ${
                                                  message.senderType === 'admin'
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'
                                                } border`}
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-semibold text-sm">
                                                    {message.senderType === 'admin'
                                                      ? 'Admin'
                                                      : message.sender?.name || 'User'}
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {new Date(message.createdAt).toLocaleString()}
                                                  </span>
                                                </div>
                                                <p className="text-gray-700">{message.message}</p>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    </ScrollArea>
                                  </div>
                                  
                                  {/* Response Panel */}
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Send Response:</label>
                                      <Textarea
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        placeholder="Type your response here..."
                                        rows={4}
                                      />
                                      <Button
                                        onClick={handleSendResponse}
                                        disabled={!responseMessage.trim() || sendResponseMutation.isPending}
                                        className="w-full mt-2"
                                      >
                                        Send Response
                                      </Button>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Ticket Actions:</p>
                                      {ticket.status === 'open' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleTicketAction(ticket, 'assign')}
                                            disabled={updateTicketMutation.isPending}
                                            className="w-full"
                                          >
                                            Assign to Me
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleTicketAction(ticket, 'resolve')}
                                            disabled={updateTicketMutation.isPending}
                                            className="w-full"
                                          >
                                            Mark Resolved
                                          </Button>
                                        </>
                                      )}
                                      {ticket.status === 'in_progress' && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleTicketAction(ticket, 'resolve')}
                                          disabled={updateTicketMutation.isPending}
                                          className="w-full"
                                        >
                                          Mark Resolved
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {ticket.status === 'open' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTicketAction(ticket, 'assign')}
                                  disabled={updateTicketMutation.isPending}
                                >
                                  Assign
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleTicketAction(ticket, 'resolve')}
                                  disabled={updateTicketMutation.isPending}
                                >
                                  Resolve
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}