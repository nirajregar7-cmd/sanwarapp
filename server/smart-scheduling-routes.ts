import type { Express } from "express";
import { SmartSchedulingService } from "./smart-scheduling";
import { storage } from "./storage";

export function registerSmartSchedulingRoutes(app: Express) {
  const smartScheduling = new SmartSchedulingService(storage);

  // Staff management routes
  app.get('/api/salons/:salonId/staff', async (req, res) => {
    try {
      const { salonId } = req.params;
      const staff = await storage.getSalonStaff(salonId);
      res.json(staff);
    } catch (error) {
      console.error('Error fetching salon staff:', error);
      res.status(500).json({ error: 'Failed to fetch salon staff' });
    }
  });

  // Get staff with their service assignments for management
  app.get('/api/salons/:salonId/staff-with-services', async (req, res) => {
    try {
      const { salonId } = req.params;
      const staff = await storage.getSalonStaff(salonId);
      
      // Get services for each staff member
      const staffWithServices = await Promise.all(staff.map(async (member) => {
        const services = await storage.getStaffServices(member.id);
        return {
          ...member,
          services: services || []
        };
      }));
      
      res.json(staffWithServices);
    } catch (error) {
      console.error('Error fetching staff with services:', error);
      res.status(500).json({ error: 'Failed to fetch staff with services' });
    }
  });

  app.post('/api/salons/:salonId/staff', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { salonId } = req.params;
      const staffData = {
        ...req.body,
        salonId,
      };

      const staff = await storage.createStaffMember(staffData);
      res.json(staff);
    } catch (error) {
      console.error('Error creating staff member:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  });

  app.put('/api/staff/:staffId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const updates = req.body;

      const staff = await storage.updateStaffMember(staffId, updates);
      res.json(staff);
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  });

  app.delete('/api/staff/:staffId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      await storage.deleteStaffMember(staffId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  });

  // Staff working hours routes
  app.get('/api/staff/:staffId/working-hours', async (req, res) => {
    try {
      const { staffId } = req.params;
      const workingHours = await storage.getStaffWorkingHours(staffId);
      res.json(workingHours);
    } catch (error) {
      console.error('Error fetching staff working hours:', error);
      res.status(500).json({ error: 'Failed to fetch staff working hours' });
    }
  });

  app.post('/api/staff/:staffId/working-hours', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const workingHoursData = {
        ...req.body,
        staffId,
      };

      const workingHours = await storage.upsertStaffWorkingHours(workingHoursData);
      res.json(workingHours);
    } catch (error) {
      console.error('Error saving staff working hours:', error);
      res.status(500).json({ error: 'Failed to save staff working hours' });
    }
  });

  // Staff service assignments routes
  app.get('/api/staff/:staffId/services', async (req, res) => {
    try {
      const { staffId } = req.params;
      const services = await storage.getStaffServices(staffId);
      res.json(services);
    } catch (error) {
      console.error('Error fetching staff services:', error);
      res.status(500).json({ error: 'Failed to fetch staff services' });
    }
  });

  app.post('/api/staff/:staffId/services/:serviceId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId, serviceId } = req.params;
      const { customPrice, estimatedDuration } = req.body;

      const assignment = await storage.assignServiceToStaff(
        staffId,
        serviceId,
        customPrice,
        estimatedDuration
      );
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning service to staff:', error);
      res.status(500).json({ error: 'Failed to assign service to staff' });
    }
  });

  app.delete('/api/staff/:staffId/services/:serviceId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId, serviceId } = req.params;
      await storage.removeServiceFromStaff(staffId, serviceId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing service from staff:', error);
      res.status(500).json({ error: 'Failed to remove service from staff' });
    }
  });

  // Staff holidays routes
  app.get('/api/staff/:staffId/holidays', async (req, res) => {
    try {
      const { staffId } = req.params;
      const holidays = await storage.getStaffHolidays(staffId);
      res.json(holidays);
    } catch (error) {
      console.error('Error fetching staff holidays:', error);
      res.status(500).json({ error: 'Failed to fetch staff holidays' });
    }
  });

  app.post('/api/staff/:staffId/holidays', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const holidayData = {
        ...req.body,
        staffId,
      };

      const holiday = await storage.createStaffHoliday(holidayData);
      res.json(holiday);
    } catch (error) {
      console.error('Error creating staff holiday:', error);
      res.status(500).json({ error: 'Failed to create staff holiday' });
    }
  });

  app.put('/api/staff/holidays/:holidayId/approve', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { holidayId } = req.params;
      const approvedBy = req.user?.id;

      await storage.approveStaffHoliday(holidayId, approvedBy);
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving staff holiday:', error);
      res.status(500).json({ error: 'Failed to approve staff holiday' });
    }
  });

  app.delete('/api/staff/holidays/:holidayId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { holidayId } = req.params;
      await storage.deleteStaffHoliday(holidayId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff holiday:', error);
      res.status(500).json({ error: 'Failed to delete staff holiday' });
    }
  });

  // Smart scheduling routes
  app.post('/api/staff/:staffId/generate-slots', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const { date } = req.body;

      const slots = await smartScheduling.generateStaffTimeSlots(staffId, date);
      res.json(slots);
    } catch (error) {
      console.error('Error generating staff time slots:', error);
      res.status(500).json({ error: 'Failed to generate staff time slots' });
    }
  });

  app.get('/api/staff/:staffId/slots/:date', async (req, res) => {
    try {
      const { staffId, date } = req.params;
      const slots = await storage.getStaffTimeSlots(staffId, date);
      res.json(slots);
    } catch (error) {
      console.error('Error fetching staff time slots:', error);
      res.status(500).json({ error: 'Failed to fetch staff time slots' });
    }
  });

  app.post('/api/services/:serviceId/find-slots', async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { date, preferredStaffId, preferredStartTime } = req.body;

      const availableSlots = await smartScheduling.findAvailableSlots({
        serviceId,
        date,
        preferredStaffId,
        preferredStartTime,
      });

      res.json(availableSlots);
    } catch (error) {
      console.error('Error finding available slots:', error);
      res.status(500).json({ error: 'Failed to find available slots' });
    }
  });

  app.post('/api/staff/:staffId/book-slots', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const { date, slotIds, bookingId } = req.body;

      const success = await smartScheduling.bookServiceSlots(staffId, date, slotIds, bookingId);
      res.json({ success });
    } catch (error) {
      console.error('Error booking service slots:', error);
      res.status(500).json({ error: 'Failed to book service slots' });
    }
  });

  app.post('/api/staff/:staffId/cancel-slots', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { staffId } = req.params;
      const { date, slotIds } = req.body;

      const success = await smartScheduling.cancelBookingSlots(staffId, date, slotIds);
      res.json({ success });
    } catch (error) {
      console.error('Error cancelling booking slots:', error);
      res.status(500).json({ error: 'Failed to cancel booking slots' });
    }
  });

  // Schedule management routes
  app.get('/api/salons/:salonId/schedule/:date', async (req, res) => {
    try {
      const { salonId, date } = req.params;
      const scheduleOverview = await smartScheduling.getSalonScheduleOverview(salonId, date);
      res.json(scheduleOverview);
    } catch (error) {
      console.error('Error fetching salon schedule overview:', error);
      res.status(500).json({ error: 'Failed to fetch salon schedule overview' });
    }
  });

  app.post('/api/salons/:salonId/copy-schedule', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { salonId } = req.params;
      const { sourceDayOfWeek, targetDates } = req.body;

      const success = await smartScheduling.copyScheduleToMultipleDays(
        salonId,
        sourceDayOfWeek,
        targetDates
      );

      res.json({ success });
    } catch (error) {
      console.error('Error copying schedule:', error);
      res.status(500).json({ error: 'Failed to copy schedule' });
    }
  });

  app.post('/api/salons/:salonId/bulk-break', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { salonId } = req.params;
      const { dayOfWeek, breakStartTime, breakEndTime, breakDuration } = req.body;

      const success = await smartScheduling.addBulkBreakToAllStaff(
        salonId,
        dayOfWeek,
        breakStartTime,
        breakEndTime,
        breakDuration
      );

      res.json({ success });
    } catch (error) {
      console.error('Error adding bulk break:', error);
      res.status(500).json({ error: 'Failed to add bulk break' });
    }
  });

  // Schedule templates
  app.get('/api/salons/:salonId/schedule-templates', async (req, res) => {
    try {
      const { salonId } = req.params;
      const templates = await storage.getScheduleTemplates(salonId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      res.status(500).json({ error: 'Failed to fetch schedule templates' });
    }
  });

  app.post('/api/salons/:salonId/schedule-templates', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { salonId } = req.params;
      const templateData = {
        ...req.body,
        salonId,
        createdBy: req.user?.id,
      };

      const template = await storage.createScheduleTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Error creating schedule template:', error);
      res.status(500).json({ error: 'Failed to create schedule template' });
    }
  });

  app.delete('/api/schedule-templates/:templateId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { templateId } = req.params;
      await storage.deleteScheduleTemplate(templateId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting schedule template:', error);
      res.status(500).json({ error: 'Failed to delete schedule template' });
    }
  });
}