import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Plus, Settings, AlertCircle } from "lucide-react";
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

  const handleGenerateSlots = (staffId: string) => {
    if (!staffId) {
      toast({
        title: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    generateSlotsMutation.mutate({
      staffId,
      config: generationConfig
    });
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
                          onClick={() => handleGenerateSlots(member.id)}
                          disabled={generateSlotsMutation.isPending}
                          className="w-full"
                          data-testid={`generate-slots-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {generateSlotsMutation.isPending ? 'Generating...' : `Generate New Slots for ${member.name}`}
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
      </div>
    </div>
  );
}