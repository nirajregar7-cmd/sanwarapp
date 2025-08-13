import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Calendar, Clock, Plus, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Staff {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [isAssigningService, setIsAssigningService] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);


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

  // Generate staff-based slots mutation
  const generateSlotsMutation = useMutation({
    mutationFn: async (date: string) => {
      return apiRequest("POST", `/api/salons/${salon?.id}/generate-staff-slots`, { date });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Slots Generated",
        description: `${result.generated} staff-service slots created for ${selectedDate}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate slots.",
        variant: "destructive",
      });
    },
  });

  // Bulk slot generation mutation
  const generateBulkSlotsMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      return apiRequest("POST", `/api/salons/${salon?.id}/generate-bulk-slots`, { startDate, endDate });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Bulk Slots Generated",
        description: `${result.totalGenerated} slots created from ${startDate} to ${endDate}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Generation Failed",
        description: error.message || "Failed to generate bulk slots.",
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Generate Booking Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Generate booking slots for all your staff members and services automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => generateBulkSlotsMutation.mutate({ startDate, endDate })} 
                  disabled={!startDate || !endDate || generateBulkSlotsMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {generateBulkSlotsMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Slots
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      <img src={staff.photoUrl} alt={staff.name} className="w-12 h-12 rounded-full object-cover" />
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