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
import { eq, desc, isNotNull, sql, count } from "drizzle-orm";

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
      
      // Mark time slot as unavailable
      await db.update(timeSlots)
        .set({ isAvailable: false })
        .where(eq(timeSlots.id, timeSlotId));
      
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

      // Check if time slots exist for this date
      let timeSlots = await storage.getAvailableTimeSlots(req.params.salonId, date);
      console.log(`Found ${timeSlots.length} existing time slots`);
      
      // If no time slots exist for this date, auto-generate them
      if (timeSlots.length === 0) {
        console.log("No existing time slots, checking if should generate...");
        const requestDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log(`Request date: ${requestDate.toISOString()}`);
        console.log(`Today: ${today.toISOString()}`);
        console.log(`Is future?: ${requestDate >= today}`);
        
        // Only generate for future dates (not past dates)
        if (requestDate >= today) {
          console.log("Generating time slots...");
          await generateTimeSlots(req.params.salonId, date);
          timeSlots = await storage.getAvailableTimeSlots(req.params.salonId, date);
          console.log(`After generation: ${timeSlots.length} time slots`);
        }
      }
      
      res.json(timeSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
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

// Helper function to auto-generate time slots for a salon on a specific date
async function generateTimeSlots(salonId: string, date: string) {
  try {
    console.log(`Generating time slots for salon ${salonId} on date ${date}`);
    
    // Check if working hours exist for this salon
    let workingHours = await storage.getWorkingHoursBySalon(salonId);
    console.log('Existing working hours:', workingHours.length);
    
    // If no working hours exist, create default ones (9 AM to 6 PM, Monday to Saturday)
    if (workingHours.length === 0) {
      console.log('Creating default working hours...');
      const defaultHours = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Monday
        { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Tuesday
        { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Wednesday
        { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Thursday
        { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Friday
        { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isOpen: true }, // Saturday
        { dayOfWeek: 0, openTime: '10:00', closeTime: '16:00', isOpen: false }, // Sunday
      ];
      
      // Create default working hours using direct database insertion to avoid conflicts
      for (const hours of defaultHours) {
        try {
          const result = await db.insert(workingHours).values({
            salonId,
            ...hours
          }).execute();
          console.log(`Successfully created working hours for day ${hours.dayOfWeek}:`, result);
        } catch (error) {
          console.log(`Failed to create working hours for day ${hours.dayOfWeek}:`, error);
          // Try using storage method instead
          try {
            const result = await storage.upsertWorkingHours({
              salonId,
              ...hours
            });
            console.log(`Upserted working hours via storage:`, result);
          } catch (storageError) {
            console.log(`Storage upsert also failed:`, storageError);
          }
        }
      }
      
      // Refresh working hours
      workingHours = await storage.getWorkingHoursBySalon(salonId);
      console.log('Working hours after creation:', workingHours.length);
    }
    
    // Get the day of week for the requested date (0 = Sunday, 1 = Monday, etc.)
    const requestDate = new Date(date);
    const dayOfWeek = requestDate.getDay();
    console.log(`Day of week for ${date}: ${dayOfWeek}`);
    
    // Find working hours for this day
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    console.log('Day hours found:', dayHours);
    
    // If salon is closed on this day, don't generate time slots
    if (!dayHours || !dayHours.isOpen) {
      console.log('Salon is closed on this day or no hours found');
      return;
    }
    
    // Generate time slots every 30 minutes between opening and closing times
    const openTime = dayHours.openTime;
    const closeTime = dayHours.closeTime;
    
    if (!openTime || !closeTime) {
      return; // Skip if times are not set
    }
    
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const openTimeMinutes = openHour * 60 + openMinute;
    const closeTimeMinutes = closeHour * 60 + closeMinute;
    
    // Generate slots every 30 minutes
    for (let timeMinutes = openTimeMinutes; timeMinutes < closeTimeMinutes; timeMinutes += 30) {
      const hours = Math.floor(timeMinutes / 60);
      const minutes = timeMinutes % 60;
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Check if this time slot already exists
      const existingSlots = await storage.getAvailableTimeSlots(salonId, date);
      const slotExists = existingSlots.some(slot => slot.startTime === startTime);
      
      if (!slotExists) {
        const endTime = `${Math.floor((timeMinutes + 30) / 60).toString().padStart(2, '0')}:${((timeMinutes + 30) % 60).toString().padStart(2, '0')}`;
        console.log(`Creating time slot: ${startTime} - ${endTime}`);
        await storage.createTimeSlot({
          salonId,
          date,
          startTime,
          endTime,
          isAvailable: true
        });
      }
    }
  } catch (error) {
    console.error('Error generating time slots:', error);
  }
}
