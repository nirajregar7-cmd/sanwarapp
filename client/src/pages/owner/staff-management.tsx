import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleAssignService = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsAssigningService(true);
  };

  const handleGenerateSlots = () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date to generate slots.",
        variant: "destructive",
      });
      return;
    }
    generateSlotsMutation.mutate(selectedDate);
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
          <p className="text-gray-600 dark:text-gray-300">
            Assign services to staff and generate intelligent slots
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="slot-date">Generate for:</Label>
            <Input
              id="slot-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button
            onClick={handleGenerateSlots}
            disabled={generateSlotsMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateSlotsMutation.isPending ? "Generating..." : "Generate Slots"}
          </Button>
        </div>
      </div>

      {/* Staff Grid */}
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
                          <p className="font-medium text-sm">{service.serviceName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>₹{service.customPrice || service.servicePrice}</span>
                            <Clock className="w-3 h-3" />
                            <span>{service.estimatedDuration || service.serviceDuration}min</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <Button
                onClick={() => handleAssignService(staff)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Service
              </Button>
            </CardContent>

            {/* Status indicator */}
            <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-lg ${
              staff.isActive ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </Card>
        ))}

        {staffWithServices.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Staff Members</h3>
              <p className="text-gray-500 text-center mb-4">
                You haven't added any staff members yet. Add staff to start managing their services.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Assignment Dialog */}
      <Dialog open={isAssigningService} onOpenChange={setIsAssigningService}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Service to {selectedStaff?.name}</DialogTitle>
          </DialogHeader>

          <ServiceAssignmentForm
            staff={selectedStaff}
            services={allServices}
            onAssign={(data) => assignServiceMutation.mutate(data)}
            isLoading={assignServiceMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceAssignmentForm({ 
  staff, 
  services, 
  onAssign, 
  isLoading 
}: {
  staff: Staff | null;
  services: Service[];
  onAssign: (data: any) => void;
  isLoading: boolean;
}) {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  if (!staff) return null;

  const assignedServiceIds = staff.services.map(s => s.serviceId);
  const availableServices = services.filter(s => !assignedServiceIds.includes(s.id));

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    onAssign({
      staffId: staff.id,
      serviceId: selectedServiceId,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="service">Select Service</Label>
        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a service..." />
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
            <Label htmlFor="custom-price">
              Custom Price (Optional) 
              <span className="text-sm text-gray-500 ml-1">
                Default: ₹{selectedService.price}
              </span>
            </Label>
            <Input
              id="custom-price"
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder={selectedService.price}
            />
          </div>

          <div>
            <Label htmlFor="duration">
              Estimated Duration (minutes) 
              <span className="text-sm text-gray-500 ml-1">
                Default: {selectedService.duration}min
              </span>
            </Label>
            <Input
              id="duration"
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
          onClick={() => setSelectedServiceId("")}
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
  );
}