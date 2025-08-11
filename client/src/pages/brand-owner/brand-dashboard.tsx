import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Download
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
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{salon.monthlyEarnings.toLocaleString()}</p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            {salon.averageRating}
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
    </div>
  );
}