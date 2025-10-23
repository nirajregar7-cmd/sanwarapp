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
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  totalCustomers: number;
  totalSalons: number;
  pendingSalons: number;
  totalBookings: number;
  totalRevenue: number;
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Platform Analytics</span>
                </CardTitle>
                <CardDescription>
                  Detailed insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Advanced analytics dashboard coming soon
                  </p>
                  <Button variant="outline" disabled>
                    View Full Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
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