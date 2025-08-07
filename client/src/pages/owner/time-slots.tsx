import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { CalendarIcon, Clock, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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

interface TimeSlot {
  id: string;
  salonId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
}

export default function TimeSlots() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "" });
  const [bulkConfig, setBulkConfig] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "18:00",
    duration: "30"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get salon info
  const { data: salon } = useQuery({
    queryKey: ['/api/owner/salon']
  });

  // Get time slots for selected date
  const { data: timeSlots = [], isLoading } = useQuery({
    queryKey: [`/api/salons/${salon?.id}/time-slots`, selectedDate],
    enabled: !!salon?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salon!.id}/time-slots?date=${format(selectedDate, "yyyy-MM-dd")}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create single time slot
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string }) => {
      return await fetch(`/api/salons/${salon!.id}/time-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slotData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      setDialogOpen(false);
      setNewSlot({ startTime: "", endTime: "" });
      toast({
        title: "Time slot created",
        description: "New time slot has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating time slot",
        description: error.message || "Failed to create time slot",
        variant: "destructive",
      });
    },
  });

  // Create bulk time slots
  const createBulkSlotsMutation = useMutation({
    mutationFn: async (bulkData: any) => {
      return await fetch(`/api/salons/${salon!.id}/time-slots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bulkData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      setBulkDialogOpen(false);
      toast({
        title: "Time slots generated",
        description: "Bulk time slots have been created successfully.",
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

  // Delete time slot
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return await fetch(`/api/time-slots/${slotId}`, {
        method: "DELETE",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      toast({
        title: "Time slot deleted",
        description: "Time slot has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting time slot",
        description: error.message || "Failed to delete time slot",
        variant: "destructive",
      });
    },
  });

  const handleCreateSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createSlotMutation.mutate({
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
    });
  };

  const handleBulkGenerate = () => {
    if (!bulkConfig.startDate || !bulkConfig.endDate || !bulkConfig.startTime || !bulkConfig.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createBulkSlotsMutation.mutate(bulkConfig);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  if (!salon) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading salon information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Time Slot Management</h1>
          <p className="text-gray-600">Manage your salon's available time slots</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Bulk Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Generate Time Slots</DialogTitle>
                <DialogDescription>
                  Generate time slots automatically for a date range
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={bulkConfig.startDate}
                      onChange={(e) => setBulkConfig({...bulkConfig, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={bulkConfig.endDate}
                      onChange={(e) => setBulkConfig({...bulkConfig, endDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Select value={bulkConfig.startTime} onValueChange={(value) => setBulkConfig({...bulkConfig, startTime: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Select value={bulkConfig.endTime} onValueChange={(value) => setBulkConfig({...bulkConfig, endTime: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Slot Duration (minutes)</Label>
                  <Select value={bulkConfig.duration} onValueChange={(value) => setBulkConfig({...bulkConfig, duration: value})}>
                    <SelectTrigger>
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
              </div>
              
              <Button 
                onClick={handleBulkGenerate} 
                disabled={createBulkSlotsMutation.isPending}
                className="w-full"
              >
                {createBulkSlotsMutation.isPending ? "Generating..." : "Generate Time Slots"}
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Time Slot</DialogTitle>
                <DialogDescription>
                  Add a new time slot for {format(selectedDate, "MMMM dd, yyyy")}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Select value={newSlot.startTime} onValueChange={(value) => setNewSlot({...newSlot, startTime: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Select value={newSlot.endTime} onValueChange={(value) => setNewSlot({...newSlot, endTime: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleCreateSlot} 
                disabled={createSlotMutation.isPending}
                className="w-full"
              >
                {createSlotMutation.isPending ? "Creating..." : "Create Time Slot"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date()}
              className="rounded-md border-0"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Time Slots for {format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {timeSlots.map((slot: TimeSlot) => (
                  <div
                    key={slot.id}
                    className="border rounded-lg p-3 flex flex-col justify-between h-20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSlotMutation.mutate(slot.id)}
                        disabled={deleteSlotMutation.isPending}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge 
                      variant={slot.isAvailable ? "default" : "secondary"}
                      className="w-fit text-xs"
                    >
                      {slot.isAvailable ? "Available" : "Booked"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No time slots for this date</h3>
                <p className="text-gray-600 mb-4">Create your first time slot to start accepting bookings</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}