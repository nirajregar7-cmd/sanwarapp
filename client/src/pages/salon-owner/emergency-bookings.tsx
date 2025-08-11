import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Settings, Plus, CheckCircle, XCircle, Timer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmergencyBookingsPage() {
  const [selectedSalon, setSelectedSalon] = useState<string>("");
  const [newSlotData, setNewSlotData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    extraCharge: "",
    reason: "emergency_demand" as const,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's salons
  const { data: salons } = useQuery({
    queryKey: ["/api/salons/my"],
  });

  // Get emergency waitlist for selected salon
  const { data: waitlist } = useQuery({
    queryKey: ["/api/emergency-booking/salon", selectedSalon],
    enabled: !!selectedSalon,
  });

  // Get emergency configuration for selected salon
  const { data: config } = useQuery({
    queryKey: ["/api/emergency-booking/config", selectedSalon],
    enabled: !!selectedSalon,
  });

  // Get emergency slots for selected salon
  const { data: emergencySlots } = useQuery({
    queryKey: ["/api/emergency-booking/slots", selectedSalon],
    enabled: !!selectedSalon,
  });

  // Update waitlist status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ waitlistId, status }: { waitlistId: string; status: string }) =>
      apiRequest("PUT", `/api/emergency-booking/waitlist/${waitlistId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-booking/salon", selectedSalon] });
      toast({
        title: "Status Updated",
        description: "Emergency booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (configData: any) =>
      apiRequest("PUT", `/api/emergency-booking/config/${selectedSalon}`, configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-booking/config", selectedSalon] });
      toast({
        title: "Configuration Updated",
        description: "Emergency booking settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  // Create emergency slot mutation
  const createSlotMutation = useMutation({
    mutationFn: (slotData: any) =>
      apiRequest("POST", "/api/emergency-booking/slots", {
        ...slotData,
        salonId: selectedSalon,
        extraCharge: parseFloat(slotData.extraCharge),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-booking/slots", selectedSalon] });
      setNewSlotData({
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        extraCharge: "",
        reason: "emergency_demand",
      });
      toast({
        title: "Emergency Slot Created",
        description: "New emergency slot has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create emergency slot",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (waitlistId: string, status: string) => {
    updateStatusMutation.mutate({ waitlistId, status });
  };

  const handleConfigUpdate = (field: string, value: any) => {
    const updatedConfig = { ...config, [field]: value };
    updateConfigMutation.mutate(updatedConfig);
  };

  const handleCreateSlot = () => {
    if (!newSlotData.startTime || !newSlotData.endTime || !newSlotData.extraCharge) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createSlotMutation.mutate(newSlotData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!salons?.length) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Bookings</CardTitle>
            <CardDescription>
              You need to create a salon first to manage emergency bookings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emergency Bookings</h1>
          <p className="text-gray-600">
            Manage same-day urgent booking requests and emergency slots
          </p>
        </div>
      </div>

      {/* Salon Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Salon</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSalon} onValueChange={setSelectedSalon}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Choose a salon" />
            </SelectTrigger>
            <SelectContent>
              {salons.map((salon: any) => (
                <SelectItem key={salon.id} value={salon.id}>
                  {salon.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSalon && (
        <Tabs defaultValue="waitlist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="slots">Emergency Slots</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="waitlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Emergency Booking Requests
                </CardTitle>
                <CardDescription>
                  Manage urgent booking requests from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!waitlist?.length ? (
                  <p className="text-gray-500 text-center py-8">
                    No emergency booking requests at the moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {waitlist.map((request: any) => (
                      <Card key={request.id} className="border-l-4 border-l-orange-400">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">
                                Emergency Request #{request.id.slice(-6)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Requested for {request.preferredDate}
                              </p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <span className="font-medium">Reason:</span>
                              <p className="text-gray-600">{request.emergencyReason}</p>
                            </div>
                            <div>
                              <span className="font-medium">Max Extra Charge:</span>
                              <p className="text-gray-600">₹{request.maxEmergencyCharge}</p>
                            </div>
                            <div>
                              <span className="font-medium">Contact:</span>
                              <p className="text-gray-600">{request.customerPhone}</p>
                            </div>
                            <div>
                              <span className="font-medium">Preferred Time:</span>
                              <p className="text-gray-600">
                                {request.preferredStartTime && request.preferredEndTime
                                  ? `${request.preferredStartTime} - ${request.preferredEndTime}`
                                  : "Flexible"}
                              </p>
                            </div>
                          </div>

                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(request.id, "confirmed")}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(request.id, "cancelled")}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Emergency Slot
                </CardTitle>
                <CardDescription>
                  Add extra time slots for emergency bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSlotData.date}
                      onChange={(e) => setNewSlotData({ ...newSlotData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="extraCharge">Extra Charge (₹)</Label>
                    <Input
                      id="extraCharge"
                      type="number"
                      placeholder="e.g., 500"
                      value={newSlotData.extraCharge}
                      onChange={(e) => setNewSlotData({ ...newSlotData, extraCharge: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newSlotData.startTime}
                      onChange={(e) => setNewSlotData({ ...newSlotData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSlotData.endTime}
                      onChange={(e) => setNewSlotData({ ...newSlotData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Select
                    value={newSlotData.reason}
                    onValueChange={(value: any) => setNewSlotData({ ...newSlotData, reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency_demand">Emergency Demand</SelectItem>
                      <SelectItem value="staff_overtime">Staff Overtime</SelectItem>
                      <SelectItem value="special_request">Special Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateSlot}
                  disabled={createSlotMutation.isPending}
                  className="w-full"
                >
                  {createSlotMutation.isPending ? "Creating..." : "Create Emergency Slot"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Emergency Slots */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Slots</CardTitle>
                <CardDescription>
                  View and manage your emergency time slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!emergencySlots?.length ? (
                  <p className="text-gray-500 text-center py-8">
                    No emergency slots created yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {emergencySlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {slot.date} • {slot.startTime} - {slot.endTime}
                          </p>
                          <p className="text-sm text-gray-600">
                            Extra charge: ₹{slot.extraCharge} • {slot.reason.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant={slot.isBooked ? "default" : "outline"}>
                          {slot.isBooked ? "Booked" : "Available"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Emergency Booking Configuration
                </CardTitle>
                <CardDescription>
                  Configure how emergency bookings work for your salon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Emergency Bookings</Label>
                    <p className="text-sm text-gray-600">
                      Enable customers to request emergency bookings
                    </p>
                  </div>
                  <Switch
                    checked={config?.allowEmergencyBookings ?? true}
                    onCheckedChange={(checked) => handleConfigUpdate("allowEmergencyBookings", checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Emergency Charge Type</Label>
                    <Select
                      value={config?.emergencyChargeType || "percentage"}
                      onValueChange={(value) => handleConfigUpdate("emergencyChargeType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {config?.emergencyChargeType === "fixed_amount" ? "Fixed Amount (₹)" : "Percentage (%)"}
                    </Label>
                    <Input
                      type="number"
                      value={config?.emergencyChargeValue || "50"}
                      onChange={(e) => handleConfigUpdate("emergencyChargeValue", e.target.value)}
                      placeholder={config?.emergencyChargeType === "fixed_amount" ? "500" : "50"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Emergency Bookings Per Day</Label>
                    <Input
                      type="number"
                      value={config?.maxEmergencyBookingsPerDay || 3}
                      onChange={(e) => handleConfigUpdate("maxEmergencyBookingsPerDay", parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label>Time Limit (minutes before appointment)</Label>
                    <Input
                      type="number"
                      value={config?.emergencyBookingTimeLimit || 120}
                      onChange={(e) => handleConfigUpdate("emergencyBookingTimeLimit", parseInt(e.target.value))}
                      min="30"
                      step="30"
                    />
                  </div>
                </div>

                <div>
                  <Label>Emergency Contact Number</Label>
                  <Input
                    type="tel"
                    value={config?.emergencyContactNumber || ""}
                    onChange={(e) => handleConfigUpdate("emergencyContactNumber", e.target.value)}
                    placeholder="Phone number for urgent coordination"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Confirm Emergency Bookings</Label>
                    <p className="text-sm text-gray-600">
                      Automatically confirm requests without manual approval
                    </p>
                  </div>
                  <Switch
                    checked={config?.autoConfirmEmergency ?? false}
                    onCheckedChange={(checked) => handleConfigUpdate("autoConfirmEmergency", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Bookings Outside Operating Hours</Label>
                    <p className="text-sm text-gray-600">
                      Permit emergency slots before/after normal hours
                    </p>
                  </div>
                  <Switch
                    checked={config?.operatingHoursOverride ?? false}
                    onCheckedChange={(checked) => handleConfigUpdate("operatingHoursOverride", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}