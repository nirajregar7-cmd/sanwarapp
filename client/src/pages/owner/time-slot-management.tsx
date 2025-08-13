import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { CalendarIcon, Clock, Plus, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Salon } from "@shared/schema";

export default function TimeSlotManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    openingTime: "09:00",
    closingTime: "18:00",
    slotDuration: "30", // 30 minutes
    breakTime: "13:00-14:00", // 1 hour lunch break
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get salon info
  const { data: salon } = useQuery<Salon>({
    queryKey: ['/api/owner/salon']
  });

  // Get staff members
  const { data: staff = [] } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/staff`],
    enabled: !!salon?.id,
  });

  // Get services
  const { data: services = [] } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/services`],
    enabled: !!salon?.id,
  });

  // Get time slots for selected date
  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: [`/api/salons/${salon?.id}/time-slots`, selectedDate],
    enabled: !!salon?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salon?.id}/time-slots?date=${format(selectedDate, "yyyy-MM-dd")}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Generate bulk time slots based on your design
  const generateBulkSlotsMutation = useMutation({
    mutationFn: async () => {
      if (selectedStaff.length === 0) {
        throw new Error("Please select at least one staff member");
      }

      const slotsToCreate = [];
      const currentDate = new Date(bulkConfig.startDate);
      const endDate = new Date(bulkConfig.endDate);

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        
        // Generate slots for each selected staff member
        for (const staffId of selectedStaff) {
          // Generate time slots based on opening/closing times
          const startHour = parseInt(bulkConfig.openingTime.split(':')[0]);
          const startMin = parseInt(bulkConfig.openingTime.split(':')[1]);
          const endHour = parseInt(bulkConfig.closingTime.split(':')[0]);
          const endMin = parseInt(bulkConfig.closingTime.split(':')[1]);

          let currentTime = new Date();
          currentTime.setHours(startHour, startMin, 0, 0);
          
          const endTime = new Date();
          endTime.setHours(endHour, endMin, 0, 0);

          const slotDurationMs = parseInt(bulkConfig.slotDuration) * 60 * 1000;
          const breakStart = new Date();
          breakStart.setHours(13, 0, 0, 0); // 1:00 PM
          const breakEnd = new Date();
          breakEnd.setHours(14, 0, 0, 0); // 2:00 PM

          while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + slotDurationMs);
            
            // Skip break time
            if (!(currentTime >= breakStart && currentTime < breakEnd)) {
              slotsToCreate.push({
                salonId: salon?.id,
                staffId,
                serviceId: selectedService || null,
                date: dateStr,
                startTime: format(currentTime, "HH:mm"),
                endTime: format(slotEnd, "HH:mm"),
                isAvailable: true,
                slotType: "regular"
              });
            }
            
            currentTime = slotEnd;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return await apiRequest("POST", `/api/salons/${salon?.id}/time-slots/bulk-generate`, {
        slots: slotsToCreate
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      setBulkDialogOpen(false);
      
      toast({
        title: "Time Slots Generated!",
        description: `Successfully created time slots for ${selectedStaff.length} staff members`,
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

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const selectAllStaff = () => {
    setSelectedStaff(staff.map((s: any) => s.id));
  };

  const clearStaffSelection = () => {
    setSelectedStaff([]);
  };

  return (
    <div className="space-y-6" data-testid="time-slot-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Slot Management</h1>
          <p className="text-muted-foreground">Create and manage appointment slots for your staff</p>
        </div>
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-bulk-generate">
              <Zap className="w-4 h-4" />
              Bulk Generate Slots
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Generate Time Slots</DialogTitle>
              <DialogDescription>
                Generate time slots for multiple staff members at once
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Staff Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Staff Members</Label>
                <div className="flex gap-2 mb-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllStaff}
                    data-testid="button-select-all-staff"
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={clearStaffSelection}
                    data-testid="button-clear-staff"
                  >
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {staff.map((member: any) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`staff-${member.id}`}
                        checked={selectedStaff.includes(member.id)}
                        onCheckedChange={() => toggleStaffSelection(member.id)}
                        data-testid={`checkbox-staff-${member.name}`}
                      />
                      <Label htmlFor={`staff-${member.id}`} className="text-sm">
                        {member.name} ({member.role})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <Label htmlFor="service-select">Service (Optional)</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger data-testid="select-service">
                    <SelectValue placeholder="Select a service (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Services</SelectItem>
                    {services.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ₹{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={bulkConfig.startDate}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={bulkConfig.endDate}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening-time">Opening Time</Label>
                  <Input
                    id="opening-time"
                    type="time"
                    value={bulkConfig.openingTime}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, openingTime: e.target.value })}
                    data-testid="input-opening-time"
                  />
                </div>
                <div>
                  <Label htmlFor="closing-time">Closing Time</Label>
                  <Input
                    id="closing-time"
                    type="time"
                    value={bulkConfig.closingTime}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, closingTime: e.target.value })}
                    data-testid="input-closing-time"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
                <Select 
                  value={bulkConfig.slotDuration} 
                  onValueChange={(value) => setBulkConfig({ ...bulkConfig, slotDuration: value })}
                >
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => generateBulkSlotsMutation.mutate()}
                disabled={generateBulkSlotsMutation.isPending || selectedStaff.length === 0}
                className="w-full"
                data-testid="button-generate-slots"
              >
                {generateBulkSlotsMutation.isPending ? "Generating..." : "Generate Time Slots"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              data-testid="calendar-date-select"
            />
          </CardContent>
        </Card>

        {/* Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.map((member: any) => (
                <div 
                  key={member.id} 
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedStaff.includes(member.id) 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  data-testid={`staff-card-${member.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant={selectedStaff.includes(member.id) ? "default" : "secondary"}>
                      {selectedStaff.includes(member.id) ? "Selected" : "Available"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Slots for {format(selectedDate, "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading slots...</div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No time slots created for this date
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot: any) => (
                  <div 
                    key={slot.id} 
                    className="p-2 rounded border"
                    data-testid={`time-slot-${slot.startTime}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.staffName} | {slot.serviceName || "Any Service"}
                        </p>
                      </div>
                      <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                        {slot.isAvailable ? "Available" : "Booked"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}