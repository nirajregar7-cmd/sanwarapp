import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Clock, Trash2, AlertTriangle, Download, Settings } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import type { Salon, TimeSlot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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

type BulkGenerateFormData = z.infer<typeof bulkGenerateSchema>;

export default function TimeSlotManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  });
  
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  const [bulkConfig, setBulkConfig] = useState(() => {
    const now = new Date();
    const istDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    return {
      startDate: format(istDate, "yyyy-MM-dd"),
      endDate: format(addDays(istDate, 30), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "18:00",
      duration: "30",
      breaks: [] as Array<{startTime: string, duration: string}>
    };
  });

  const addBreak = () => {
    setBulkConfig({
      ...bulkConfig,
      breaks: [...bulkConfig.breaks, { startTime: "", duration: "15" }]
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

  // Delete all slots for a date
  const deleteAllSlotsMutation = useMutation({
    mutationFn: async (date: string) => {
      return await fetch(`/api/salons/${salon?.id}/time-slots/date/${date}`, {
        method: "DELETE",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/time-slots`] });
      toast({
        title: "All slots deleted",
        description: "All time slots for the selected date have been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting slots",
        description: error.message || "Failed to delete time slots",
        variant: "destructive",
      });
    },
  });

  const bulkForm = useForm<BulkGenerateFormData>({
    resolver: zodResolver(bulkGenerateSchema),
    defaultValues: bulkConfig,
  });

  const handleBulkGenerate = (data: BulkGenerateFormData) => {
    bulkGenerateMutation.mutate(data);
  };

  const handleDeleteAllSlots = () => {
    if (confirm("Are you sure you want to delete ALL time slots for this date? This cannot be undone.")) {
      deleteAllSlotsMutation.mutate(format(selectedDate, "yyyy-MM-dd"));
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Slot Manager</h1>
            <p className="text-gray-600 mt-1">Advanced time slot management and bulk operations</p>
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
            
            <Button 
              variant="destructive"
              onClick={handleDeleteAllSlots}
              disabled={deleteAllSlotsMutation.isPending || totalSlots === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Slots
            </Button>
            
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Bulk Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Generate Time Slots</DialogTitle>
                  <DialogDescription>
                    Create multiple time slots for a date range with advanced settings
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Slots</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{availableSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Booked</p>
                  <p className="text-2xl font-bold text-gray-900">{bookedSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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

          {/* Time Slots Management Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Management Panel - {format(selectedDate, "MMMM dd, yyyy")}
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
                  <div className="space-y-6">
                    {/* Management Controls */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <h4 className="font-medium text-blue-900">Bulk Management</h4>
                            <p className="text-sm text-blue-700">
                              Manage multiple time slots at once for this date
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setBulkDialogOpen(true)}
                          >
                            Generate More
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleDeleteAllSlots}
                            disabled={totalSlots === 0}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Time Slots Grid */}
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
                          <div className="font-medium text-sm mb-2">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <Badge
                            variant={slot.isAvailable ? "default" : "secondary"}
                            className="text-xs mb-2"
                          >
                            {slot.isAvailable ? "Available" : "Booked"}
                          </Badge>
                          {slot.customerName && (
                            <p className="text-xs text-gray-600 mt-1">
                              {slot.customerName}
                            </p>
                          )}
                          {slot.service && (
                            <p className="text-xs text-blue-600 mt-1">
                              {slot.service}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Slots</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      Use bulk generation to create multiple time slots quickly
                    </p>
                    <Button onClick={() => setBulkDialogOpen(true)} size="sm" className="sm:size-default">
                      <Plus className="h-4 w-4 mr-2" />
                      Bulk Generate Slots
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