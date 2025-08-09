import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

interface DashboardStats {
  totalCustomers: number;
  totalSalons: number;
  pendingSalons: number;
  totalBookings: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
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
        </Tabs>
      </div>
    </div>
  );
}