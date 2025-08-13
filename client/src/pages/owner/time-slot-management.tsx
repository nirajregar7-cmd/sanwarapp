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
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    openingTime: "09:00",
    closingTime: "18:00",
    slotDuration: "30", // 30 minutes
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

  // Generate time slots for individual staff member
  const generateStaffSlotsMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (!staffId) {
        throw new Error("Please select a staff member");
      }

      const slotsToCreate = [];
      const currentDate = new Date(bulkConfig.startDate);
      const endDate = new Date(bulkConfig.endDate);

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        
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
          
          // Skip break time (1:00-2:00 PM)
          if (!(currentTime >= breakStart && currentTime < breakEnd)) {
            slotsToCreate.push({
              salonId: salon?.id,
              staffId,
              serviceId: null, // No specific service
              date: dateStr,
              startTime: format(currentTime, "HH:mm"),
              endTime: format(slotEnd, "HH:mm"),
              isAvailable: true,
              slotType: "regular"
            });
          }
          
          currentTime = slotEnd;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Creating ${slotsToCreate.length} slots for staff ${staffId}`);
      
      // Send smaller batch to avoid PayloadTooLarge error
      const response = await apiRequest("POST", `/api/salons/${salon?.id}/time-slots/bulk-generate`, {
        slots: slotsToCreate
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate slots");
      }
      
      return response.json();
    },
    onSuccess: (data, staffId) => {
      const staffMember = staff.find((s: any) => s.id === staffId);
      toast({
        title: "Success!",
        description: `Generated ${data.created} slots for ${staffMember?.name}. ${data.skipped} slots already existed.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      setBulkDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group time slots by staff
  const slotsByStaff = timeSlots.reduce((acc: any, slot: any) => {
    if (!acc[slot.staffId]) {
      acc[slot.staffId] = [];
    }
    acc[slot.staffId].push(slot);
    return acc;
  }, {});

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
                <div className="grid grid-cols-1 gap-3">
                  {staff.map((member: any) => (
                    <Card key={member.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.specialty}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateStaffSlotsMutation.mutate(member.id)}
                          disabled={generateStaffSlotsMutation.isPending}
                          data-testid={`button-generate-${member.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {generateStaffSlotsMutation.isPending ? "Generating..." : "Generate Slots"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={bulkConfig.startDate}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, startDate: e.target.value }))}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={bulkConfig.endDate}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, endDate: e.target.value }))}
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
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, openingTime: e.target.value }))}
                    data-testid="input-opening-time"
                  />
                </div>
                <div>
                  <Label htmlFor="closing-time">Closing Time</Label>
                  <Input
                    id="closing-time"
                    type="time"
                    value={bulkConfig.closingTime}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, closingTime: e.target.value }))}
                    data-testid="input-closing-time"
                  />
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
                <Select value={bulkConfig.slotDuration} onValueChange={(value) => setBulkConfig(prev => ({ ...prev, slotDuration: value }))}>
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <p className="font-medium mb-1">Break Time Information:</p>
                <p>Lunch break (1:00 PM - 2:00 PM) will be automatically excluded from generated slots.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Slots Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staff.map((member: any) => {
                const memberSlots = slotsByStaff[member.id] || [];
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.specialty}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={memberSlots.length > 0 ? "default" : "secondary"}>
                        {memberSlots.length} slots
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        for {format(selectedDate, "MMM dd")}
                      </p>
                    </div>
                  </div>
                );
              })}
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
            <div className="mb-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>
            
            {isLoading ? (
              <div className="text-center py-4">Loading slots...</div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No time slots found for this date.
                <br />
                Use "Bulk Generate Slots" to create them.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot: any) => {
                  const staffMember = staff.find((s: any) => s.id === slot.staffId);
                  return (
                    <div key={slot.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-sm text-muted-foreground">{staffMember?.name}</p>
                      </div>
                      <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                        {slot.isAvailable ? "Available" : "Booked"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}