import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldOff,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Link } from "wouter";

interface ActivityLog {
  id: string;
  adminId: string;
  action: string;
  targetType: 'salon' | 'user' | 'booking' | 'review' | 'content';
  targetId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function ActivityLogs() {
  const [limit, setLimit] = useState("50");

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs", limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/activity-logs?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    retry: false,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve_salon':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject_salon':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'block_user':
        return <ShieldOff className="h-4 w-4 text-red-600" />;
      case 'unblock_user':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'view_content':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'edit_content':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'delete_content':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approve_salon':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Salon Approved</Badge>;
      case 'reject_salon':
        return <Badge variant="destructive">Salon Rejected</Badge>;
      case 'block_user':
        return <Badge variant="destructive">User Blocked</Badge>;
      case 'unblock_user':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">User Unblocked</Badge>;
      default:
        return <Badge variant="outline">{action.replace('_', ' ').toUpperCase()}</Badge>;
    }
  };

  const getTargetTypeBadge = (targetType: string) => {
    switch (targetType) {
      case 'salon':
        return <Badge variant="secondary">Salon</Badge>;
      case 'user':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">User</Badge>;
      case 'booking':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Booking</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Review</Badge>;
      case 'content':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Content</Badge>;
      default:
        return <Badge variant="outline">{targetType}</Badge>;
    }
  };

  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return { action: details };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            Activity Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track admin actions and system activities
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Number of logs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Last 25 logs</SelectItem>
                    <SelectItem value="50">Last 50 logs</SelectItem>
                    <SelectItem value="100">Last 100 logs</SelectItem>
                    <SelectItem value="200">Last 200 logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <div className="space-y-4">
          {!logs || logs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  No activity logs found.
                </p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const details = parseDetails(log.details);
              
              return (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {getActionBadge(log.action)}
                              {getTargetTypeBadge(log.targetType)}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div className="flex items-center space-x-2">
                                <User className="h-3 w-3" />
                                <span>Admin ID: {log.adminId}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                              
                              {log.targetId && (
                                <div>
                                  <span className="font-medium">Target:</span> {log.targetType} ({log.targetId})
                                </div>
                              )}
                              
                              {details.action && details.action !== log.action && (
                                <div>
                                  <span className="font-medium">Details:</span> {details.action}
                                </div>
                              )}
                              
                              {details.notes && (
                                <div>
                                  <span className="font-medium">Notes:</span> {details.notes}
                                </div>
                              )}
                              
                              {log.ipAddress && (
                                <div>
                                  <span className="font-medium">IP:</span> {log.ipAddress}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {logs && logs.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {logs.length} most recent activity logs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}