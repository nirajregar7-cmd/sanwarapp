import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  FileText,
  User,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface Salon {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  imageUrl?: string;
  averageRating: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string;
  createdAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function SalonManagement() {
  const [location] = useLocation();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    new URLSearchParams(location.split('?')[1] || '').get('status') || 'all'
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salons, isLoading } = useQuery<Salon[]>({
    queryKey: ["/api/admin/salons", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await fetch(`/api/admin/salons${params}`);
      if (!response.ok) throw new Error('Failed to fetch salons');
      return response.json();
    },
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ salonId, notes }: { salonId: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/salons/${salonId}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Salon Approved",
        description: "The salon has been successfully approved and is now visible to customers.",
      });
      setSelectedSalon(null);
      setActionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ salonId, notes }: { salonId: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/salons/${salonId}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Salon Rejected",
        description: "The salon application has been rejected with feedback sent to the owner.",
      });
      setSelectedSalon(null);
      setActionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
    }
  };

  const filteredSalons = salons?.filter(salon => {
    if (statusFilter === 'all') return true;
    return salon.verificationStatus === statusFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Salon Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage salon verification requests
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All Salons ({salons?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({salons?.filter(s => s.verificationStatus === 'pending').length || 0})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({salons?.filter(s => s.verificationStatus === 'approved').length || 0})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({salons?.filter(s => s.verificationStatus === 'rejected').length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Salons List */}
        <div className="space-y-4">
          {filteredSalons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  No salons found for the selected filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSalons.map((salon) => (
              <Card key={salon.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {salon.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {salon.address}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {getStatusBadge(salon.verificationStatus)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4 mr-2" />
                          <span>{salon.owner.firstName} {salon.owner.lastName}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{salon.owner.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{salon.owner.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{new Date(salon.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {salon.verificationNotes && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {salon.verificationNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSalon(salon)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{salon.name}</DialogTitle>
                            <DialogDescription>
                              Review salon details and take action
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">
                                  {getStatusBadge(salon.verificationStatus)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Average Rating</Label>
                                <div className="mt-1 flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                  <span>{salon.averageRating || 'No ratings yet'}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Owner Information</Label>
                              <div className="mt-2 space-y-1 text-sm">
                                <p><strong>Name:</strong> {salon.owner.firstName} {salon.owner.lastName}</p>
                                <p><strong>Email:</strong> {salon.owner.email}</p>
                                <p><strong>Phone:</strong> {salon.owner.phone}</p>
                              </div>
                            </div>

                            {salon.verificationStatus === 'pending' && (
                              <div>
                                <Label htmlFor="notes" className="text-sm font-medium">
                                  Notes (Optional)
                                </Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add notes for your decision..."
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            )}
                          </div>

                          {salon.verificationStatus === 'pending' && (
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  if (!actionNotes.trim()) {
                                    toast({
                                      title: "Notes Required",
                                      description: "Please provide rejection notes to help the salon owner understand what needs to be fixed.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  rejectMutation.mutate({ salonId: salon.id, notes: actionNotes });
                                }}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => approveMutation.mutate({ salonId: salon.id, notes: actionNotes })}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogFooter>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}