import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimeSlot } from "@shared/schema";

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  isLoading: boolean;
}

export function TimeSlotPicker({ 
  timeSlots, 
  selectedTimeSlot, 
  onTimeSlotSelect, 
  isLoading 
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No available time slots for this date</p>
        <p className="text-sm mt-1">Please select a different date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((timeSlot) => (
        <Button
          key={timeSlot.id}
          variant="outline"
          size="sm"
          className={`p-2 text-sm transition-colors ${
            selectedTimeSlot?.id === timeSlot.id
              ? "time-slot-selected bg-primary text-white border-primary"
              : timeSlot.isAvailable
              ? "time-slot-available hover:border-primary hover:bg-primary hover:text-white"
              : "time-slot-booked bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={() => timeSlot.isAvailable && onTimeSlotSelect(timeSlot)}
          disabled={!timeSlot.isAvailable}
        >
          {timeSlot.startTime}
        </Button>
      ))}
      {timeSlots.some(slot => !slot.isAvailable) && (
        <p className="text-xs text-gray-500 mt-2 col-span-3">
          Gray slots are already booked
        </p>
      )}
    </div>
  );
}
