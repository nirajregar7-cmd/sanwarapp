import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Settings, Plus, Edit, Trash2 } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  defaultSlotDuration: number;
  canManageSchedule: boolean;
}

interface WorkingHours {
  id?: string;
  staffId: string;
  dayOfWeek: number;
  isAvailable: boolean;
  shift1StartTime?: string;
  shift1EndTime?: string;
  shift2StartTime?: string;
  shift2EndTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  breakDuration: number;
  slotDuration: number;
}

interface StaffService {
  id?: string;
  staffId: string;
  serviceId: string;
  isActive: boolean;
  customPrice?: number;
  estimatedDuration?: number;
  serviceName?: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffSchedulePage() {
  const { toast } = useToast();
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('schedule');

  // Fetch staff members
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/owner/staff'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/owner/staff');
      return response.json();
    },
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['/api/owner/services'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/owner/services');
      return response.json();
    },
  });

  // Fetch working hours for selected staff
  const { data: workingHours = [], isLoading: hoursLoading } = useQuery({
    queryKey: ['/api/staff-working-hours', selectedStaffId],
    queryFn: async () => {
      if (!selectedStaffId) return [];
      const response = await apiRequest('GET', `/api/staff/${selectedStaffId}/working-hours`);
      return response.json();
    },
    enabled: !!selectedStaffId,
  });

  // Fetch staff services
  const { data: staffServices = [] } = useQuery({
    queryKey: ['/api/staff-services', selectedStaffId],
    queryFn: async () => {
      if (!selectedStaffId) return [];
      const response = await apiRequest('GET', `/api/staff/${selectedStaffId}/services`);
      return response.json();
    },
    enabled: !!selectedStaffId,
  });

  // Working hours mutation
  const workingHoursMutation = useMutation({
    mutationFn: async (data: WorkingHours) => {
      const endpoint = data.id 
        ? `/api/staff-working-hours/${data.id}` 
        : '/api/staff-working-hours';
      const method = data.id ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-working-hours', selectedStaffId] });
      toast({
        title: "Working Hours Updated",
        description: "Staff working hours have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Staff services mutation
  const staffServiceMutation = useMutation({
    mutationFn: async (data: StaffService) => {
      const endpoint = data.id 
        ? `/api/staff-services/${data.id}` 
        : '/api/staff-services';
      const method = data.id ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-services', selectedStaffId] });
      toast({
        title: "Services Updated",
        description: "Staff services have been updated successfully.",
      });
    },
  });

  const selectedStaff = staff.find((s: StaffMember) => s.id === selectedStaffId);

  const WorkingHoursForm = ({ dayOfWeek, existingHours }: { dayOfWeek: number; existingHours?: WorkingHours }) => {
    const [isAvailable, setIsAvailable] = useState(existingHours?.isAvailable ?? true);
    const [shift1Start, setShift1Start] = useState(existingHours?.shift1StartTime ?? '09:00');
    const [shift1End, setShift1End] = useState(existingHours?.shift1EndTime ?? '18:00');
    const [shift2Start, setShift2Start] = useState(existingHours?.shift2StartTime ?? '');
    const [shift2End, setShift2End] = useState(existingHours?.shift2EndTime ?? '');
    const [breakStart, setBreakStart] = useState(existingHours?.breakStartTime ?? '13:00');
    const [breakEnd, setBreakEnd] = useState(existingHours?.breakEndTime ?? '14:00');
    const [slotDuration, setSlotDuration] = useState(existingHours?.slotDuration ?? selectedStaff?.defaultSlotDuration ?? 30);

    const handleSave = () => {
      const data: WorkingHours = {
        id: existingHours?.id,
        staffId: selectedStaffId,
        dayOfWeek,
        isAvailable,
        shift1StartTime: isAvailable ? shift1Start : undefined,
        shift1EndTime: isAvailable ? shift1End : undefined,
        shift2StartTime: shift2Start || undefined,
        shift2EndTime: shift2End || undefined,
        breakStartTime: breakStart || undefined,
        breakEndTime: breakEnd || undefined,
        breakDuration: breakStart && breakEnd ? 
          (new Date(`1970-01-01T${breakEnd}:00`).getTime() - new Date(`1970-01-01T${breakStart}:00`).getTime()) / (1000 * 60) : 0,
        slotDuration,
      };
      
      workingHoursMutation.mutate(data);
    };

    return (
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>{dayNames[dayOfWeek]}</span>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
              <span className="text-sm text-gray-600">Available</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        {isAvailable && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`shift1-start-${dayOfWeek}`}>Shift 1 Start</Label>
                <Input
                  id={`shift1-start-${dayOfWeek}`}
                  type="time"
                  value={shift1Start}
                  onChange={(e) => setShift1Start(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`shift1-end-${dayOfWeek}`}>Shift 1 End</Label>
                <Input
                  id={`shift1-end-${dayOfWeek}`}
                  type="time"
                  value={shift1End}
                  onChange={(e) => setShift1End(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`shift2-start-${dayOfWeek}`}>Shift 2 Start (Optional)</Label>
                <Input
                  id={`shift2-start-${dayOfWeek}`}
                  type="time"
                  value={shift2Start}
                  onChange={(e) => setShift2Start(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`shift2-end-${dayOfWeek}`}>Shift 2 End (Optional)</Label>
                <Input
                  id={`shift2-end-${dayOfWeek}`}
                  type="time"
                  value={shift2End}
                  onChange={(e) => setShift2End(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`break-start-${dayOfWeek}`}>Break Start</Label>
                <Input
                  id={`break-start-${dayOfWeek}`}
                  type="time"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`break-end-${dayOfWeek}`}>Break End</Label>
                <Input
                  id={`break-end-${dayOfWeek}`}
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`slot-duration-${dayOfWeek}`}>Slot Duration (min)</Label>
                <Select value={slotDuration.toString()} onValueChange={(value) => setSlotDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleSave} disabled={workingHoursMutation.isPending}>
              {workingHoursMutation.isPending ? 'Saving...' : 'Save Schedule'}
            </Button>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Schedule Management</h1>
        <p className="text-gray-600 mt-2">
          Configure individual working hours and service assignments for each staff member
        </p>
      </div>

      {/* Staff Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a staff member to manage their schedule..." />
            </SelectTrigger>
            <SelectContent>
              {staff.map((member: StaffMember) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{member.name}</span>
                    <Badge variant="outline" className="ml-2">{member.role}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStaffId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Working Hours
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Holidays
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {dayNames.map((_, dayIndex) => {
                const existingHours = workingHours.find((wh: WorkingHours) => wh.dayOfWeek === dayIndex);
                return (
                  <WorkingHoursForm
                    key={dayIndex}
                    dayOfWeek={dayIndex}
                    existingHours={existingHours}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Assignments</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure which services this staff member can perform and set custom pricing or duration.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service: any) => {
                    const staffService = staffServices.find((ss: StaffService) => ss.serviceId === service.id);
                    const isAssigned = !!staffService;
                    
                    return (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-gray-600">
                            Default: ₹{service.price} • {service.duration} minutes
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          {isAssigned && (
                            <div className="text-right text-sm">
                              <div>₹{staffService.customPrice || service.price}</div>
                              <div className="text-gray-500">
                                {staffService.estimatedDuration || service.duration} min
                              </div>
                            </div>
                          )}
                          <Switch
                            checked={isAssigned}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                staffServiceMutation.mutate({
                                  staffId: selectedStaffId,
                                  serviceId: service.id,
                                  isActive: true,
                                });
                              } else if (staffService) {
                                // Handle removal
                                staffServiceMutation.mutate({
                                  ...staffService,
                                  isActive: false,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Holiday Management</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage holidays, sick days, and time off for this staff member.
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Holiday management feature coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}