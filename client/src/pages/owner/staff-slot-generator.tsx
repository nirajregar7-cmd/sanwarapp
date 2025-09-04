import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Plus, Settings, AlertCircle, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { format, addDays } from "date-fns";
import type { Salon, Staff, TimeSlot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const slotDurations = [
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];

interface StaffSlotGenerationConfig {
  staffId: string;
  startDate: string;
  endDate: string;
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  breakStartTime: string;
  breakEndTime: string;
}

export default function StaffSlotGenerator() {
  const queryClient = useQueryClient();
  const [generationConfig, setGenerationConfig] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    openingTime: "09:00",
    closingTime: "18:00",
    slotDuration: 30,
    breakStartTime: "13:00",
    breakEndTime: "14:00"
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isSlotConfigOpen, setIsSlotConfigOpen] = useState(false);
  const [staffConfig, setStaffConfig] = useState<Record<string, typeof generationConfig>>({});
  const [generatedSlots, setGeneratedSlots] = useState<Record<string, any[]>>({});

  // Get salon info
  const { data: salon } = useQuery<Salon>({
    queryKey: ['/api/owner/salon']
  });

  // Get staff members
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salon?.id}/staff`],
    enabled: !!salon?.id,
  });

  // Get slot counts for each staff member
  const { data: slotCounts = {}, refetch: refetchSlotCounts } = useQuery<Record<string, number>>({
    queryKey: [`/api/salons/${salon?.id}/staff-slot-counts`],
    enabled: !!salon?.id,
  });

  // Generate slots for individual staff member
  const generateSlotsMutation = useMutation({
    mutationFn: async ({ staffId, config }: { staffId: string; config: Omit<StaffSlotGenerationConfig, 'staffId'> }) => {
      const response = await fetch(`/api/salons/${salon?.id}/staff/${staffId}/generate-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate slots');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const staffMember = staff.find(s => s.id === variables.staffId);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      refetchSlotCounts(); // Refresh slot counts
      toast({
        title: "Time slots generated successfully!",
        description: `Generated ${data.count} slots for ${staffMember?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating time slots",
        description: error.message || "Failed to generate time slots",
        variant: "destructive",
      });
    },
  });

  // Delete slots for individual staff member
  const deleteSlotsMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await fetch(`/api/salons/${salon?.id}/staff/${staffId}/delete-slots`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete slots');
      }
      
      return response.json();
    },
    onSuccess: (data, staffId) => {
      const staffMember = staff.find(s => s.id === staffId);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      refetchSlotCounts(); // Refresh slot counts
      toast({
        title: "Time slots deleted successfully!",
        description: `Deleted all slots for ${staffMember?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting time slots",
        description: error.message || "Failed to delete time slots",
        variant: "destructive",
      });
    },
  });

  const handleOpenSlotConfig = (staffId: string) => {
    setSelectedStaffId(staffId);
    // Initialize staff config with default values if not exists
    if (!staffConfig[staffId]) {
      setStaffConfig(prev => ({
        ...prev,
        [staffId]: { ...generationConfig }
      }));
    }
    setIsSlotConfigOpen(true);
  };

  const handleGenerateSlots = (staffId: string, config: typeof generationConfig) => {
    if (!staffId) {
      toast({
        title: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    generateSlotsMutation.mutate({
      staffId,
      config
    });

    // Close the dialog
    setIsSlotConfigOpen(false);
  };

  const handleDeleteSlots = (staffId: string) => {
    if (!staffId) {
      toast({
        title: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    deleteSlotsMutation.mutate(staffId);
    
    // Close the dialog
    setIsSlotConfigOpen(false);
  };

  const getCurrentStaffConfig = (staffId: string) => {
    return staffConfig[staffId] || generationConfig;
  };

  const updateStaffConfig = (staffId: string, updates: Partial<typeof generationConfig>) => {
    setStaffConfig(prev => ({
      ...prev,
      [staffId]: {
        ...getCurrentStaffConfig(staffId),
        ...updates
      }
    }));
  };

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Time Slot Generator</h1>
            <p className="text-gray-600 mt-1">Generate time slots for individual staff members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Slot Configuration
                </CardTitle>
                <CardDescription>
                  Set up the date range and timing for slot generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={generationConfig.startDate}
                      onChange={(e) => setGenerationConfig({
                        ...generationConfig,
                        startDate: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={generationConfig.endDate}
                      onChange={(e) => setGenerationConfig({
                        ...generationConfig,
                        endDate: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openingTime">Opening Time</Label>
                    <Input
                      id="openingTime"
                      type="time"
                      value={generationConfig.openingTime}
                      onChange={(e) => setGenerationConfig({
                        ...generationConfig,
                        openingTime: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="closingTime">Closing Time</Label>
                    <Input
                      id="closingTime"
                      type="time"
                      value={generationConfig.closingTime}
                      onChange={(e) => setGenerationConfig({
                        ...generationConfig,
                        closingTime: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="slotDuration">Slot Duration</Label>
                  <Select 
                    value={generationConfig.slotDuration.toString()}
                    onValueChange={(value) => setGenerationConfig({
                      ...generationConfig,
                      slotDuration: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotDurations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Break Time Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="breakStart">Break Start</Label>
                      <Input
                        id="breakStart"
                        type="time"
                        value={generationConfig.breakStartTime}
                        onChange={(e) => setGenerationConfig({
                          ...generationConfig,
                          breakStartTime: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakEnd">Break End</Label>
                      <Input
                        id="breakEnd"
                        type="time"
                        value={generationConfig.breakEndTime}
                        onChange={(e) => setGenerationConfig({
                          ...generationConfig,
                          breakEndTime: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Lunch break ({generationConfig.breakStartTime} - {generationConfig.breakEndTime}) will be automatically excluded from generated slots.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Members Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate time slots for multiple staff members at once</CardTitle>
                <CardDescription>
                  Select staff members and generate individual time slots for each
                </CardDescription>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : staff.length > 0 ? (
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.photoUrl ? (
                                <img 
                                  src={member.photoUrl.startsWith('/objects/') ? member.photoUrl : `/objects/uploads/${member.photoUrl}`} 
                                  alt={member.name} 
                                  className="w-12 h-12 rounded-full object-cover" 
                                />
                              ) : (
                                member.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {slotCounts[member.id] || 0} available slots
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              {member.phone && (
                                <p className="text-xs text-gray-500">{member.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Current Status:</strong> {slotCounts[member.id] || 0} slots available for booking
                          </p>
                          <p className="text-xs text-gray-600">
                            Customers can see and book these slots when selecting "{member.name}"
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => handleOpenSlotConfig(member.id)}
                          disabled={generateSlotsMutation.isPending}
                          className="w-full"
                          data-testid={`generate-slots-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {generateSlotsMutation.isPending ? 'Generating...' : `Configure Slots for ${member.name}`}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Members</h3>
                    <p className="text-gray-600 mb-4">
                      Add staff members to your salon to generate individual time slots for them.
                    </p>
                    <Button onClick={() => window.location.href = '/owner/dashboard'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Members
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">How it works:</h4>
                    <ul className="mt-2 text-sm text-blue-800 space-y-1">
                      <li>• Each staff member will get their own individual time slots</li>
                      <li>• Customers can select staff members when booking</li>
                      <li>• Break times are automatically excluded from slot generation</li>
                      <li>• You can customize slot duration for different services</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Individual Staff Slot Configuration Dialog */}
        <Dialog open={isSlotConfigOpen} onOpenChange={setIsSlotConfigOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Configure Time Slots for {staff.find(s => s.id === selectedStaffId)?.name}
              </DialogTitle>
              <DialogDescription>
                Set custom working hours, break times, and slot duration for this staff member.
                You can see all generated slots below before confirming.
              </DialogDescription>
            </DialogHeader>

            {selectedStaffId && (
              <div className="space-y-6">
                {/* Configuration Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={getCurrentStaffConfig(selectedStaffId).startDate}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={getCurrentStaffConfig(selectedStaffId).endDate}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { endDate: e.target.value })}
                    />
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-2">
                    <Label>Opening Time</Label>
                    <Input
                      type="time"
                      value={getCurrentStaffConfig(selectedStaffId).openingTime}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { openingTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Time</Label>
                    <Input
                      type="time"
                      value={getCurrentStaffConfig(selectedStaffId).closingTime}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { closingTime: e.target.value })}
                    />
                  </div>

                  {/* Break Time */}
                  <div className="space-y-2">
                    <Label>Break Start Time</Label>
                    <Input
                      type="time"
                      value={getCurrentStaffConfig(selectedStaffId).breakStartTime}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { breakStartTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Break End Time</Label>
                    <Input
                      type="time"
                      value={getCurrentStaffConfig(selectedStaffId).breakEndTime}
                      onChange={(e) => updateStaffConfig(selectedStaffId, { breakEndTime: e.target.value })}
                    />
                  </div>

                  {/* Slot Duration */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Slot Duration</Label>
                    <Select
                      value={getCurrentStaffConfig(selectedStaffId).slotDuration.toString()}
                      onValueChange={(value) => updateStaffConfig(selectedStaffId, { slotDuration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {slotDurations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value}>
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Slot Preview
                    </h4>
                    <Badge variant="secondary">
                      {(() => {
                        const config = getCurrentStaffConfig(selectedStaffId);
                        const startTime = config.openingTime;
                        const endTime = config.closingTime;
                        const breakStart = config.breakStartTime;
                        const breakEnd = config.breakEndTime;
                        const duration = config.slotDuration;
                        
                        // Calculate slots per day
                        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
                        const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
                        const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
                        const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);
                        
                        const workingMinutes = (endMinutes - startMinutes) - (breakEndMinutes - breakStartMinutes);
                        const slotsPerDay = Math.floor(workingMinutes / duration);
                        
                        const startDate = new Date(config.startDate);
                        const endDate = new Date(config.endDate);
                        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
                        
                        return `~${slotsPerDay * days} total slots`;
                      })()}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm space-y-1">
                      <p><strong>Daily Schedule:</strong> {getCurrentStaffConfig(selectedStaffId).openingTime} - {getCurrentStaffConfig(selectedStaffId).closingTime}</p>
                      <p><strong>Break Time:</strong> {getCurrentStaffConfig(selectedStaffId).breakStartTime} - {getCurrentStaffConfig(selectedStaffId).breakEndTime}</p>
                      <p><strong>Slot Duration:</strong> {getCurrentStaffConfig(selectedStaffId).slotDuration} minutes</p>
                    </div>
                  </div>
                  
                  {/* Sample slots for today */}
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {(() => {
                      const config = getCurrentStaffConfig(selectedStaffId);
                      const startTime = config.openingTime;
                      const breakStart = config.breakStartTime;
                      const breakEnd = config.breakEndTime;
                      const endTime = config.closingTime;
                      const duration = config.slotDuration;
                      
                      const slots = [];
                      let currentMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
                      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
                      const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
                      const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);
                      
                      while (currentMinutes + duration <= endMinutes) {
                        // Skip break time
                        if (!(currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes)) {
                          const hours = Math.floor(currentMinutes / 60);
                          const mins = currentMinutes % 60;
                          const endHours = Math.floor((currentMinutes + duration) / 60);
                          const endMins = (currentMinutes + duration) % 60;
                          
                          slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}-${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
                        }
                        currentMinutes += duration;
                        
                        // Skip over break time
                        if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
                          currentMinutes = breakEndMinutes;
                        }
                      }
                      
                      return slots.slice(0, 18).map((slot, index) => (
                        <div key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded text-center">
                          {slot}
                        </div>
                      ));
                    })()}
                  </div>
                  {(() => {
                    const config = getCurrentStaffConfig(selectedStaffId);
                    const startTime = config.openingTime;
                    const breakStart = config.breakStartTime;
                    const breakEnd = config.breakEndTime;
                    const endTime = config.closingTime;
                    const duration = config.slotDuration;
                    
                    let currentMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
                    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
                    const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
                    const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);
                    
                    let slotCount = 0;
                    while (currentMinutes + duration <= endMinutes) {
                      if (!(currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes)) {
                        slotCount++;
                      }
                      currentMinutes += duration;
                      
                      if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
                        currentMinutes = breakEndMinutes;
                      }
                    }
                    
                    return slotCount > 18 ? (
                      <p className="text-xs text-gray-500 mt-2">... and {slotCount - 18} more slots per day</p>
                    ) : null;
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsSlotConfigOpen(false)}
                    >
                      Cancel
                    </Button>
                    {/* Show Delete button only if staff has existing slots */}
                    {slotCounts[selectedStaffId] > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteSlots(selectedStaffId)}
                        disabled={deleteSlotsMutation.isPending}
                        data-testid="button-delete-slots"
                      >
                        {deleteSlotsMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Slots
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleGenerateSlots(selectedStaffId, getCurrentStaffConfig(selectedStaffId))}
                    disabled={generateSlotsMutation.isPending}
                    data-testid="button-generate-slots"
                  >
                    {generateSlotsMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Generate Slots
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}