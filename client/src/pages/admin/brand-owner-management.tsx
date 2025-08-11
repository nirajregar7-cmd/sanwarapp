import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  IndianRupee, 
  Star, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Download,
  Crown,
  Link2,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrandOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  brandName: string;
  brandDescription?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    salons: number;
    totalBookings: number;
    totalEarnings: number;
  };
  salons?: Array<{
    id: string;
    name: string;
    address: string;
    isActive: boolean;
    averageRating: string;
    totalReviews: number;
  }>;
}

export default function BrandOwnerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedBrandOwner, setSelectedBrandOwner] = useState<BrandOwner | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch all brand owners
  const { data: brandOwners, isLoading } = useQuery({
    queryKey: ['/api/admin/brand-owners'],
  });

  // Update brand owner status mutation
  const updateBrandOwnerMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<BrandOwner> }) => {
      const response = await fetch(`/api/admin/brand-owners/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update brand owner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-owners'] });
      toast({ title: "Brand owner updated successfully!" });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update brand owner", description: error.message, variant: "destructive" });
    },
  });

  // Delete brand owner mutation
  const deleteBrandOwnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/brand-owners/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete brand owner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-owners'] });
      toast({ title: "Brand owner deleted successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete brand owner", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateStatus = (id: string, isActive: boolean) => {
    updateBrandOwnerMutation.mutate({ id, updates: { isActive } });
  };

  const handleVerifyBrandOwner = (id: string, isVerified: boolean) => {
    updateBrandOwnerMutation.mutate({ id, updates: { isVerified } });
  };

  const handleDeleteBrandOwner = (id: string) => {
    if (window.confirm('Are you sure you want to delete this brand owner? This action cannot be undone.')) {
      deleteBrandOwnerMutation.mutate(id);
    }
  };

  const filteredBrandOwners = brandOwners?.filter((brandOwner: BrandOwner) => {
    const matchesSearch = 
      brandOwner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandOwner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandOwner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandOwner.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && brandOwner.isActive) ||
      (statusFilter === "inactive" && !brandOwner.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleViewDetails = async (brandOwner: BrandOwner) => {
    // Fetch detailed info including salons
    try {
      const response = await fetch(`/api/admin/brand-owners/${brandOwner.id}/details`);
      if (response.ok) {
        const detailedData = await response.json();
        setSelectedBrandOwner(detailedData);
      } else {
        setSelectedBrandOwner(brandOwner);
      }
      setShowDetailsDialog(true);
    } catch (error) {
      setSelectedBrandOwner(brandOwner);
      setShowDetailsDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Brand Owner Management</h1>
          <p className="text-gray-600">Manage and monitor all brand owners in the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or brand name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Brand Owners</p>
                <p className="text-2xl font-bold">{brandOwners?.length || 0}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Brands</p>
                <p className="text-2xl font-bold">
                  {brandOwners?.filter((bo: BrandOwner) => bo.isActive).length || 0}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Brands</p>
                <p className="text-2xl font-bold">
                  {brandOwners?.filter((bo: BrandOwner) => bo.isVerified).length || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salons</p>
                <p className="text-2xl font-bold">
                  {brandOwners?.reduce((sum: number, bo: BrandOwner) => sum + (bo._count?.salons || 0), 0) || 0}
                </p>
              </div>
              <Link2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Owners</CardTitle>
          <CardDescription>
            {filteredBrandOwners.length} brand owner{filteredBrandOwners.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredBrandOwners.length > 0 ? (
            <div className="space-y-4">
              {filteredBrandOwners.map((brandOwner: BrandOwner) => (
                <div key={brandOwner.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Crown className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{brandOwner.brandName}</h3>
                          <p className="text-gray-600">
                            {brandOwner.firstName} {brandOwner.lastName} • {brandOwner.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{brandOwner.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Salons:</span>
                          <p className="font-medium">{brandOwner._count?.salons || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Joined:</span>
                          <p className="font-medium">
                            {new Date(brandOwner.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Earnings:</span>
                          <p className="font-medium text-green-600">
                            ₹{brandOwner._count?.totalEarnings?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end ml-4">
                      <div className="flex gap-2">
                        <Badge variant={brandOwner.isActive ? "default" : "secondary"}>
                          {brandOwner.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {brandOwner.isVerified && (
                          <Badge variant="outline" className="text-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(brandOwner)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBrandOwner(brandOwner);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBrandOwner(brandOwner.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No brand owners found</h3>
              <p className="text-gray-600">Try adjusting your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Owner Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-purple-600" />
              {selectedBrandOwner?.brandName} - Brand Details
            </DialogTitle>
            <DialogDescription>
              Complete brand owner profile and salon network information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBrandOwner && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Full Name</Label>
                      <p className="font-medium">{selectedBrandOwner.firstName} {selectedBrandOwner.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Email</Label>
                      <p className="font-medium">{selectedBrandOwner.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Phone</Label>
                      <p className="font-medium">{selectedBrandOwner.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={selectedBrandOwner.isActive ? "default" : "secondary"}>
                          {selectedBrandOwner.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {selectedBrandOwner.isVerified && (
                          <Badge variant="outline" className="text-green-600">Verified</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Brand Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Brand Name</Label>
                      <p className="font-medium">{selectedBrandOwner.brandName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Description</Label>
                      <p className="font-medium">{selectedBrandOwner.brandDescription || 'No description provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Member Since</Label>
                      <p className="font-medium">{new Date(selectedBrandOwner.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Last Updated</Label>
                      <p className="font-medium">{new Date(selectedBrandOwner.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Business Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedBrandOwner._count?.salons || 0}</p>
                      <p className="text-gray-600">Total Salons</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                        <Calendar className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedBrandOwner._count?.totalBookings || 0}</p>
                      <p className="text-gray-600">Total Bookings</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3">
                        <IndianRupee className="h-8 w-8 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold">₹{selectedBrandOwner._count?.totalEarnings?.toLocaleString() || 0}</p>
                      <p className="text-gray-600">Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Salon Network */}
              {selectedBrandOwner.salons && selectedBrandOwner.salons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Salon Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedBrandOwner.salons.map((salon: any) => (
                        <div key={salon.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{salon.name}</h4>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {salon.address}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{salon.averageRating} ({salon.totalReviews})</span>
                            </div>
                            <Badge variant={salon.isActive ? "default" : "secondary"}>
                              {salon.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Brand Owner Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand Owner</DialogTitle>
            <DialogDescription>Update brand owner status and verification</DialogDescription>
          </DialogHeader>
          
          {selectedBrandOwner && (
            <div className="space-y-4">
              <div>
                <Label>Brand Name</Label>
                <p className="font-medium p-2 bg-gray-50 rounded">{selectedBrandOwner.brandName}</p>
              </div>
              <div>
                <Label>Owner</Label>
                <p className="font-medium p-2 bg-gray-50 rounded">
                  {selectedBrandOwner.firstName} {selectedBrandOwner.lastName}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Account Status</Label>
                <Button
                  variant={selectedBrandOwner.isActive ? "destructive" : "default"}
                  onClick={() => handleUpdateStatus(selectedBrandOwner.id, !selectedBrandOwner.isActive)}
                  disabled={updateBrandOwnerMutation.isPending}
                >
                  {selectedBrandOwner.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Label>Verification Status</Label>
                <Button
                  variant={selectedBrandOwner.isVerified ? "outline" : "default"}
                  onClick={() => handleVerifyBrandOwner(selectedBrandOwner.id, !selectedBrandOwner.isVerified)}
                  disabled={updateBrandOwnerMutation.isPending}
                >
                  {selectedBrandOwner.isVerified ? "Remove Verification" : "Verify Brand"}
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}