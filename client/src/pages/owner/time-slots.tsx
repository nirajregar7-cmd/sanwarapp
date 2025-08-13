import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Clock, Trash2, AlertTriangle, Download } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import type { Salon, TimeSlot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const timeSlotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const bulkGenerateSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.string().min(1, "Duration is required"),
  breaks: z.array(z.object({
    startTime: z.string(),
    duration: z.string(),
  })).optional(),
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;
type BulkGenerateFormData = z.infer<typeof bulkGenerateSchema>;

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

  const queryClient = useQueryClient();

  // Get salon info
  const { data: salon } = useQuery<Salon>({
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
        description: "Your time slot has been added successfully.",
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

  // Bulk generate time slots
  const bulkGenerateMutation = useMutation({
    mutationFn: async (config: BulkGenerateFormData) => {
      return await fetch(`/api/salons/${salon?.id}/time-slots/bulk-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      toast({
        title: "Time slot deleted",
        description: "The time slot has been removed successfully.",
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

  // Fix duplicates mutation
  const fixDuplicatesMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/salons/${salon?.id}/time-slots/fix-duplicates`, {
        method: "POST",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      toast({
        title: "Duplicates fixed",
        description: "Duplicate time slots have been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error fixing duplicates",
        description: error.message || "Failed to fix duplicates",
        variant: "destructive",
      });
    },
  });

  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
    },
  });

  const bulkForm = useForm<BulkGenerateFormData>({
    resolver: zodResolver(bulkGenerateSchema),
    defaultValues: bulkConfig,
  });

  const handleCreateSlot = (data: TimeSlotFormData) => {
    createSlotMutation.mutate({
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: data.startTime,
      endTime: data.endTime,
    });
  };

  const handleBulkGenerate = (data: BulkGenerateFormData) => {
    bulkGenerateMutation.mutate(data);
  };

  const handleDeleteSlot = (slotId: string) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const totalSlots = timeSlots.length;
  const availableSlots = timeSlots.filter((slot: any) => slot.isAvailable).length;
  const bookedSlots = totalSlots - availableSlots;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Time Slot Management</h1>
            <p className="text-gray-600 mt-1">Manage your salon's available time slots</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline"
              onClick={() => fixDuplicatesMutation.mutate()}
              disabled={fixDuplicatesMutation.isPending}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fix Duplicates
            </Button>
            
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Bulk Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Generate Time Slots</DialogTitle>
                  <DialogDescription>
                    Create multiple time slots for a date range
                  </DialogDescription>
                </DialogHeader>
                <Form {...bulkForm}>
                  <form onSubmit={bulkForm.handleSubmit(handleBulkGenerate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={bulkForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slot Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Break Times */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Break Times (Optional)</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addBreak}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Break
                        </Button>
                      </div>
                      {bulkConfig.breaks.map((breakTime, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              type="time"
                              placeholder="Break start time"
                              value={breakTime.startTime}
                              onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              placeholder="Minutes"
                              value={breakTime.duration}
                              onChange={(e) => updateBreak(index, 'duration', e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBreak(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={bulkGenerateMutation.isPending}
                    >
                      {bulkGenerateMutation.isPending ? "Generating..." : "Generate Slots"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Time Slot</DialogTitle>
                  <DialogDescription>
                    Create a new time slot for {format(selectedDate, "MMMM dd, yyyy")}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateSlot)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createSlotMutation.isPending}
                    >
                      {createSlotMutation.isPending ? "Creating..." : "Create Time Slot"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border-0"
                  modifiers={{
                    today: new Date()
                  }}
                  modifiersStyles={{
                    today: { 
                      backgroundColor: '#3b82f6', 
                      color: 'white',
                      borderRadius: '6px'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Slots Display */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Slots for {format(selectedDate, "MMMM dd, yyyy")}
                  </CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>Total: {totalSlots}</span>
                    <span className="text-green-600">Available: {availableSlots}</span>
                    <span className="text-red-600">Booked: {bookedSlots}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {timeSlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className={`p-4 border rounded-lg ${
                          slot.isAvailable 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Badge
                          variant={slot.isAvailable ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {slot.isAvailable ? "Available" : "Booked"}
                        </Badge>
                        {slot.customerName && (
                          <p className="text-xs text-gray-600 mt-1">
                            {slot.customerName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Slots</h3>
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
    </div>
  );
}