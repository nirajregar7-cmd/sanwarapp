import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface WorkingDay {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

interface WorkingHoursFormProps {
  workingHours: any[];
  onSave: (hoursData: WorkingDay[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function WorkingHoursForm({ workingHours, onSave, onCancel, isLoading }: WorkingHoursFormProps) {
  const [hoursData, setHoursData] = useState<WorkingDay[]>([]);

  useEffect(() => {
    // Initialize with existing data or default values
    const initialData = DAYS.map(day => {
      const existing = workingHours.find(h => h.dayOfWeek === day.value);
      return {
        dayOfWeek: day.value,
        isOpen: existing?.isOpen ?? true,
        openTime: existing?.openTime ?? "09:00",
        closeTime: existing?.closeTime ?? "20:00",
        breakStartTime: existing?.breakStartTime ?? null,
        breakEndTime: existing?.breakEndTime ?? null,
      };
    });
    setHoursData(initialData);
  }, [workingHours]);

  const updateDay = (dayIndex: number, updates: Partial<WorkingDay>) => {
    setHoursData(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, ...updates } : day
    ));
  };

  const handleSave = () => {
    onSave(hoursData);
  };

  return (
    <div className="space-y-4">
      {DAYS.map((day, index) => {
        const dayData = hoursData[index];
        if (!dayData) return null;

        return (
          <Card key={day.value} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {day.label}
                </span>
                <Switch
                  checked={dayData.isOpen}
                  onCheckedChange={(checked) => updateDay(index, { isOpen: checked })}
                  data-testid={`switch-${day.label.toLowerCase()}-open`}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {dayData.isOpen ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`open-${day.value}`} className="text-sm font-medium">
                      Opening Time
                    </Label>
                    <Input
                      id={`open-${day.value}`}
                      type="time"
                      value={dayData.openTime || "09:00"}
                      onChange={(e) => updateDay(index, { openTime: e.target.value })}
                      className="mt-1"
                      data-testid={`input-${day.label.toLowerCase()}-open-time`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`close-${day.value}`} className="text-sm font-medium">
                      Closing Time
                    </Label>
                    <Input
                      id={`close-${day.value}`}
                      type="time"
                      value={dayData.closeTime || "20:00"}
                      onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                      className="mt-1"
                      data-testid={`input-${day.label.toLowerCase()}-close-time`}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">Closed</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel-working-hours"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          data-testid="button-save-working-hours"
        >
          {isLoading ? "Saving..." : "Save Working Hours"}
        </Button>
      </div>
    </div>
  );
}