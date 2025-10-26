import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Mail,
  Video,
  Plus,
  Upload
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DashboardStats {
  totalCustomers: number;
  totalSalons: number;
  pendingSalons: number;
  totalBookings: number;
  totalRevenue: number;
}

interface AnalyticsData {
  bookingsOverTime: { date: string; count: number; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  topSalons: { salonId: string; salonName: string; bookingCount: number; revenue: number }[];
  userGrowth: { date: string; customers: number; salonOwners: number }[];
  summary: { totalBookings: number; totalRevenue: number; avgBookingValue: number };
  dateRange: { startDate: string; endDate: string; days: number };
}

function UpcomingFeatureVideosView() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const { data: videos, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/upcoming-features"],
    queryFn: async () => {
      const response = await fetch("/api/admin/upcoming-features", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return await apiRequest("DELETE", `/api/admin/upcoming-features/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upcoming-features"] });
      toast({
        title: "Video Deleted",
        description: "The video has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setIsDialogOpen(true);
  };

  const handleDelete = (videoId: string) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate(videoId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading videos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const videoList = videos || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Upcoming Feature Videos</span>
              </CardTitle>
              <CardDescription>Manage videos shown on the homepage</CardDescription>
            </div>
            <Button onClick={() => { setEditingVideo(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {videoList.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No videos added yet</p>
              <Button onClick={() => { setEditingVideo(null); setIsDialogOpen(true); }}>
                Add Your First Video
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {videoList.map((video: any) => (
                <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{video.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Order: {video.order}</span>
                        <span className={video.isActive ? 'text-green-600' : 'text-gray-400'}>
                          {video.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(video)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(video.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VideoDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingVideo(null); }}
        video={editingVideo}
      />
    </div>
  );
}

function CustomerManagementView() {
  const [, setLocation] = useLocation();
  const { toast} = useToast();
  
  const { data: customers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
    retry: false,
  });

  const handleImpersonate = (userId: string) => {
    setLocation(`/admin/impersonate/${userId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const customerList = customers || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Customer Management</span>
              </CardTitle>
              <CardDescription>View and manage all customer accounts</CardDescription>
            </div>
            <Badge variant="secondary">
              {customerList.length} customers
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {customerList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    <th className="pb-3 px-2">Customer</th>
                    <th className="pb-3 px-2">Email</th>
                    <th className="pb-3 px-2">Phone</th>
                    <th className="pb-3 px-2">Joined</th>
                    <th className="pb-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {customerList.map((customer: any) => (
                    <tr key={customer.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {customer.id.substring(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-gray-900 dark:text-white">{customer.email}</p>
                      </td>
                      <td className="py-4 px-2">
                        <p className="text-gray-900 dark:text-white">
                          {customer.phone || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4 px-2 text-gray-500 dark:text-gray-400">
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(customer.id)}
                          data-testid={`btn-impersonate-${customer.id}`}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Login as Customer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AllBookingsView() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: bookingsData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/bookings", statusFilter ? `?status=${statusFilter}` : ''],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading bookings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bookings = bookingsData?.bookings || [];

  const statusColors: Record<string, string> = {
    'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>All Bookings</span>
              </CardTitle>
              <CardDescription>Complete booking history with customer and salon details</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                data-testid="select-booking-status"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Badge variant="secondary">
                {bookingsData?.total || 0} total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    <th className="pb-3 px-2">Booking ID</th>
                    <th className="pb-3 px-2">Customer</th>
                    <th className="pb-3 px-2">Salon</th>
                    <th className="pb-3 px-2">Service</th>
                    <th className="pb-3 px-2">Date & Time</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {bookings.map((item: any) => (
                    <tr key={item.booking.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 px-2">
                        <span className="font-mono text-xs font-semibold">
                          #{item.booking.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.customer.firstName} {item.customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.customer.email}
                          </p>
                          {item.customer.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.salon.name}
                          </p>
                          {item.salon.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.salon.address.substring(0, 40)}...
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.service.name}
                          </p>
                          {item.staff && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Staff: {item.staff.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(item.booking.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.booking.startTime} - {item.booking.endTime}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ₹{item.service.price}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Conf: ₹{(parseFloat(item.booking.confirmationAmount || 0) / 100).toFixed(0)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge 
                          className={`capitalize ${statusColors[item.booking.status] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {item.booking.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.booking.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsContent() {
  const [days, setDays] = useState(30);
  
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", `?days=${days}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    'confirmed': 'bg-green-500',
    'pending': 'bg-yellow-500',
    'completed': 'bg-blue-500',
    'cancelled': 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Platform Analytics</span>
              </CardTitle>
              <CardDescription>Last {days} days performance metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={days === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(7)}
                data-testid="btn-analytics-7days"
              >
                7 Days
              </Button>
              <Button
                variant={days === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(30)}
                data-testid="btn-analytics-30days"
              >
                30 Days
              </Button>
              <Button
                variant={days === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(90)}
                data-testid="btn-analytics-90days"
              >
                90 Days
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalBookings}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              In the last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(analytics.summary.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confirmation fees collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg. Booking Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(analytics.summary.avgBookingValue || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Per booking average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.bookingsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium capitalize">{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count} bookings
                    </span>
                    <span className="text-sm font-semibold">
                      {analytics.summary.totalBookings > 0 ? ((item.count / analytics.summary.totalBookings) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Bookings Trend (Simple List) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Daily bookings count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {analytics.bookingsOverTime.slice(-10).reverse().map((item) => (
                <div key={item.date} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold">{item.count} bookings</span>
                    <span className="text-sm text-green-600 dark:text-green-400">₹{Number(item.revenue || 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Salons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Salons</CardTitle>
          <CardDescription>Salons with most bookings in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topSalons.map((salon, index) => (
              <div key={salon.salonId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{salon.salonName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {salon.bookingCount} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ₹{Number(salon.revenue || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                </div>
              </div>
            ))}
            {analytics.topSalons.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No salon data available for this period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
  });

  // Fetch admin settings
  const { data: settings } = useQuery<any[]>({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  // Get shopkeeper emails setting
  const shopkeeperEmailsSetting = settings?.find(
    (s) => s.settingKey === 'shopkeeper_booking_emails_enabled'
  );
  const shopkeeperEmailsEnabled = shopkeeperEmailsSetting?.settingValue === 'true';

  // Mutation to update settings
  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: string }) => {
      return await apiRequest('PUT', `/api/admin/settings/${settingKey}`, { settingValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Email notification settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Approve Salons",
      description: "Review pending salon verifications",
      icon: CheckCircle,
      href: "/admin/salons?status=pending",
      count: stats?.pendingSalons || 0,
      color: "text-orange-600"
    },
    {
      title: "User Management",
      description: "Manage customer and salon owner accounts",
      icon: Users,
      href: "/admin/users",
      count: stats?.totalCustomers || 0,
      color: "text-blue-600"
    },
    {
      title: "Content Moderation",
      description: "Review reported content and reviews",
      icon: AlertTriangle,
      href: "/admin/content-moderation",
      count: 0,
      color: "text-red-600"
    },
    {
      title: "Activity Logs",
      description: "View admin actions and system logs",
      icon: FileText,
      href: "/admin/activity-logs",
      count: 0,
      color: "text-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage platform operations and monitor performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active user accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Salons</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSalons?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registered salon partners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Completed bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total confirmation fees
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="videos">Upcoming Features</TabsTrigger>
            <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action) => (
                <Card key={action.title} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </div>
                      {action.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {action.count}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={action.href}>
                      <Button className="w-full">
                        Open {action.title}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManagementView />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <AllBookingsView />
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <UpcomingFeatureVideosView />
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending Salon Approvals</span>
                  {stats?.pendingSalons && stats.pendingSalons > 0 && (
                    <Badge variant="destructive">{stats.pendingSalons}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Salons waiting for verification and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.pendingSalons === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>All caught up! No pending salon approvals.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      There are {stats?.pendingSalons} salon(s) waiting for your review.
                    </p>
                    <Link href="/admin/salons?status=pending">
                      <Button>Review Pending Salons</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsContent />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Platform Settings</span>
                </CardTitle>
                <CardDescription>
                  Control system-wide settings and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Notifications</span>
                  </h3>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="shopkeeper-emails" className="text-base font-medium">
                          Shopkeeper Booking Notifications
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          When enabled, salon owners will receive email notifications for new bookings. 
                          Turn off to stop sending booking emails to shopkeepers.
                        </p>
                      </div>
                      <Switch
                        id="shopkeeper-emails"
                        checked={shopkeeperEmailsEnabled}
                        onCheckedChange={(checked) => {
                          updateSettingMutation.mutate({
                            settingKey: 'shopkeeper_booking_emails_enabled',
                            settingValue: checked ? 'true' : 'false',
                          });
                        }}
                        disabled={updateSettingMutation.isPending}
                        data-testid="toggle-shopkeeper-emails"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${shopkeeperEmailsEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-gray-600 dark:text-gray-400">
                        Status: {shopkeeperEmailsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {updateSettingMutation.isPending && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Updating settings...</p>
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

function VideoDialog({ isOpen, onClose, video }: { isOpen: boolean; onClose: () => void; video: any }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(video?.title || '');
  const [description, setDescription] = useState(video?.description || '');
  const [videoUrl, setVideoUrl] = useState(video?.videoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl || '');
  const [order, setOrder] = useState(video?.order || 0);
  const [isActive, setIsActive] = useState(video?.isActive ?? true);
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (video?.id) {
        return await apiRequest("PUT", `/api/admin/upcoming-features/${video.id}`, data);
      } else {
        return await apiRequest("POST", "/api/admin/upcoming-features", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upcoming-features"] });
      toast({
        title: video?.id ? "Video Updated" : "Video Added",
        description: `The video has been ${video?.id ? "updated" : "added"} successfully.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save video",
        variant: "destructive",
      });
    },
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setVideoUrl(data.url);
      toast({
        title: "Video Uploaded",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!title || !videoUrl) {
      toast({
        title: "Missing Fields",
        description: "Please provide a title and video URL",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      order,
      isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? 'Edit Video' : 'Add New Video'}</DialogTitle>
          <DialogDescription>
            Upload a video to display on the homepage upcoming features section
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Virtual Try-On"
              data-testid="input-video-title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the feature"
              rows={3}
              data-testid="input-video-description"
            />
          </div>

          <div>
            <Label htmlFor="video">Video Upload *</Label>
            <div className="space-y-2">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploading}
                data-testid="input-video-file"
              />
              {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
              {videoUrl && !uploading && (
                <p className="text-sm text-green-600">✓ Video uploaded</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
            <Input
              id="thumbnail"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              data-testid="input-video-thumbnail"
            />
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              data-testid="input-video-order"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="toggle-video-active"
            />
            <Label htmlFor="active">Show on homepage</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} data-testid="btn-cancel-video">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || uploading}
              data-testid="btn-save-video"
            >
              {saveMutation.isPending ? "Saving..." : video ? "Update" : "Add"} Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}