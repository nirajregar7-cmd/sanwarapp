import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Building2,
  User
} from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: 'customer' | 'salon_owner' | 'admin' | 'super_admin';
  isBlocked: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", userTypeFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userTypeFilter !== 'all') params.append('userType', userTypeFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const queryString = params.toString();
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    retry: false,
  });

  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Blocked",
        description: "The user has been blocked and can no longer access the platform.",
      });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Block Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/unblock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Unblocked",
        description: "The user has been unblocked and can now access the platform.",
      });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Unblock Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Admin</Badge>;
      case 'salon_owner':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Salon Owner</Badge>;
      case 'customer':
        return <Badge variant="secondary">Customer</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  const getStatusBadge = (isBlocked: boolean) => {
    return isBlocked ? (
      <Badge variant="destructive">Blocked</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
    );
  };

  const filteredUsers = users || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user accounts and access permissions
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="salon_owner">Salon Owners</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.userType === 'customer').length || 0}
                  </p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salon Owners</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.userType === 'salon_owner').length || 0}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users?.filter(u => u.isBlocked).length || 0}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  No users found matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getUserTypeBadge(user.userType)}
                            {getStatusBadge(user.isBlocked)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{user.firstName} {user.lastName}</DialogTitle>
                            <DialogDescription>
                              User account details and actions
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">User Type</label>
                                <div className="mt-1">{getUserTypeBadge(user.userType)}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <div className="mt-1">{getStatusBadge(user.isBlocked)}</div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{user.email}</p>
                              </div>
                              {user.phone && (
                                <div>
                                  <label className="text-sm font-medium">Phone</label>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{user.phone}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium">Member Since</label>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            {user.isBlocked ? (
                              <Button
                                onClick={() => unblockMutation.mutate(user.id)}
                                disabled={unblockMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unblock User
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                onClick={() => blockMutation.mutate(user.id)}
                                disabled={blockMutation.isPending}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Block User
                              </Button>
                            )}
                          </DialogFooter>
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