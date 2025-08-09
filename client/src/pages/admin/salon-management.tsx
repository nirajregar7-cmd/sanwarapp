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
  ArrowLeft,
  Scissors
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
  description?: string;
  totalReviews: number;
  isPremium: boolean;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface SalonService {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface SalonStaff {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  experience?: string;
}

interface SalonReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface SalonGalleryItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

interface WorkingHours {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export default function SalonManagement() {
  const [location] = useLocation();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    new URLSearchParams(location.split('?')[1] || '').get('status') || 'all'
  );
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch detailed salon profile for admin review
  const { data: salonProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/salons", viewingProfile],
    queryFn: async () => {
      if (!viewingProfile) return null;
      const response = await fetch(`/api/salons/${viewingProfile}`);
      if (!response.ok) throw new Error('Failed to fetch salon profile');
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

  const { data: salonServices } = useQuery<SalonService[]>({
    queryKey: ["/api/salons", viewingProfile, "services"],
    queryFn: async () => {
      if (!viewingProfile) return [];
      const response = await fetch(`/api/salons/${viewingProfile}/services`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

  const { data: salonStaff } = useQuery<SalonStaff[]>({
    queryKey: ["/api/salons", viewingProfile, "staff"],
    queryFn: async () => {
      if (!viewingProfile) return [];
      const response = await fetch(`/api/salons/${viewingProfile}/staff`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

  const { data: salonReviews } = useQuery<SalonReview[]>({
    queryKey: ["/api/salons", viewingProfile, "reviews"],
    queryFn: async () => {
      if (!viewingProfile) return [];
      const response = await fetch(`/api/salons/${viewingProfile}/reviews`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

  const { data: salonGallery } = useQuery<SalonGalleryItem[]>({
    queryKey: ["/api/salons", viewingProfile, "gallery"],
    queryFn: async () => {
      if (!viewingProfile) return [];
      const response = await fetch(`/api/salons/${viewingProfile}/gallery`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

  const { data: workingHours } = useQuery<WorkingHours[]>({
    queryKey: ["/api/salons", viewingProfile, "working-hours"],
    queryFn: async () => {
      if (!viewingProfile) return [];
      const response = await fetch(`/api/salons/${viewingProfile}/working-hours`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!viewingProfile,
    retry: false,
  });

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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingProfile(salon.id)}
                        className="flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Profile
                      </Button>
                      
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

        {/* Salon Profile Preview Modal */}
        {viewingProfile && (
          <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
              <DialogDescription className="sr-only">
                Preview of salon profile as seen by customers for admin verification
              </DialogDescription>
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
                <DialogTitle className="text-xl font-semibold">
                  Salon Profile Preview - Customer View
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  {salonProfile && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!actionNotes.trim()) {
                            toast({
                              title: "Notes Required",
                              description: "Please provide rejection notes.",
                              variant: "destructive",
                            });
                            return;
                          }
                          rejectMutation.mutate({ 
                            salonId: viewingProfile, 
                            notes: actionNotes 
                          });
                          setViewingProfile(null);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          approveMutation.mutate({ 
                            salonId: viewingProfile, 
                            notes: actionNotes 
                          });
                          setViewingProfile(null);
                        }}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                {profileLoading ? (
                  <div className="space-y-6">
                    <div className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-6"></div>
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : salonProfile ? (
                  <div className="space-y-6">
                    {/* Admin Notes Input */}
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <Label htmlFor="admin-notes" className="text-sm font-medium text-blue-900">
                          Admin Verification Notes
                        </Label>
                        <Textarea
                          id="admin-notes"
                          placeholder="Add notes about your verification decision..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          className="mt-2 bg-white"
                        />
                      </CardContent>
                    </Card>

                    {/* Salon Header - Customer View */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                            {salonProfile.imageUrl ? (
                              <img
                                src={salonProfile.imageUrl}
                                alt={salonProfile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{salonProfile.name}</h1>
                                <div className="flex items-center mb-2">
                                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                  <span className="ml-1 text-lg font-medium">
                                    {salonProfile.averageRating ? Number(salonProfile.averageRating).toFixed(1) : "New"}
                                  </span>
                                  <span className="ml-1 text-gray-500">
                                    ({salonProfile.totalReviews || 0} reviews)
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-600 mb-4">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {salonProfile.address}
                                </div>
                              </div>
                              {salonProfile.isPremium && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            
                            {salonProfile.description && (
                              <p className="text-gray-700 mb-4">{salonProfile.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Services */}
                    {salonServices && salonServices.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2">
                            {salonServices.map((service) => (
                              <div key={service.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{service.name}</h4>
                                  <span className="text-lg font-semibold text-primary">₹{service.price}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{service.duration} minutes</p>
                                {service.description && (
                                  <p className="text-sm text-gray-700">{service.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Staff */}
                    {salonStaff && salonStaff.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Our Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {salonStaff.map((staff) => (
                              <div key={staff.id} className="text-center">
                                <div className="w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full overflow-hidden">
                                  {staff.imageUrl ? (
                                    <img
                                      src={staff.imageUrl}
                                      alt={staff.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-medium">{staff.name}</h4>
                                <p className="text-sm text-gray-600">{staff.role}</p>
                                {staff.experience && (
                                  <p className="text-xs text-gray-500 mt-1">{staff.experience}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Gallery */}
                    {salonGallery && salonGallery.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Gallery</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {salonGallery.map((item) => (
                              <div key={item.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.caption || "Gallery image"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Working Hours */}
                    {workingHours && workingHours.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Working Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {workingHours.map((hours) => (
                              <div key={hours.dayOfWeek} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <span className="font-medium capitalize">{hours.dayOfWeek}</span>
                                <span className={`${hours.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                  {hours.isOpen 
                                    ? `${hours.openTime} - ${hours.closeTime}`
                                    : 'Closed'
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reviews */}
                    {salonReviews && salonReviews.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Customer Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {salonReviews.map((review) => (
                              <div key={review.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="font-medium">{review.customerName}</span>
                                    <div className="flex items-center ml-2">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-3 text-gray-500" />
                            <span>{salonProfile.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-3 text-gray-500" />
                            <span>{salonProfile.email}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                            <span>{salonProfile.address}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Failed to load salon profile</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}