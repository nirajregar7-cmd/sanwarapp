import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Calendar, Clock, Plus, Sparkles, Edit, Upload, Camera, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Staff {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  experience?: string;
  specialties?: string[];
  bio?: string;
  rating: number;
  isActive: boolean;
  services: StaffService[];
}

interface StaffService {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: string;
  serviceDuration: number;
  customPrice?: string;
  estimatedDuration?: number;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  price: string;
  duration: number;
}

export default function StaffManagement() {
  const { toast } = useToast();
  const [isAssigningService, setIsAssigningService] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);


  // Get current salon
  const { data: salon } = useQuery({
    queryKey: ["/api/owner/salon"],
  }) as { data: any };

  // Get staff with their service assignments
  const { data: staffWithServices = [], refetch: refetchStaff } = useQuery({
    queryKey: [`/api/salons/${salon?.id}/staff-with-services`],
    enabled: !!salon?.id,
  }) as { data: Staff[]; refetch: any };

  // Get all salon services for assignment
  const { data: allServices = [] } = useQuery({
    queryKey: [`/api/salons/${salon?.id}/services`],
    enabled: !!salon?.id,
  }) as { data: Service[] };

  // Assign service to staff mutation
  const assignServiceMutation = useMutation({
    mutationFn: async ({ staffId, serviceId, customPrice, estimatedDuration }: {
      staffId: string;
      serviceId: string;
      customPrice?: number;
      estimatedDuration?: number;
    }) => {
      return apiRequest("POST", `/api/salons/${salon?.id}/staff/${staffId}/assign-service`, {
        serviceId,
        customPrice,
        estimatedDuration
      });
    },
    onSuccess: () => {
      toast({
        title: "Service Assigned",
        description: "Service has been successfully assigned to staff member.",
      });
      refetchStaff();
      setIsAssigningService(false);
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign service to staff.",
        variant: "destructive",
      });
    },
  });



  // Individual staff slot generation mutation
  const generateStaffSlotsMutation = useMutation({
    mutationFn: async ({ staffId, date, openingTime, closingTime, breakDuration }: {
      staffId: string;
      date: string;
      openingTime: string;
      closingTime: string;
      breakDuration: number;
    }) => {
      return apiRequest("POST", `/api/salons/${salon?.id}/generate-dynamic-staff-slots`, {
        staffId,
        date,
        openingTime,
        closingTime,
        breakDuration
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Dynamic Slots Generated",
        description: `${result.generated} service-based slots created for ${result.staffName}`,
      });
      setSelectedStaffForSlots("");
    },
    onError: (error: any) => {
      toast({
        title: "Dynamic Generation Failed",
        description: error.message || "Failed to generate dynamic staff slots.",
        variant: "destructive",
      });
    },
  });

  const handleAssignService = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsAssigningService(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setIsEditingStaff(true);
  };

  // Edit staff mutation
  const editStaffMutation = useMutation({
    mutationFn: async (data: { staffId: string; updates: any }) => {
      return apiRequest("PUT", `/api/staff/${data.staffId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Staff Updated",
        description: "Staff member information has been successfully updated.",
      });
      refetchStaff();
      setIsEditingStaff(false);
      setEditingStaff(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update staff member.",
        variant: "destructive",
      });
    },
  });



  if (!salon) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Assign services to staff and generate intelligent slots
          </p>
        </div>
      </div>

      {/* Simple Slot Generation Section */}


      {/* Staff Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Team Members</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staffWithServices.map((staff: Staff) => (
            <Card key={staff.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {staff.photoUrl ? (
                      <img 
                        src={staff.photoUrl.startsWith('/objects/') ? staff.photoUrl : `/objects/uploads/${staff.photoUrl}`} 
                        alt={staff.name} 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                    ) : (
                      <Users className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{staff.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{staff.role}</Badge>
                      <Badge variant={staff.isActive ? "default" : "secondary"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Assigned Services */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Services ({staff.services.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {staff.services.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No services assigned</p>
                    ) : (
                      staff.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{service.serviceName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              ₹{service.customPrice || service.servicePrice} • {service.estimatedDuration || service.serviceDuration}min
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditStaff(staff)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleAssignService(staff)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Assign Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        staff={selectedStaff}
        services={allServices}
        isOpen={isAssigningService}
        onClose={() => setIsAssigningService(false)}
        onAssign={assignServiceMutation.mutate}
        isLoading={assignServiceMutation.isPending}
      />

      {/* Edit Staff Dialog */}
      <EditStaffDialog
        staff={editingStaff}
        isOpen={isEditingStaff}
        onClose={() => setIsEditingStaff(false)}
        onUpdate={(updates) => editStaffMutation.mutate({ staffId: editingStaff!.id, updates })}
        isLoading={editStaffMutation.isPending}
      />
    </div>
  );
}

interface ServiceAssignmentDialogProps {
  staff: Staff | null;
  services: Service[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: any) => void;
  isLoading: boolean;
}

function ServiceAssignmentDialog({
  staff,
  services,
  isOpen,
  onClose,
  onAssign,
  isLoading,
}: ServiceAssignmentDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  const selectedService = services.find(s => s.id === selectedServiceId);
  const availableServices = services.filter(
    service => !staff?.services.some(s => s.serviceId === service.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || !selectedServiceId) return;

    onAssign({
      staffId: staff.id,
      serviceId: selectedServiceId,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
    });
    
    setSelectedServiceId("");
    setCustomPrice("");
    setEstimatedDuration("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Service to {staff?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Service</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ₹{service.price} ({service.duration}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <>
              <div>
                <Label htmlFor="customPrice">
                  Custom Price (optional)
                  <span className="text-sm text-gray-500 ml-2">Default: ₹{selectedService.price}</span>
                </Label>
                <Input
                  id="customPrice"
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={selectedService.price}
                />
              </div>

              <div>
                <Label htmlFor="estimatedDuration">
                  Estimated Duration (minutes)
                  <span className="text-sm text-gray-500 ml-2">Default: {selectedService.duration}min</span>
                </Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder={selectedService.duration.toString()}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedServiceId || isLoading}
              className="flex-1"
            >
              {isLoading ? "Assigning..." : "Assign Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditStaffDialogProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: any) => void;
  isLoading: boolean;
}

function EditStaffDialog({
  staff,
  isOpen,
  onClose,
  onUpdate,
  isLoading,
}: EditStaffDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    photoUrl: "",
    experience: "",
    specialties: "",
    bio: "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Update form data when staff changes
  React.useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        role: staff.role || "",
        phone: staff.phone || "",
        email: staff.email || "",
        photoUrl: staff.photoUrl || "",
        experience: staff.experience || "",
        specialties: staff.specialties ? staff.specialties.join(", ") : "",
        bio: staff.bio || "",
      });
      setPreviewPhoto(staff.photoUrl || null);
    }
  }, [staff]);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      // Handle different possible response formats
      let imageUrl = result.url || result.path || result.filename;
      
      // Convert to proper /objects/ path format if needed
      if (imageUrl && !imageUrl.startsWith('/objects/')) {
        // If it's just a filename, add the full path
        if (!imageUrl.includes('/')) {
          imageUrl = `/objects/uploads/${imageUrl}`;
        } else if (imageUrl.startsWith('uploads/')) {
          imageUrl = `/objects/${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `/objects/uploads/${imageUrl}`;
        }
      }
      
      console.log('Final image URL:', imageUrl);
      
      setFormData(prev => ({ ...prev, photoUrl: imageUrl }));
      setPreviewPhoto(imageUrl);
      
      toast({
        title: "Photo Uploaded",
        description: "Staff photo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed", 
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    const updates = {
      ...formData,
      specialties: formData.specialties.split(",").map(s => s.trim()).filter(s => s.length > 0),
    };

    onUpdate(updates);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <p className="text-sm text-gray-600">Update staff member information</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                placeholder="Hair Stylist, Moustache and Beard, Facial"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="experience">Experience</Label>
            <Input
              id="experience"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              placeholder="e.g., 5+ years, Senior Stylist"
            />
          </div>

          <div>
            <Label htmlFor="specialties">Specialties</Label>
            <Input
              id="specialties"
              value={formData.specialties}
              onChange={(e) => handleInputChange("specialties", e.target.value)}
              placeholder="Hair Stylist, Moustache and Beard, Facial (comma-separated)"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Short description about the staff member"
            />
          </div>

          <div>
            <Label>Profile Picture</Label>
            <div className="space-y-4">
              {/* Current Photo Preview */}
              {previewPhoto && (
                <div className="flex items-center space-x-4">
                  <img 
                    src={previewPhoto} 
                    alt="Staff preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewPhoto(null);
                      setFormData(prev => ({ ...prev, photoUrl: "" }));
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove Photo
                  </Button>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="photo-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingPhoto ? (
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Updating..." : "Update Staff"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}