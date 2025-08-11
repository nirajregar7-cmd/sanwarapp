import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Star, 
  MapPin, 
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  Eye,
  Plus,
  Filter,
  Download,
  Send,
  Clock,
  Check,
  X,
  UserPlus,
  Link2,
  MessageCircle,
  Target,
  Award,
  LineChart,
  PieChart,
  Activity,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BrandSalon {
  id: string;
  name: string;
  address: string;
  averageRating: string;
  totalReviews: number;
  isActive: boolean;
  isPremium: boolean;
  ownerId: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  _count: {
    bookings: number;
    services: number;
    staff: number;
  };
  totalEarnings: number;
  monthlyEarnings: number;
}

interface BrandStats {
  totalSalons: number;
  activeSalons: number;
  totalBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
}

interface ServicePopularity {
  serviceName: string;
  bookingCount: number;
  revenue: number;
  salonName: string;
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedSalon, setSelectedSalon] = useState<string>("all");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedSalonForMessage, setSelectedSalonForMessage] = useState<BrandSalon | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [salonDetailsDialogOpen, setSalonDetailsDialogOpen] = useState(false);
  const [selectedSalonDetails, setSelectedSalonDetails] = useState<BrandSalon | null>(null);

  // Fetch brand salons
  const { data: brandSalons, isLoading: salonsLoading } = useQuery<BrandSalon[]>({
    queryKey: [`/api/brand/salons/${user?.id}`],
    enabled: !!user?.id && (user as any)?.userType === 'brand_owner'
  });

  // Fetch brand statistics  
  const { data: brandStats, isLoading: statsLoading } = useQuery<BrandStats>({
    queryKey: [`/api/brand/stats/${user?.id}`, selectedDateRange],
    enabled: !!user?.id && (user as any)?.userType === 'brand_owner'
  });

  // Fetch service popularity
  const { data: servicePopularity, isLoading: servicesLoading } = useQuery<ServicePopularity[]>({
    queryKey: [`/api/brand/services/popular/${user?.id}`, selectedDateRange, selectedSalon],
    enabled: !!user?.id && (user as any)?.userType === 'brand_owner'
  });

  // Fetch customer reviews summary
  const { data: reviewsSummary } = useQuery({
    queryKey: [`/api/brand/reviews/${user?.id}`, selectedDateRange],
    enabled: !!user?.id && (user as any)?.userType === 'brand_owner'
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ salonId, message }: { salonId: string, message: string }) => {
      const response = await fetch('/api/brand/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ salonId, message })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent to the salon owner.",
      });
      setMessageDialogOpen(false);
      setMessageContent("");
      setSelectedSalonForMessage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch detailed salon analytics
  const { data: detailedAnalytics } = useQuery({
    queryKey: [`/api/brand/salon-analytics/${selectedSalonDetails?.id}`, selectedDateRange],
    enabled: !!selectedSalonDetails?.id,
  });

  // Handler functions
  const handleSendMessage = (salonId: string, salonName: string) => {
    const salon = brandSalons?.find(s => s.id === salonId);
    if (salon) {
      setSelectedSalonForMessage(salon);
      setMessageDialogOpen(true);
    }
  };

  const handleToggleSalonStatus = async (salonId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) throw new Error('Failed to update salon status');
      
      toast({
        title: isActive ? "Salon suspended" : "Salon activated",
        description: `The salon has been ${isActive ? 'suspended' : 'activated'} successfully.`,
      });
      
      // Refresh the data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update salon status",
        variant: "destructive",
      });
    }
  };

  const handleViewSalonDetails = (salonId: string) => {
    const salon = brandSalons?.find(s => s.id === salonId);
    if (salon) {
      setSelectedSalonDetails(salon);
      setSalonDetailsDialogOpen(true);
    }
  };

  if ((user as any)?.userType !== 'brand_owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only brand owners can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickDateRanges = [
    {
      label: "Today",
      value: () => ({
        from: new Date(),
        to: new Date()
      })
    },
    {
      label: "Last 7 days",
      value: () => ({
        from: subDays(new Date(), 7),
        to: new Date()
      })
    },
    {
      label: "Last 30 days",
      value: () => ({
        from: subDays(new Date(), 30),
        to: new Date()
      })
    },
    {
      label: "This month",
      value: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Brand Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user.firstName}! Managing {(user as any).brandName || 'Your'} brand
          </p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-2">
          {quickDateRanges.map((range) => (
            <Button
              key={range.label}
              variant="outline"
              size="sm"
              onClick={() => setSelectedDateRange(range.value())}
            >
              {range.label}
            </Button>
          ))}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: selectedDateRange.from,
                  to: selectedDateRange.to
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setSelectedDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {brandStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Salons</p>
                  <p className="text-2xl font-bold">{brandStats.totalSalons}</p>
                  <p className="text-xs text-gray-500">{brandStats.activeSalons} active</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{brandStats.totalBookings}</p>
                  <p className="text-xs text-gray-500">This period</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{brandStats.totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <IndianRupee className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold">{brandStats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{brandStats.totalReviews} reviews</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="salons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salons">Branch Management</TabsTrigger>
          <TabsTrigger value="connections">Salon Connections</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="services">Service Reports</TabsTrigger>
          <TabsTrigger value="reviews">Customer Feedback</TabsTrigger>
          <TabsTrigger value="offers">Offers & Pricing</TabsTrigger>
        </TabsList>

        {/* Branch Management Tab */}
        <TabsContent value="salons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Salon Branches</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Branch
            </Button>
          </div>

          {salonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandSalons?.map((salon) => (
                <Card key={salon.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{salon.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {salon.address}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={salon.isActive ? "default" : "secondary"}>
                          {salon.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {salon.isPremium && <Badge variant="outline">Premium</Badge>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Manager:</span>
                        <span>{salon.owner.firstName} {salon.owner.lastName}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Rating:</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {salon.averageRating} ({salon.totalReviews})
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="font-semibold">{salon._count.bookings}</p>
                          <p className="text-gray-600">Bookings</p>
                        </div>
                        <div>
                          <p className="font-semibold">{salon._count.staff}</p>
                          <p className="text-gray-600">Staff</p>
                        </div>
                        <div>
                          <p className="font-semibold">{salon._count.services}</p>
                          <p className="text-gray-600">Services</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Monthly Earnings:</span>
                        <span className="font-semibold text-green-600">
                          ₹{salon.monthlyEarnings.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewSalonDetails(salon.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              const phone = salon.owner.phone || '';
                              if (phone) {
                                window.open(`tel:${phone}`, '_blank');
                              }
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const email = salon.owner.email;
                              window.open(`mailto:${email}?subject=Regarding ${salon.name}`, '_blank');
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email Manager
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleSendMessage(salon.id, salon.name)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.open(`/admin/reports?salon=${salon.id}`, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Reports
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleToggleSalonStatus(salon.id, salon.isActive)}
                          >
                            {salon.isActive ? (
                              <>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Suspend Salon
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Activate Salon
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Salon Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <ConnectionsManagement userId={user?.id} />
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Branch Performance Comparison</h2>
            <div className="flex gap-2">
              <Select value={selectedSalon} onValueChange={setSelectedSalon}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select salon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salons</SelectItem>
                  {brandSalons?.map((salon) => (
                    <SelectItem key={salon.id} value={salon.id}>{salon.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Salons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Performing Branches
                </CardTitle>
                <CardDescription>Based on bookings and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brandSalons
                    ?.sort((a, b) => b.monthlyEarnings - a.monthlyEarnings)
                    .slice(0, 5)
                    .map((salon, index) => (
                      <div key={salon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{salon.name}</p>
                            <p className="text-sm text-gray-600">{salon._count.bookings} bookings</p>
                            <p className="text-xs text-gray-500">Owner: {salon.owner.firstName} {salon.owner.lastName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-semibold">₹{salon.monthlyEarnings.toLocaleString()}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              {salon.averageRating}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSalonDetails(salon);
                                setSalonDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSalonForMessage(salon);
                                setMessageDialogOpen(true);
                              }}
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Earnings Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Earnings Comparison
                </CardTitle>
                <CardDescription>Monthly earnings by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brandSalons?.map((salon) => (
                    <div key={salon.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{salon.name}</span>
                        <span>₹{salon.monthlyEarnings.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${brandStats ? (salon.monthlyEarnings / brandStats.monthlyEarnings) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Reports Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Service Popularity Reports</h2>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Popular Services</CardTitle>
              <CardDescription>Services with highest booking counts across all branches</CardDescription>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {servicePopularity?.map((service, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{service.serviceName}</p>
                        <p className="text-sm text-gray-600">From {service.salonName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{service.bookingCount} bookings</p>
                        <p className="text-sm text-green-600">₹{service.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Feedback Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Feedback Summary</h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter Reviews
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewsSummary?.recent?.map((review: any) => (
                    <div key={review.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{review.salonName}</span>
                        </div>
                      </div>
                      <p className="text-sm">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Feedback Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewsSummary?.themes?.map((theme: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{theme.keyword}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={theme.sentiment === 'positive' ? 'default' : 'destructive'}>
                          {theme.sentiment}
                        </Badge>
                        <span className="text-sm font-medium">{theme.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Offers & Pricing Tab */}
        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Offers & Pricing Control</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Brand-wide Offer
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Brand Offers</CardTitle>
              <CardDescription>Manage promotions across all your branches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active brand-wide offers</p>
                <Button variant="outline">Create Your First Offer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to Salon Owner</DialogTitle>
            <DialogDescription>
              Send a message to {selectedSalonForMessage?.owner.firstName} {selectedSalonForMessage?.owner.lastName} at {selectedSalonForMessage?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSalonForMessage && messageContent.trim()) {
                  sendMessageMutation.mutate({
                    salonId: selectedSalonForMessage.id,
                    message: messageContent.trim()
                  });
                }
              }}
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Salon Analytics Dialog */}
      <Dialog open={salonDetailsDialogOpen} onOpenChange={setSalonDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedSalonDetails?.name} - Performance Analytics
            </DialogTitle>
            <DialogDescription>
              Comprehensive performance analysis and owner profile
            </DialogDescription>
          </DialogHeader>
          
          {selectedSalonDetails && (
            <div className="space-y-6">
              {/* Owner Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Owner Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-lg">{selectedSalonDetails.owner.firstName} {selectedSalonDetails.owner.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-lg">{selectedSalonDetails.owner.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Salon Address</p>
                      <p className="text-sm">{selectedSalonDetails.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge variant={selectedSalonDetails.isActive ? "default" : "secondary"}>
                        {selectedSalonDetails.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <IndianRupee className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold">₹{selectedSalonDetails.totalEarnings.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold">₹{selectedSalonDetails.monthlyEarnings.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Monthly Earnings</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CalendarIcon className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-2xl font-bold">{selectedSalonDetails._count.bookings}</p>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team & Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Staff Members</span>
                        <span className="font-semibold">{selectedSalonDetails._count.staff}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Services Offered</span>
                        <span className="font-semibold">{selectedSalonDetails._count.services}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Rating</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">{selectedSalonDetails.averageRating}</span>
                          <span className="text-sm text-gray-500 ml-1">({selectedSalonDetails.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Performance Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Revenue Share (Brand)</span>
                        <span className="font-semibold text-green-600">₹{(selectedSalonDetails.monthlyEarnings * 0.45).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue Share (Salon)</span>
                        <span className="font-semibold">₹{(selectedSalonDetails.monthlyEarnings * 0.55).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Premium Status</span>
                        <Badge variant={selectedSalonDetails.isPremium ? "default" : "outline"}>
                          {selectedSalonDetails.isPremium ? "Premium" : "Standard"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSalonForMessage(selectedSalonDetails);
                        setMessageDialogOpen(true);
                        setSalonDetailsDialogOpen(false);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Owner
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalonDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Brand Connections Management Component
interface BrandInvitation {
  id: string;
  salonOwnerId?: string;
  brandOwnerId?: string;
  salonId?: string;
  salonName?: string;
  brandName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  invitationType: 'brand_to_salon' | 'salon_to_brand';
  createdAt: string;
  ownerName?: string;
  ownerEmail?: string;
  brandOwnerName?: string;
  brandOwnerEmail?: string;
}

function ConnectionsManagement({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchSalonId, setSearchSalonId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Fetch brand invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: [`/api/brand-invitations/${userId}`],
    enabled: !!userId,
  });

  // Send brand invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { salonId: string; message?: string }) => {
      const response = await fetch('/api/brand-invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-invitations/${userId}`] });
      toast({ title: "Invitation sent successfully!", description: "The salon owner will be notified." });
      setShowInviteDialog(false);
      setSearchSalonId('');
      setInviteMessage('');
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send invitation", description: error.message, variant: "destructive" });
    },
  });

  // Respond to invitation mutation
  const respondInvitationMutation = useMutation({
    mutationFn: async (data: { invitationId: string; status: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/brand-invitations/${data.invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to respond to invitation');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-invitations/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/brand/salons/${userId}`] });
      toast({ 
        title: `Invitation ${variables.status}!`, 
        description: variables.status === 'accepted' ? "Salon has been added to your brand." : "Invitation declined."
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to respond", description: error.message, variant: "destructive" });
    },
  });

  const handleSendInvitation = () => {
    if (!searchSalonId.trim()) {
      toast({ title: "Please enter a salon ID", variant: "destructive" });
      return;
    }
    sendInvitationMutation.mutate({ salonId: searchSalonId, message: inviteMessage });
  };

  const handleRespondToInvitation = (invitationId: string, status: 'accepted' | 'rejected') => {
    respondInvitationMutation.mutate({ invitationId, status });
  };

  const sentInvitations = invitations?.sent || [];
  const receivedInvitations = invitations?.received || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Brand Salon Connections</h2>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Salon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Salon to Join Brand</DialogTitle>
              <DialogDescription>
                Send an invitation to a salon owner to join your brand network.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="salonId">Salon ID</Label>
                <Input
                  id="salonId"
                  placeholder="Enter salon ID"
                  value={searchSalonId}
                  onChange={(e) => setSearchSalonId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={sendInvitationMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sent Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Sent Invitations
            </CardTitle>
            <CardDescription>Invitations you've sent to salon owners</CardDescription>
          </CardHeader>
          <CardContent>
            {invitationsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : sentInvitations.length > 0 ? (
              <div className="space-y-4">
                {sentInvitations.map((invitation: BrandInvitation) => (
                  <div key={invitation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{invitation.salonName}</h4>
                        <p className="text-sm text-gray-600">
                          Owner: {invitation.ownerName} ({invitation.ownerEmail})
                        </p>
                      </div>
                      <Badge variant={
                        invitation.status === 'pending' ? 'secondary' :
                        invitation.status === 'accepted' ? 'default' : 'destructive'
                      }>
                        <div className="flex items-center gap-1">
                          {invitation.status === 'pending' && <Clock className="h-3 w-3" />}
                          {invitation.status === 'accepted' && <Check className="h-3 w-3" />}
                          {invitation.status === 'rejected' && <X className="h-3 w-3" />}
                          {invitation.status}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{invitation.message}</p>
                    <p className="text-xs text-gray-500">
                      Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No invitations sent yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Received Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Join Requests
            </CardTitle>
            <CardDescription>Requests from salon owners to join your brand</CardDescription>
          </CardHeader>
          <CardContent>
            {invitationsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : receivedInvitations.filter((inv: BrandInvitation) => inv.invitationType === 'salon_to_brand').length > 0 ? (
              <div className="space-y-4">
                {receivedInvitations
                  .filter((inv: BrandInvitation) => inv.invitationType === 'salon_to_brand')
                  .map((invitation: BrandInvitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{invitation.salonName}</h4>
                          <p className="text-sm text-gray-600">Wants to join your brand</p>
                        </div>
                        <Badge variant={
                          invitation.status === 'pending' ? 'secondary' :
                          invitation.status === 'accepted' ? 'default' : 'destructive'
                        }>
                          {invitation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{invitation.message}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Requested: {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                      
                      {invitation.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                            disabled={respondInvitationMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondToInvitation(invitation.id, 'rejected')}
                            disabled={respondInvitationMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">No join requests received.</p>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}