import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface ProfileAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  dailyVisits: Array<{
    date: string;
    visits: number;
  }>;
  lastUpdated: string;
}

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery<ProfileAnalytics>({
    queryKey: ['/api/owner/salon/profile-analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Failed to load analytics data</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="analytics-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            See how many customers visit your salon profile
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Updated {analytics ? format(new Date(analytics.lastUpdated), 'HH:mm') : '--:--'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="total-visits-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits (30 days)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-visits-count">
              {analytics?.totalVisits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              People who viewed your salon profile
            </p>
          </CardContent>
        </Card>

        <Card data-testid="unique-visitors-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="unique-visitors-count">
              {analytics?.uniqueVisitors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered customers who visited
            </p>
          </CardContent>
        </Card>

        <Card data-testid="today-visits-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="today-visits-count">
              {analytics?.todayVisits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Profile views today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Visits Chart */}
      <Card data-testid="daily-visits-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Profile Visits (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics?.dailyVisits || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMMM dd, yyyy')}
                  formatter={(value, name) => [value, 'Profile Visits']}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {analytics && (
        <Card data-testid="insights-card">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Profile Engagement</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your salon profile has been viewed {analytics.totalVisits} times in the last 30 days.
                  {analytics.totalVisits > 0 && (
                    <span className="block mt-1">
                      That's an average of {Math.round(analytics.totalVisits / 30)} views per day!
                    </span>
                  )}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100">Customer Interest</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {analytics.uniqueVisitors} unique registered customers have visited your profile.
                  {analytics.totalVisits > analytics.uniqueVisitors && (
                    <span className="block mt-1">
                      Some customers visited multiple times - showing strong interest!
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-4">
              * Analytics show profile visits from the last 30 days. Anonymous visitors and visits from salon owner are included in total counts but not unique visitors.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}