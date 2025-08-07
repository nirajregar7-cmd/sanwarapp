import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { db } from "./db";
import { platformStats } from "@shared/schema";
import { ObjectPermission } from "./objectAcl";
import { insertSalonSchema, insertServiceSchema, insertWorkingHoursSchema, insertTimeSlotSchema, insertBookingSchema, insertReviewSchema, salons, users, bookings, services, staff, reviews, workingHours, timeSlots } from "@shared/schema";
import { eq, desc, isNotNull, sql, count, and, or, not, exists } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // For development, return null if no session exists
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json(null);
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json(null);
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json(null);
    }
  });

  // Platform statistics endpoint - real data only
  app.get('/api/platform/stats', async (req, res) => {
    try {
      // Calculate real statistics from database
      const [
        totalCustomersResult,
        totalSalonsResult, 
        totalBookingsResult,
        totalServicesResult
      ] = await Promise.all([
        db.select({ count: count() }).from(users).where(eq(users.userType, 'customer')),
        db.select({ count: count() }).from(salons),
        db.select({ count: count() }).from(bookings),
        db.select({ count: count() }).from(services)
      ]);

      const stats = {
        id: "stats",
        totalCustomers: Number(totalCustomersResult[0]?.count) || 0,
        totalSalons: Number(totalSalonsResult[0]?.count) || 0,
        totalBookings: Number(totalBookingsResult[0]?.count) || 0,
        totalServices: Number(totalServicesResult[0]?.count) || 0,
        lastUpdated: new Date()
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  // Featured salons endpoint (real data only)
  app.get('/api/salons/featured', async (req, res) => {
    try {
      // Fetch all salons (since we may not have many yet)
      const featuredSalons = await db.select()
        .from(salons)
        .orderBy(desc(salons.averageRating), desc(salons.totalReviews))
        .limit(6);
      
      res.json(featuredSalons);
    } catch (error) {
      console.error("Error fetching featured salons:", error);
      res.status(500).json({ message: "Failed to fetch featured salons" });
    }
  });

  // Individual salon details endpoint  
  app.get('/api/salons/:salonId', async (req, res) => {
    try {
      const { salonId } = req.params;
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      res.json(salon);
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ message: "Failed to fetch salon details" });
    }
  });

  // Salon services endpoint
  app.get('/api/salons/:salonId/services', async (req, res) => {
    try {
      const { salonId } = req.params;
      const salonServices = await db.select()
        .from(services)
        .where(eq(services.salonId, salonId));
      
      res.json(salonServices);
    } catch (error) {
      console.error("Error fetching salon services:", error);
      res.status(500).json({ message: "Failed to fetch salon services" });
    }
  });

  // Salon staff endpoint
  app.get('/api/salons/:salonId/staff', async (req, res) => {
    try {
      const { salonId } = req.params;
      const salonStaff = await db.select()
        .from(staff)
        .where(eq(staff.salonId, salonId));
      
      res.json(salonStaff);
    } catch (error) {
      console.error("Error fetching salon staff:", error);
      res.status(500).json({ message: "Failed to fetch salon staff" });
    }
  });

  // Salon reviews endpoint
  app.get('/api/salons/:salonId/reviews', async (req, res) => {
    try {
      const { salonId } = req.params;
      const salonReviews = await db.select()
        .from(reviews)
        .where(eq(reviews.salonId, salonId))
        .orderBy(desc(reviews.createdAt))
        .limit(10);
      
      res.json(salonReviews);
    } catch (error) {
      console.error("Error fetching salon reviews:", error);
      res.status(500).json({ message: "Failed to fetch salon reviews" });
    }
  });

  // Salon working hours endpoint
  app.get('/api/salons/:salonId/working-hours', async (req, res) => {
    try {
      const { salonId } = req.params;
      const hours = await db.select()
        .from(workingHours)
        .where(eq(workingHours.salonId, salonId));
      
      res.json(hours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ message: "Failed to fetch working hours" });
    }
  });



  // Create booking endpoint
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { salonId, serviceId, staffId, timeSlotId, date } = req.body;
      
      // Get service details for pricing
      const [service] = await db.select()
        .from(services)
        .where(eq(services.id, serviceId));
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get time slot details
      const [timeSlot] = await db.select()
        .from(timeSlots)
        .where(eq(timeSlots.id, timeSlotId));
      
      if (!timeSlot || !timeSlot.isAvailable) {
        return res.status(400).json({ message: "Time slot not available" });
      }
      
      // Create booking
      const [booking] = await db.insert(bookings).values({
        customerId: userId,
        salonId,
        serviceId,
        staffId,
        timeSlotId,
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        totalAmount: service.price,
        status: 'pending'
      }).returning();
      
      // Note: We don't need to update the timeSlots table anymore
      // Availability is now calculated dynamically based on bookings
      // The getAvailableTimeSlots function will exclude this slot
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Owner-specific endpoints

  // Get owner's salon
  app.get('/api/owner/salon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
      
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      res.json(salon);
    } catch (error) {
      console.error("Error fetching owner salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  // Create salon
  app.post('/api/salons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salonData = req.body;
      
      console.log("Creating salon for user:", userId, "with data:", salonData);
      
      // Validate required fields
      if (!salonData.name || !salonData.phone || !salonData.address) {
        return res.status(400).json({ 
          message: "Missing required fields: name, phone, and address are required" 
        });
      }
      
      const [salon] = await db.insert(salons).values({
        name: salonData.name,
        description: salonData.description || '',
        phone: salonData.phone,
        address: salonData.address,
        imageUrl: salonData.imageUrl || null,
        confirmationAmount: salonData.confirmationAmount || 0,
        ownerId: userId,
        isActive: true,
        averageRating: 0,
        totalReviews: 0
      }).returning();
      
      console.log("Created salon:", salon);
      res.json(salon);
    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(500).json({ 
        message: "Failed to create salon", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update salon
  app.put('/api/salons/:salonId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { salonId } = req.params;
      const salonData = req.body;
      
      // Verify ownership
      const [existingSalon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      if (!existingSalon || existingSalon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this salon" });
      }
      
      const [updatedSalon] = await db.update(salons)
        .set({ ...salonData, updatedAt: new Date() })
        .where(eq(salons.id, salonId))
        .returning();
      
      res.json(updatedSalon);
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(500).json({ message: "Failed to update salon" });
    }
  });

  // Add service to salon
  app.post('/api/salons/:salonId/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { salonId } = req.params;
      const serviceData = req.body;
      
      // Verify salon ownership
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to add services to this salon" });
      }
      
      const [service] = await db.insert(services).values({
        ...serviceData,
        salonId
      }).returning();
      
      res.json(service);
    } catch (error) {
      console.error("Error adding service:", error);
      res.status(500).json({ message: "Failed to add service" });
    }
  });

  // Update service
  app.put('/api/services/:serviceId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { serviceId } = req.params;
      const serviceData = req.body;
      
      // Verify ownership through salon
      const [service] = await db.select({
        service: services,
        salon: salons
      })
        .from(services)
        .innerJoin(salons, eq(services.salonId, salons.id))
        .where(eq(services.id, serviceId));
      
      if (!service || service.salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this service" });
      }
      
      const [updatedService] = await db.update(services)
        .set({ ...serviceData, updatedAt: new Date() })
        .where(eq(services.id, serviceId))
        .returning();
      
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Add staff to salon
  app.post('/api/salons/:salonId/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { salonId } = req.params;
      const staffData = req.body;
      
      // Verify salon ownership
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to add staff to this salon" });
      }
      
      const [staffMember] = await db.insert(staff).values({
        ...staffData,
        salonId
      }).returning();
      
      res.json(staffMember);
    } catch (error) {
      console.error("Error adding staff:", error);
      res.status(500).json({ message: "Failed to add staff" });
    }
  });

  // Update staff
  app.put('/api/staff/:staffId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { staffId } = req.params;
      const staffData = req.body;
      
      // Verify ownership through salon
      const [staffMember] = await db.select({
        staff: staff,
        salon: salons
      })
        .from(staff)
        .innerJoin(salons, eq(staff.salonId, salons.id))
        .where(eq(staff.id, staffId));
      
      if (!staffMember || staffMember.salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this staff member" });
      }
      
      const [updatedStaff] = await db.update(staff)
        .set({ ...staffData, updatedAt: new Date() })
        .where(eq(staff.id, staffId))
        .returning();
      
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  // Get owner's bookings
  app.get('/api/owner/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Get bookings for the owner's salon
      const ownerBookings = await db.select()
        .from(bookings)
        .innerJoin(salons, eq(bookings.salonId, salons.id))
        .where(eq(salons.ownerId, userId))
        .orderBy(desc(bookings.createdAt));
      
      res.json(ownerBookings.map(booking => booking.bookings));
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update salon images with ACL policy
  app.put("/api/salon-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "public", // Salon images should be public
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting salon image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Salon routes
  app.post("/api/salons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const salonData = insertSalonSchema.parse({ ...req.body, ownerId: userId });
      const salon = await storage.createSalon(salonData);
      res.json(salon);
    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(400).json({ message: "Invalid salon data" });
    }
  });

  app.get("/api/salons", async (req, res) => {
    try {
      const salons = await storage.getAllSalons();
      res.json(salons);
    } catch (error) {
      console.error("Error fetching salons:", error);
      res.status(500).json({ message: "Failed to fetch salons" });
    }
  });

  app.get("/api/salons/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salons = await storage.getSalonsByOwner(userId);
      res.json(salons);
    } catch (error) {
      console.error("Error fetching user salons:", error);
      res.status(500).json({ message: "Failed to fetch salons" });
    }
  });

  app.get("/api/salons/:id", async (req, res) => {
    try {
      const salon = await storage.getSalonById(req.params.id);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      res.json(salon);
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  app.put("/api/salons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.id);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this salon" });
      }

      const updatedSalon = await storage.updateSalon(req.params.id, req.body);
      res.json(updatedSalon);
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(500).json({ message: "Failed to update salon" });
    }
  });

  app.put("/api/salons/:id/image", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.id);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this salon" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      const updatedSalon = await storage.updateSalon(req.params.id, { imageUrl: objectPath });
      res.json({ objectPath, salon: updatedSalon });
    } catch (error) {
      console.error("Error setting salon image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service routes
  app.post("/api/salons/:salonId/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to add services to this salon" });
      }

      const serviceData = insertServiceSchema.parse({ ...req.body, salonId: req.params.salonId });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.get("/api/salons/:salonId/services", async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.params.salonId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.put("/api/services/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      // Note: In a real app, you'd verify ownership through the salon relationship
      const service = await storage.updateService(req.params.id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      // Note: In a real app, you'd verify ownership through the salon relationship
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Working hours routes
  app.post("/api/salons/:salonId/working-hours", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update working hours for this salon" });
      }

      const workingHourData = insertWorkingHoursSchema.parse({ ...req.body, salonId: req.params.salonId });
      const workingHour = await storage.upsertWorkingHours(workingHourData);
      res.json(workingHour);
    } catch (error) {
      console.error("Error updating working hours:", error);
      res.status(400).json({ message: "Invalid working hours data" });
    }
  });

  app.get("/api/salons/:salonId/working-hours", async (req, res) => {
    try {
      const workingHours = await storage.getWorkingHoursBySalon(req.params.salonId);
      res.json(workingHours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ message: "Failed to fetch working hours" });
    }
  });

  // Time slot routes
  app.post("/api/salons/:salonId/time-slots", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to create time slots for this salon" });
      }

      const timeSlotData = insertTimeSlotSchema.parse({ ...req.body, salonId: req.params.salonId });
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      console.error("Error creating time slot:", error);
      res.status(400).json({ message: "Invalid time slot data" });
    }
  });

  app.get("/api/salons/:salonId/time-slots", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      console.log(`Fetching time slots for salon ${req.params.salonId} on date ${date}`);

      // Only return manually created time slots - NO automatic generation
      const timeSlots = await storage.getAvailableTimeSlots(req.params.salonId, date);
      console.log(`Found ${timeSlots.length} manually created time slots`);
      
      res.json(timeSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  // Time slot management routes (for shopkeepers)
  app.post("/api/salons/:salonId/time-slots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage time slots for this salon" });
      }

      const { date, startTime, endTime } = req.body;
      
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ message: "Date, start time, and end time are required" });
      }

      const timeSlot = await storage.createTimeSlot({
        salonId: req.params.salonId,
        date,
        startTime,
        endTime,
        isAvailable: true
      });

      res.json(timeSlot);
    } catch (error) {
      console.error("Error creating time slot:", error);
      res.status(500).json({ message: "Failed to create time slot" });
    }
  });

  app.post("/api/salons/:salonId/time-slots/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage time slots for this salon" });
      }

      const { startDate, endDate, startTime, endTime, duration } = req.body;
      
      if (!startDate || !endDate || !startTime || !endTime || !duration) {
        return res.status(400).json({ message: "All fields are required for bulk generation" });
      }

      const slotsCreated = [];
      const durationMinutes = parseInt(duration);
      
      // Generate dates between startDate and endDate
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        // Skip Sundays (0) unless specifically configured
        if (date.getDay() === 0) continue;
        
        const dateString = date.toISOString().split('T')[0];
        
        // Generate time slots for this date
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let currentTime = new Date();
        currentTime.setHours(startHour, startMin, 0, 0);
        
        const dayEndTime = new Date();
        dayEndTime.setHours(endHour, endMin, 0, 0);
        
        while (currentTime < dayEndTime) {
          const slotStartTime = currentTime.toTimeString().substring(0, 5);
          
          // Calculate end time
          const slotEndTime = new Date(currentTime.getTime() + durationMinutes * 60000);
          const slotEndTimeString = slotEndTime.toTimeString().substring(0, 5);
          
          // Create the time slot
          const timeSlot = await storage.createTimeSlot({
            salonId: req.params.salonId,
            date: dateString,
            startTime: slotStartTime,
            endTime: slotEndTimeString,
            isAvailable: true
          });
          
          slotsCreated.push(timeSlot);
          
          // Move to next slot
          currentTime.setTime(currentTime.getTime() + durationMinutes * 60000);
        }
      }

      res.json({ 
        message: `Created ${slotsCreated.length} time slots`,
        slots: slotsCreated 
      });
    } catch (error) {
      console.error("Error creating bulk time slots:", error);
      res.status(500).json({ message: "Failed to create bulk time slots" });
    }
  });

  app.delete("/api/time-slots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Get the time slot to check ownership
      const timeSlot = await db.select().from(timeSlots).where(eq(timeSlots.id, req.params.id)).limit(1);
      if (!timeSlot.length) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      
      const salon = await storage.getSalonById(timeSlot[0].salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this time slot" });
      }

      // Check if the time slot is booked
      const slotBookings = await db.select().from(bookings)
        .where(and(
          eq(bookings.timeSlotId, req.params.id),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed"))
        ));
      
      if (slotBookings.length > 0) {
        return res.status(400).json({ message: "Cannot delete a time slot that has confirmed bookings" });
      }

      await db.delete(timeSlots).where(eq(timeSlots.id, req.params.id));
      
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      res.status(500).json({ message: "Failed to delete time slot" });
    }
  });

  // Clear all time slots for a salon (admin use)
  app.delete("/api/salons/:salonId/time-slots/clear", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to clear time slots for this salon" });
      }

      // Delete all time slots for this salon that are not booked
      const result = await db.delete(timeSlots)
        .where(and(
          eq(timeSlots.salonId, req.params.salonId),
          not(exists(
            db.select().from(bookings)
              .where(and(
                eq(bookings.timeSlotId, timeSlots.id),
                or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed"))
              ))
          ))
        ));
      
      res.json({ message: "All unboked time slots cleared successfully" });
    } catch (error) {
      console.error("Error clearing time slots:", error);
      res.status(500).json({ message: "Failed to clear time slots" });
    }
  });

  // Booking routes
  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const bookingData = insertBookingSchema.parse({ ...req.body, customerId: userId });
      
      // Mark the time slot as unavailable
      await storage.updateTimeSlotAvailability(bookingData.timeSlotId, false);
      
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.get("/api/bookings/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const bookings = await storage.getBookingsByCustomer(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/salons/:salonId/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const salon = await storage.getSalonById(req.params.salonId);
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view bookings for this salon" });
      }

      const bookings = await storage.getBookingsBySalon(req.params.salonId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching salon bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.put("/api/bookings/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { status, paymentId, paymentStatus } = req.body;
      await storage.updateBookingStatus(req.params.id, status, paymentId, paymentStatus);
      res.json({ message: "Booking status updated" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, customerId: userId });
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  app.get("/api/salons/:salonId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsBySalon(req.params.salonId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Payment webhook (Razorpay)
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      // Handle Razorpay webhook
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      // In a real app, verify the signature and update booking status
      // For now, just acknowledge receipt
      res.json({ message: "Webhook received" });
    } catch (error) {
      console.error("Error processing payment webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Time slots are now created manually only by salon owners - no automatic generation
