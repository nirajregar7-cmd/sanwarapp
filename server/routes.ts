import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { platformStats } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertSalonSchema, insertServiceSchema, insertWorkingHoursSchema, insertTimeSlotSchema, insertBookingSchema, insertReviewSchema, salons, users, bookings, services } from "@shared/schema";
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
        db.select({ count: count() }).from(salons).where(eq(salons.isApproved, true)),
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
      // Fetch all approved salons (since we may not have many yet)
      const featuredSalons = await db.select()
        .from(salons)
        .where(eq(salons.isApproved, true))
        .orderBy(desc(salons.averageRating), desc(salons.totalReviews))
        .limit(6);
      
      res.json(featuredSalons);
    } catch (error) {
      console.error("Error fetching featured salons:", error);
      res.status(500).json({ message: "Failed to fetch featured salons" });
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
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
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

      const timeSlots = await storage.getAvailableTimeSlots(req.params.salonId, date);
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
