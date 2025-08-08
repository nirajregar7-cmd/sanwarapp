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
    duration: "30",
    breaks: [] as Array<{startTime: string, duration: string}>
  });

  const addBreak = () => {
    setBulkConfig({
      ...bulkConfig,
      breaks: [...bulkConfig.breaks, { startTime: "", duration: "5" }]
    });
  };

  const removeBreak = (index: number) => {
    setBulkConfig({
      ...bulkConfig,
      breaks: bulkConfig.breaks.filter((_, i) => i !== index)
    });
  };

  const updateBreak = (index: number, field: 'startTime' | 'duration', value: string) => {
    setBulkConfig({
      ...bulkConfig,
      breaks: bulkConfig.breaks.map((brk, i) => 
        i === index ? { ...brk, [field]: value } : brk
      )
    });
  };

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
      const response = await apiRequest("GET", `/api/salons/${salon?.id}/time-slots?date=${format(selectedDate, "yyyy-MM-dd")}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create single time slot
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string }) => {
      return await fetch(`/api/salons/${salon?.id}/time-slots`, {
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
      return await fetch(`/api/salons/${salon?.id}/time-slots/bulk`, {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Time Slot Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your salon's available time slots</p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full xs:w-auto flex-1 sm:flex-none">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Bulk Generate</span>
                <span className="xs:hidden">Bulk</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-w-[95vw] mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Bulk Generate Time Slots</DialogTitle>
                <DialogDescription className="text-sm">
                  Generate time slots automatically for a date range
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                    <Select value={bulkConfig.startTime} onValueChange={(value) => setBulkConfig({...bulkConfig, startTime: value})}>
                      <SelectTrigger className="h-10">
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
                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                    <Select value={bulkConfig.endTime} onValueChange={(value) => setBulkConfig({...bulkConfig, endTime: value})}>
                      <SelectTrigger className="h-10">
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
                  <Label htmlFor="duration" className="text-sm">Slot Duration (minutes)</Label>
                  <Select value={bulkConfig.duration} onValueChange={(value) => setBulkConfig({...bulkConfig, duration: value})}>
                    <SelectTrigger className="h-10">
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

                {/* Break Times Configuration */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Break Times</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBreak}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Break
                    </Button>
                  </div>
                  
                  {bulkConfig.breaks.map((brk, index) => (
                    <div key={index} className="flex items-end gap-2 p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <Label className="text-xs">Start Time</Label>
                        <Select 
                          value={brk.startTime} 
                          onValueChange={(value) => updateBreak(index, 'startTime', value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select time" />
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
                      <div className="flex-1">
                        <Label className="text-xs">Duration</Label>
                        <Select 
                          value={brk.duration} 
                          onValueChange={(value) => updateBreak(index, 'duration', value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBreak(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {bulkConfig.breaks.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No breaks added. Click "Add Break" to add rest periods.</p>
                  )}
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
              <Button className="w-full xs:w-auto flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Add Time Slot</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-w-[95vw] mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Create New Time Slot</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a new time slot for {format(selectedDate, "MMMM dd, yyyy")}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                    <Select value={newSlot.startTime} onValueChange={(value) => setNewSlot({...newSlot, startTime: value})}>
                      <SelectTrigger className="h-10">
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
                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                    <Select value={newSlot.endTime} onValueChange={(value) => setNewSlot({...newSlot, endTime: value})}>
                      <SelectTrigger className="h-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date()}
              className="rounded-md border-0 w-full [&_.rdp-months]:w-full [&_.rdp-table]:w-full [&_.rdp-cell]:w-8 [&_.rdp-cell]:h-8 [&_.rdp-cell]:text-xs sm:[&_.rdp-cell]:w-10 sm:[&_.rdp-cell]:h-10 sm:[&_.rdp-cell]:text-sm"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Time Slots for {format(selectedDate, "MMMM dd, yyyy")}</span>
              <span className="sm:hidden">Slots - {format(selectedDate, "MMM dd")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {timeSlots.map((slot: TimeSlot) => (
                  <div
                    key={slot.id}
                    className="border rounded-lg p-3 flex flex-col justify-between h-16 sm:h-20 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs sm:text-sm">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSlotMutation.mutate(slot.id)}
                        disabled={deleteSlotMutation.isPending}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
              <div className="text-center py-8 sm:py-12">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No time slots for this date</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">Create your first time slot to start accepting bookings</p>
                <Button onClick={() => setDialogOpen(true)} size="sm" className="sm:size-default">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}