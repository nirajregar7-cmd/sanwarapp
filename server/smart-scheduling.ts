import { eq, and, gte, lte, inArray, isNull, or } from 'drizzle-orm';
import {
  staff,
  staffWorkingHours,
  staffServices,
  staffHolidays,
  staffTimeSlots,
  services,
  bookings,
  scheduleTemplates,
} from '../shared/schema';

export interface StaffScheduleConfig {
  staffId: string;
  dayOfWeek: number;
  isAvailable: boolean;
  shift1StartTime?: string;
  shift1EndTime?: string;
  shift2StartTime?: string;
  shift2EndTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  breakDuration?: number;
  slotDuration?: number;
}

export interface ServiceDuration {
  serviceId: string;
  duration: number; // in minutes
  name: string;
}

export interface TimeSlot {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotType: 'regular' | 'break' | 'blocked';
  compatibleServices: string[];
}

export interface BookingRequest {
  serviceId: string;
  date: string;
  preferredStaffId?: string;
  preferredStartTime?: string;
}

export interface AvailableSlot {
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  duration: number;
  slotIds: string[];
  canAccommodateService: boolean;
}

export class SmartSchedulingService {
  constructor(private storage: any) {}

  /**
   * Generate time slots for a specific staff member for a given date
   */
  async generateStaffTimeSlots(staffId: string, date: string): Promise<TimeSlot[]> {
    const { db } = this.storage;
    
    // Get staff working hours for the day
    const dayOfWeek = new Date(date).getDay();
    const [workingHour] = await db
      .select()
      .from(staffWorkingHours)
      .where(and(
        eq(staffWorkingHours.staffId, staffId),
        eq(staffWorkingHours.dayOfWeek, dayOfWeek)
      ));

    if (!workingHour || !workingHour.isAvailable) {
      return [];
    }

    // Check for holidays
    const [holiday] = await db
      .select()
      .from(staffHolidays)
      .where(and(
        eq(staffHolidays.staffId, staffId),
        eq(staffHolidays.date, date),
        eq(staffHolidays.isApproved, true)
      ));

    if (holiday) {
      return [];
    }

    // Get staff services for compatibility
    const staffServicesList = await db
      .select({ serviceId: staffServices.serviceId })
      .from(staffServices)
      .where(and(
        eq(staffServices.staffId, staffId),
        eq(staffServices.isActive, true)
      ));

    const compatibleServices = staffServicesList.map((s: any) => s.serviceId);

    const slots: TimeSlot[] = [];
    const slotDuration = workingHour.slotDuration || 30;

    // Generate slots for first shift
    if (workingHour.shift1StartTime && workingHour.shift1EndTime) {
      const shift1Slots = this.generateSlotsForTimeRange(
        workingHour.shift1StartTime,
        workingHour.shift1EndTime,
        slotDuration,
        compatibleServices,
        workingHour.breakStartTime,
        workingHour.breakEndTime
      );
      slots.push(...shift1Slots.map(slot => ({ ...slot, staffId })));
    }

    // Generate slots for second shift (if exists)
    if (workingHour.shift2StartTime && workingHour.shift2EndTime) {
      const shift2Slots = this.generateSlotsForTimeRange(
        workingHour.shift2StartTime,
        workingHour.shift2EndTime,
        slotDuration,
        compatibleServices
      );
      slots.push(...shift2Slots.map(slot => ({ ...slot, staffId })));
    }

    // Save generated slots to database
    await this.saveStaffTimeSlots(staffId, date, slots);

    return slots;
  }

  /**
   * Generate slots for a specific time range
   */
  private generateSlotsForTimeRange(
    startTime: string,
    endTime: string,
    slotDuration: number,
    compatibleServices: string[],
    breakStart?: string,
    breakEnd?: string
  ): Omit<TimeSlot, 'staffId'>[] {
    const slots: Omit<TimeSlot, 'staffId'>[] = [];
    
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const breakStartMin = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMin = breakEnd ? this.timeToMinutes(breakEnd) : null;

    for (let currentTime = start; currentTime < end; currentTime += slotDuration) {
      const slotStart = this.minutesToTime(currentTime);
      const slotEnd = this.minutesToTime(currentTime + slotDuration);

      // Check if this slot overlaps with break time
      const isBreakTime = breakStartMin !== null && breakEndMin !== null &&
        currentTime >= breakStartMin && currentTime < breakEndMin;

      slots.push({
        id: `slot-${slotStart}-${slotEnd}`,
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: !isBreakTime,
        slotType: isBreakTime ? 'break' : 'regular',
        compatibleServices: isBreakTime ? [] : compatibleServices,
      });
    }

    return slots;
  }

  /**
   * Find available slots for a specific service and date
   */
  async findAvailableSlots(request: BookingRequest): Promise<AvailableSlot[]> {
    const { db } = this.storage;
    
    // Get service details
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, request.serviceId));

    if (!service) {
      throw new Error('Service not found');
    }

    const serviceDuration = service.duration;
    const slotsNeeded = Math.ceil(serviceDuration / 30); // Assuming 30-minute base slots

    // Get all staff who can perform this service
    const availableStaff = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        slotDuration: staffWorkingHours.slotDuration,
      })
      .from(staff)
      .innerJoin(staffServices, eq(staff.id, staffServices.staffId))
      .innerJoin(staffWorkingHours, eq(staff.id, staffWorkingHours.staffId))
      .where(and(
        eq(staffServices.serviceId, request.serviceId),
        eq(staffServices.isActive, true),
        eq(staff.isActive, true),
        eq(staffWorkingHours.dayOfWeek, new Date(request.date).getDay()),
        eq(staffWorkingHours.isAvailable, true)
      ));

    // Filter by preferred staff if specified
    const targetStaff = request.preferredStaffId
      ? availableStaff.filter(s => s.staffId === request.preferredStaffId)
      : availableStaff;

    const availableSlots: AvailableSlot[] = [];

    for (const staffMember of targetStaff) {
      // Generate or get existing slots for this staff member
      const slots = await this.getStaffTimeSlotsForDate(staffMember.staffId, request.date);
      
      // Find consecutive available slots
      const consecutiveSlots = this.findConsecutiveSlots(slots, slotsNeeded, request.preferredStartTime);
      
      for (const slotGroup of consecutiveSlots) {
        availableSlots.push({
          staffId: staffMember.staffId,
          staffName: staffMember.staffName,
          startTime: slotGroup[0].startTime,
          endTime: slotGroup[slotGroup.length - 1].endTime,
          duration: serviceDuration,
          slotIds: slotGroup.map(s => s.id),
          canAccommodateService: true,
        });
      }
    }

    return availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  /**
   * Book a service by reserving consecutive time slots
   */
  async bookServiceSlots(staffId: string, date: string, slotIds: string[], bookingId: string): Promise<boolean> {
    const { db } = this.storage;
    
    try {
      // Mark slots as unavailable and link to booking
      await db
        .update(staffTimeSlots)
        .set({ isAvailable: false })
        .where(and(
          eq(staffTimeSlots.staffId, staffId),
          eq(staffTimeSlots.date, date),
          inArray(staffTimeSlots.id, slotIds)
        ));

      return true;
    } catch (error) {
      console.error('Error booking service slots:', error);
      return false;
    }
  }

  /**
   * Cancel booking and free up slots
   */
  async cancelBookingSlots(staffId: string, date: string, slotIds: string[]): Promise<boolean> {
    const { db } = this.storage;
    
    try {
      await db
        .update(staffTimeSlots)
        .set({ isAvailable: true })
        .where(and(
          eq(staffTimeSlots.staffId, staffId),
          eq(staffTimeSlots.date, date),
          inArray(staffTimeSlots.id, slotIds)
        ));

      return true;
    } catch (error) {
      console.error('Error cancelling booking slots:', error);
      return false;
    }
  }

  /**
   * Copy schedule from one day to multiple days
   */
  async copyScheduleToMultipleDays(
    salonId: string,
    sourceDayOfWeek: number,
    targetDates: string[]
  ): Promise<boolean> {
    const { db } = this.storage;
    
    try {
      // Get source day schedule for all staff
      const sourceSchedules = await db
        .select()
        .from(staffWorkingHours)
        .innerJoin(staff, eq(staffWorkingHours.staffId, staff.id))
        .where(and(
          eq(staff.salonId, salonId),
          eq(staffWorkingHours.dayOfWeek, sourceDayOfWeek)
        ));

      for (const date of targetDates) {
        const dayOfWeek = new Date(date).getDay();
        
        for (const schedule of sourceSchedules) {
          // Check if target day schedule already exists
          const [existingSchedule] = await db
            .select()
            .from(staffWorkingHours)
            .where(and(
              eq(staffWorkingHours.staffId, (schedule as any).staff_working_hours.staffId),
              eq(staffWorkingHours.dayOfWeek, dayOfWeek)
            ));

          if (!existingSchedule) {
            // Create new schedule for target day
            await db.insert(staffWorkingHours).values({
              staffId: (schedule as any).staff_working_hours.staffId,
              dayOfWeek,
              isAvailable: (schedule as any).staff_working_hours.isAvailable,
              shift1StartTime: (schedule as any).staff_working_hours.shift1StartTime,
              shift1EndTime: (schedule as any).staff_working_hours.shift1EndTime,
              shift2StartTime: (schedule as any).staff_working_hours.shift2StartTime,
              shift2EndTime: (schedule as any).staff_working_hours.shift2EndTime,
              breakStartTime: (schedule as any).staff_working_hours.breakStartTime,
              breakEndTime: (schedule as any).staff_working_hours.breakEndTime,
              breakDuration: (schedule as any).staff_working_hours.breakDuration,
              slotDuration: (schedule as any).staff_working_hours.slotDuration,
            });
          }
        }

        // Generate time slots for the new date
        const salonStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.salonId, salonId));

        for (const staffMember of salonStaff) {
          await this.generateStaffTimeSlots(staffMember.id, date);
        }
      }

      return true;
    } catch (error) {
      console.error('Error copying schedule:', error);
      return false;
    }
  }

  /**
   * Add bulk breaks to all staff schedules
   */
  async addBulkBreakToAllStaff(
    salonId: string,
    dayOfWeek: number,
    breakStartTime: string,
    breakEndTime: string,
    breakDuration: number
  ): Promise<boolean> {
    const { db } = this.storage;
    
    try {
      await db
        .update(staffWorkingHours)
        .set({
          breakStartTime,
          breakEndTime,
          breakDuration,
        })
        .where(and(
          eq(staffWorkingHours.dayOfWeek, dayOfWeek),
          eq(staff.salonId, salonId)
        ))
        .from(staff)
        .where(eq(staffWorkingHours.staffId, staff.id));

      return true;
    } catch (error) {
      console.error('Error adding bulk breaks:', error);
      return false;
    }
  }

  // Helper methods
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private findConsecutiveSlots(slots: TimeSlot[], slotsNeeded: number, preferredStartTime?: string): TimeSlot[][] {
    const availableSlots = slots.filter(slot => slot.isAvailable && slot.slotType === 'regular');
    const consecutiveGroups: TimeSlot[][] = [];

    for (let i = 0; i <= availableSlots.length - slotsNeeded; i++) {
      const group = availableSlots.slice(i, i + slotsNeeded);
      
      // Check if slots are truly consecutive
      const isConsecutive = group.every((slot, index) => {
        if (index === 0) return true;
        const prevEndTime = this.timeToMinutes(group[index - 1].endTime);
        const currentStartTime = this.timeToMinutes(slot.startTime);
        return prevEndTime === currentStartTime;
      });

      if (isConsecutive) {
        // If preferred start time is specified, prioritize slots starting at or after that time
        if (!preferredStartTime || group[0].startTime >= preferredStartTime) {
          consecutiveGroups.push(group);
        }
      }
    }

    return consecutiveGroups;
  }

  private async saveStaffTimeSlots(staffId: string, date: string, slots: TimeSlot[]): Promise<void> {
    const { db } = this.storage;

    // Delete existing slots for this date
    await db
      .delete(staffTimeSlots)
      .where(and(
        eq(staffTimeSlots.staffId, staffId),
        eq(staffTimeSlots.date, date)
      ));

    // Insert new slots
    if (slots.length > 0) {
      const [staffMember] = await db
        .select({ salonId: staff.salonId })
        .from(staff)
        .where(eq(staff.id, staffId));

      await db.insert(staffTimeSlots).values(
        slots.map(slot => ({
          staffId,
          salonId: staffMember.salonId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          slotType: slot.slotType,
          compatibleServices: slot.compatibleServices,
        }))
      );
    }
  }

  private async getStaffTimeSlotsForDate(staffId: string, date: string): Promise<TimeSlot[]> {
    const { db } = this.storage;
    
    const slots = await db
      .select()
      .from(staffTimeSlots)
      .where(and(
        eq(staffTimeSlots.staffId, staffId),
        eq(staffTimeSlots.date, date)
      ))
      .orderBy(staffTimeSlots.startTime);

    return slots.map((slot: any) => ({
      id: slot.id,
      staffId: slot.staffId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      slotType: slot.slotType as 'regular' | 'break' | 'blocked',
      compatibleServices: slot.compatibleServices || [],
    }));
  }

  /**
   * Get comprehensive schedule overview for a salon
   */
  async getSalonScheduleOverview(salonId: string, date: string): Promise<any> {
    const { db } = this.storage;
    
    const staffMembers = await db
      .select({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        photoUrl: staff.photoUrl,
      })
      .from(staff)
      .where(and(
        eq(staff.salonId, salonId),
        eq(staff.isActive, true)
      ));

    const scheduleOverview = [];

    for (const staffMember of staffMembers) {
      const slots = await this.getStaffTimeSlotsForDate(staffMember.id, date);
      const workingHours = await this.getStaffWorkingHours(staffMember.id, new Date(date).getDay());
      
      scheduleOverview.push({
        staff: staffMember,
        workingHours,
        slots: slots.length,
        availableSlots: slots.filter(s => s.isAvailable).length,
        bookedSlots: slots.filter(s => !s.isAvailable).length,
        breakSlots: slots.filter(s => s.slotType === 'break').length,
      });
    }

    return scheduleOverview;
  }

  private async getStaffWorkingHours(staffId: string, dayOfWeek: number) {
    const { db } = this.storage;
    
    const [workingHour] = await db
      .select()
      .from(staffWorkingHours)
      .where(and(
        eq(staffWorkingHours.staffId, staffId),
        eq(staffWorkingHours.dayOfWeek, dayOfWeek)
      ));

    return workingHour;
  }
}