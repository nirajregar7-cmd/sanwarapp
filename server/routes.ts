import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { db } from "./db";
import { platformStats } from "@shared/schema";
import { ObjectPermission } from "./objectAcl";
import { insertSalonSchema, insertServiceSchema, insertWorkingHoursSchema, insertTimeSlotSchema, insertBookingSchema, insertReviewSchema, salons, users, bookings, services, staff, reviews, workingHours, timeSlots, salonOwnerAccounts, revenueShares, notificationSettings, notificationHistory, pushSubscriptions } from "@shared/schema";
import { sendBookingConfirmationNotification } from "./notifications";
import { eq, desc, isNotNull, sql, count, and, or, not, exists } from "drizzle-orm";
import { createRazorpayOrder, verifyRazorpayPayment } from "./payment";
import { calculateRevenueShare } from "@shared/revenue";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("Auth check - isAuthenticated:", req.isAuthenticated?.(), "User:", req.user?.id);
      
      // For development, return null if no session exists
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.json(null);
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.json(null);
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(null);
    }
  });

  app.post('/api/auth/set-user-type', async (req: any, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userType } = req.body;
      if (!userType || !["customer", "salon_owner"].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      const updatedUser = await storage.updateUserType(userId, userType);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting user type:", error);
      res.status(500).json({ message: "Failed to set user type" });
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

  // Get current user's salon (for salon owners)
  app.get('/api/user/salon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user is salon owner
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user || user.userType !== "salon_owner") {
        return res.status(404).json({ message: "No salon found for this user" });
      }
      
      // Get user's salon
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
        
      if (!salon) {
        return res.status(404).json({ message: "No salon found for this user" });
      }
      
      res.json(salon);
    } catch (error) {
      console.error("Error fetching user salon:", error);
      res.status(500).json({ message: "Failed to fetch salon" });
    }
  });

  // Location-based salon search endpoint
  app.get('/api/salons/search', async (req, res) => {
    try {
      const { 
        lat, 
        lng, 
        radius = '50', // Default 50km radius
        name,
        minRating = '0',
        maxPrice = '10000'
      } = req.query;

      let query = db.select().from(salons).where(eq(salons.isActive, true));
      
      // Apply name filter
      if (name && typeof name === 'string') {
        query = query.where(sql`LOWER(${salons.name}) LIKE LOWER(${'%' + name + '%'})`);
      }
      
      // Apply rating filter
      if (minRating && typeof minRating === 'string') {
        const minRatingValue = parseFloat(minRating);
        if (minRatingValue > 0) {
          query = query.where(sql`${salons.averageRating} >= ${minRatingValue}`);
        }
      }
      
      // Apply price filter
      if (maxPrice && typeof maxPrice === 'string') {
        const maxPriceValue = parseInt(maxPrice);
        if (maxPriceValue < 10000) {
          query = query.where(sql`${salons.confirmationAmount} <= ${maxPriceValue}`);
        }
      }

      const allSalons = await query;
      
      // If location is provided, filter by distance
      if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);
        
        if (!isNaN(userLat) && !isNaN(userLng)) {
          const salonsWithDistance = allSalons
            .filter(salon => salon.latitude && salon.longitude)
            .map(salon => {
              const salonLat = parseFloat(salon.latitude!);
              const salonLng = parseFloat(salon.longitude!);
              
              // Calculate distance using Haversine formula
              const R = 6371; // Earth's radius in kilometers
              const dLat = (salonLat - userLat) * Math.PI / 180;
              const dLng = (salonLng - userLng) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLat * Math.PI / 180) * Math.cos(salonLat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              
              return {
                ...salon,
                distance
              };
            })
            .filter(salon => salon.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance);
          
          return res.json(salonsWithDistance);
        }
      }
      
      // If no location or invalid coordinates, return all matching salons
      res.json(allSalons);
    } catch (error) {
      console.error("Error searching salons:", error);
      res.status(500).json({ message: "Failed to search salons" });
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



  // Notification settings endpoints
  app.get('/api/notifications/settings/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      
      // Users can only access their own notification settings
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const [settings] = await db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
        
      // Create default settings if none exist
      if (!settings) {
        const [newSettings] = await db.insert(notificationSettings)
          .values({ userId })
          .returning();
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put('/api/notifications/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const updateData = req.body;
      
      // Update or create notification settings
      const [settings] = await db.insert(notificationSettings)
        .values({ userId, ...updateData })
        .onConflictDoUpdate({
          target: notificationSettings.userId,
          set: { ...updateData, updatedAt: new Date() }
        })
        .returning();
        
      res.json(settings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Push subscription endpoints
  app.post('/api/notifications/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { subscription } = req.body;
      const subscriptionData = JSON.parse(subscription);
      
      // Save push subscription
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscriptionData.endpoint,
        p256dhKey: subscriptionData.keys.p256dh,
        authKey: subscriptionData.keys.auth,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ success: true, message: "Push subscription saved" });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ message: "Failed to save push subscription" });
    }
  });

  // Notification history endpoints
  app.get('/api/notifications/history/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const history = await db.select()
        .from(notificationHistory)
        .where(eq(notificationHistory.userId, userId))
        .orderBy(desc(notificationHistory.sentAt))
        .limit(30);
        
      res.json(history);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      res.status(500).json({ message: "Failed to fetch notification history" });
    }
  });

  // Create booking endpoint
  // Create payment order for booking confirmation
  app.post('/api/bookings/create-payment-order', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId, serviceId, timeSlotId, date, staffId } = req.body;
      
      // Validate required fields
      if (!salonId || !serviceId || !timeSlotId || !date) {
        return res.status(400).json({ 
          message: "Missing required fields: salonId, serviceId, timeSlotId, and date are required" 
        });
      }
      
      // Get salon confirmation amount
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
        
      if (!salon) {
        return res.status(400).json({ message: "Salon not found" });
      }
      
      // Get service details for receipt
      const [service] = await db.select()
        .from(services)
        .where(eq(services.id, serviceId));
        
      if (!service) {
        return res.status(400).json({ message: "Service not found" });
      }
      
      // Check if time slot is available
      const [timeSlot] = await db.select()
        .from(timeSlots)
        .where(eq(timeSlots.id, timeSlotId));
        
      if (!timeSlot || !timeSlot.isAvailable) {
        return res.status(400).json({ message: "Time slot not available" });
      }
      
      // Check if slot is already booked for this date
      const [existingBooking] = await db.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.timeSlotId, timeSlotId),
            eq(bookings.date, date)
          )
        );
        
      if (existingBooking) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }
      
      // Create Razorpay order for confirmation amount
      const order = await createRazorpayOrder({
        amount: salon.confirmationAmount || 10, // Default ₹10 if not set
        receipt: `booking_${Date.now()}`,
        notes: {
          salonId,
          serviceId,
          timeSlotId,
          date,
          staffId: staffId || null,
          customerId: userId,
          salonName: salon.name,
          serviceName: service.name,
          servicePrice: service.price
        }
      });
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        confirmationAmount: salon.confirmationAmount || 10,
        servicePrice: service.price,
        salonName: salon.name,
        serviceName: service.name
      });
    } catch (error) {
      console.error("Error creating payment order:", error);
      res.status(500).json({ 
        message: "Failed to create payment order", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Verify payment and create booking
  app.post('/api/bookings/verify-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        salonId,
        serviceId,
        timeSlotId,
        date,
        staffId,
        notes
      } = req.body;
      
      // Verify payment signature
      const isValidPayment = verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      
      if (!isValidPayment) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }
      
      // Get service and time slot details
      const [service] = await db.select()
        .from(services)
        .where(eq(services.id, serviceId));
        
      const [timeSlot] = await db.select()
        .from(timeSlots)
        .where(eq(timeSlots.id, timeSlotId));
      
      if (!service || !timeSlot) {
        return res.status(400).json({ message: "Service or time slot not found" });
      }
      
      // Check if slot is still available
      const [existingBooking] = await db.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.timeSlotId, timeSlotId),
            eq(bookings.date, date)
          )
        );
        
      if (existingBooking) {
        return res.status(400).json({ message: "Time slot is no longer available" });
      }
      
      // Get salon confirmation amount for revenue calculation
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      const confirmationAmount = salon?.confirmationAmount || 10;
      
      // Create booking after successful payment
      const [booking] = await db.insert(bookings).values({
        customerId: userId,
        salonId,
        serviceId,
        staffId: staffId || null,
        timeSlotId,
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        totalAmount: service.price,
        status: 'confirmed',
        paymentId: razorpay_payment_id,
        paymentStatus: 'completed'
      }).returning();
      
      // Calculate and record revenue share
      const revenueShare = calculateRevenueShare(confirmationAmount);
      await db.insert(revenueShares).values({
        bookingId: booking.id,
        confirmationAmount: confirmationAmount.toString(),
        platformShare: revenueShare.platformShare.toString(),
        salonShare: revenueShare.salonShare.toString(),
        transferStatus: 'pending'
      });
      
      // Handle referral tracking for all referral types
      try {
        const [referralRecord] = await db.select()
          .from(referrals)
          .where(and(
            eq(referrals.referredId, userId),
            eq(referrals.status, "pending")
          ));

        if (referralRecord) {
          // Complete the referral
          await storage.completeReferral(referralRecord.id, booking.id);
          
          // Check referral type and handle accordingly
          const [referrer] = await db.select()
            .from(users)
            .where(eq(users.id, referralRecord.referrerId));

          if (referrer) {
            if (referralRecord.referralType === "customer_to_shopkeeper") {
              // Customer referred a shopkeeper - give customer 1 free booking credit immediately
              const avgServicePrice = await storage.calculateAverageServicePrice();
              
              await storage.createFreeBookingCredit({
                customerId: referralRecord.referrerId, // Give to the referrer (customer)
                creditType: "shopkeeper_referral",
                maxAmount: avgServicePrice.toString(),
                referenceId: referralRecord.id,
                description: `Free booking for referring a shopkeeper (up to ₹${avgServicePrice})`,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
              });

              console.log(`✅ Customer ${referrer.firstName} earned free booking for referring shopkeeper!`);
              
            } else if (referralRecord.referralType === "customer_to_customer") {
              // Customer referred another customer - update 10-customer milestone
              const milestoneCompleted = await storage.updateCustomerReferralProgress(
                referralRecord.referrerId,
                referralRecord.id
              );

              if (milestoneCompleted) {
                console.log(`🎉 Customer ${referrer.firstName} completed 10-customer milestone!`);
              }

              // Add regular referral reward to customer wallet
              await storage.addWalletCredit(
                userId,
                parseFloat(referralRecord.rewardAmount.toString()),
                "Referral reward for completing first booking",
                referralRecord.id,
                "referral"
              );
              
            } else if (referralRecord.referralType === "shopkeeper_milestone" && referrer.userType === "salon_owner") {
              // Shopkeeper milestone referral - existing logic
              const milestoneCompleted = await storage.updateReferralMilestoneProgress(
                referralRecord.referrerId,
                booking.id,
                confirmationAmount
              );

              if (milestoneCompleted) {
                console.log(`🎉 Shopkeeper milestone completed for ${referrer.firstName}! 5-customer reward credited.`);
              }
            }
          }
        }
      } catch (referralError) {
        console.error("Error processing referral:", referralError);
        // Don't fail the booking if referral processing fails
      }

      // Send booking confirmation notification
      try {
        await sendBookingConfirmationNotification(booking.id);
      } catch (notificationError) {
        console.error("Failed to send booking confirmation notification:", notificationError);
        // Don't fail the booking if notification fails
      }

      console.log("Created booking after payment:", booking);
      res.json({ 
        success: true, 
        booking,
        message: "Booking confirmed! You've paid the confirmation amount. Pay the remaining service cost at the salon."
      });
    } catch (error) {
      console.error("Error verifying payment and creating booking:", error);
      res.status(500).json({ 
        message: "Failed to verify payment and create booking", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get salon owner account details
  app.get('/api/owner/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Get salon owned by this user
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
      
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      // Get account details
      const [account] = await db.select()
        .from(salonOwnerAccounts)
        .where(eq(salonOwnerAccounts.salonId, salon.id));
      
      res.json(account || null);
    } catch (error) {
      console.error("Error fetching account details:", error);
      res.status(500).json({ message: "Failed to fetch account details" });
    }
  });

  // Create or update salon owner account details
  app.post('/api/owner/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const accountData = req.body;
      
      // Validate required fields
      if (!accountData.bankName || !accountData.accountHolderName || !accountData.accountNumber || !accountData.ifscCode) {
        return res.status(400).json({ 
          message: "Missing required fields: bankName, accountHolderName, accountNumber, and ifscCode are required" 
        });
      }
      
      // Get salon owned by this user
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
      
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      // Check if account already exists
      const [existingAccount] = await db.select()
        .from(salonOwnerAccounts)
        .where(eq(salonOwnerAccounts.salonId, salon.id));
      
      let account;
      if (existingAccount) {
        // Update existing account
        [account] = await db.update(salonOwnerAccounts)
          .set({
            bankName: accountData.bankName,
            accountHolderName: accountData.accountHolderName,
            accountNumber: accountData.accountNumber,
            ifscCode: accountData.ifscCode,
            branch: accountData.branch || null,
            upiId: accountData.upiId || null,
            isVerified: false, // Reset verification on update
            updatedAt: new Date()
          })
          .where(eq(salonOwnerAccounts.salonId, salon.id))
          .returning();
      } else {
        // Create new account
        [account] = await db.insert(salonOwnerAccounts).values({
          salonId: salon.id,
          bankName: accountData.bankName,
          accountHolderName: accountData.accountHolderName,
          accountNumber: accountData.accountNumber,
          ifscCode: accountData.ifscCode,
          branch: accountData.branch || null,
          upiId: accountData.upiId || null,
          isVerified: false
        }).returning();
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error saving account details:", error);
      res.status(500).json({ 
        message: "Failed to save account details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get revenue summary for salon owner
  app.get('/api/owner/revenue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Get salon owned by this user
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
      
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      // Get revenue shares for bookings at this salon
      const revenueData = await db.select({
        totalEarnings: sql`COALESCE(SUM(${revenueShares.salonShare}), 0)`,
        platformCommission: sql`COALESCE(SUM(${revenueShares.platformShare}), 0)`,
        totalBookings: sql`COUNT(*)`,
        pendingTransfers: sql`COALESCE(SUM(CASE WHEN ${revenueShares.transferStatus} = 'pending' THEN ${revenueShares.salonShare} ELSE 0 END), 0)`,
        completedTransfers: sql`COALESCE(SUM(CASE WHEN ${revenueShares.transferStatus} = 'completed' THEN ${revenueShares.salonShare} ELSE 0 END), 0)`
      })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .where(eq(bookings.salonId, salon.id));
      
      res.json(revenueData[0] || {
        totalEarnings: "0",
        platformCommission: "0", 
        totalBookings: "0",
        pendingTransfers: "0",
        completedTransfers: "0"
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Legacy booking endpoint (now redirects to payment flow)
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    return res.status(400).json({
      message: "Direct booking not allowed. Please use payment flow: /api/bookings/create-payment-order then /api/bookings/verify-payment"
    });
  });

  // Owner-specific endpoints

  // Get owner's salon
  app.get('/api/owner/salon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
        confirmationAmount: salonData.confirmationAmount ? Number(salonData.confirmationAmount) : 0,
        ownerId: userId,
        isActive: true,
        averageRating: "0",
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
      
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
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    // Get user ID if authenticated, but don't require authentication
    const userId = req.isAuthenticated && req.isAuthenticated() ? req.user?.id : undefined;
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
      console.log("Getting upload URL for user:", req.user?.id);
      
      // Check if ObjectStorageService can be instantiated
      console.log("Creating ObjectStorageService...");
      const objectStorageService = new ObjectStorageService();
      console.log("ObjectStorageService created successfully");
      
      // Try to get upload URL
      console.log("Getting upload URL...");
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Generated upload URL:", uploadURL);
      console.log("Returning response:", { uploadURL });
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error", error instanceof Error ? error.stack : "");
      res.status(500).json({ error: "Failed to get upload URL", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update salon images with ACL policy
  app.put("/api/salon-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = req.user?.id;

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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = (req.user as any)?.claims?.sub;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
      
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
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
      const userId = req.user?.id;
      const bookings = await storage.getBookingsByCustomer(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/salons/:salonId/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
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



  // Gallery routes
  app.post("/api/salons/:salonId/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;
      const { imageUrl, title, description, category } = req.body;
      
      // Verify salon ownership
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this salon's gallery" });
      }
      
      // Check if salon already has 10 images
      const existingImages = await storage.getGalleryImagesBySalon(salonId);
      if (existingImages.length >= 10) {
        return res.status(400).json({ message: "Maximum 10 images allowed per salon" });
      }

      // Set ACL policy for the uploaded image to make it public for customers
      const objectStorageService = new ObjectStorageService();
      console.log("Original imageUrl:", imageUrl);
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageUrl,
        {
          owner: userId,
          visibility: "public", // Make gallery images public so customers can view them
        },
      );
      console.log("Normalized objectPath:", objectPath);
      
      const galleryImage = await storage.createGalleryImage({
        salonId,
        imageUrl: objectPath, // Use the normalized object path
        title,
        description,
        category: category || 'work',
        order: existingImages.length + 1
      });
      
      res.json(galleryImage);
    } catch (error) {
      console.error("Error adding gallery image:", error);
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });

  app.get("/api/salons/:salonId/gallery", async (req, res) => {
    try {
      const { salonId } = req.params;
      const galleryImages = await storage.getGalleryImagesBySalon(salonId);
      res.json(galleryImages);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.put("/api/salons/:salonId/gallery/:imageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId, imageId } = req.params;
      const { title, description, category } = req.body;
      
      // Verify salon ownership
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this salon's gallery" });
      }
      
      const updatedImage = await storage.updateGalleryImage(imageId, {
        title,
        description,
        category
      });
      
      if (!updatedImage) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });

  app.delete("/api/salons/:salonId/gallery/:imageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId, imageId } = req.params;
      
      // Verify salon ownership
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this salon's gallery" });
      }
      
      await storage.deleteGalleryImage(imageId);
      res.json({ message: "Gallery image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
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

  // Referral milestone endpoint for shopkeepers
  app.get('/api/referral-milestone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user is a salon owner
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || user.userType !== "salon_owner") {
        return res.status(403).json({ message: "Access denied. Only salon owners can view referral milestones." });
      }

      const milestone = await storage.getOrCreateReferralMilestone(userId);
      res.json(milestone);
    } catch (error) {
      console.error("Error fetching referral milestone:", error);
      res.status(500).json({ message: "Failed to fetch referral milestone" });
    }
  });

  // Customer referral system endpoints
  app.post('/api/referrals/generate-code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user is a customer
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || user.userType !== "customer") {
        return res.status(403).json({ message: "Only customers can generate referral codes." });
      }

      const referralCode = await storage.generateUniqueReferralCode();
      res.json({ referralCode, shareUrl: `${req.protocol}://${req.hostname}/signup?ref=${referralCode}` });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  app.get('/api/referrals/campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user is a customer
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || user.userType !== "customer") {
        return res.status(403).json({ message: "Only customers can view referral campaigns." });
      }

      const campaign = await storage.getOrCreateCustomerReferralCampaign(userId);
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching referral campaign:", error);
      res.status(500).json({ message: "Failed to fetch referral campaign" });
    }
  });

  app.get('/api/free-credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user is a customer
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || user.userType !== "customer") {
        return res.status(403).json({ message: "Only customers can view free booking credits." });
      }

      const credits = await storage.getAvailableFreeCredits(userId);
      res.json(credits);
    } catch (error) {
      console.error("Error fetching free credits:", error);
      res.status(500).json({ message: "Failed to fetch free credits" });
    }
  });

  app.get('/api/referral/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);
      
      if (!referral) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      // Get referrer info
      const [referrer] = await db.select({
        id: users.id,
        firstName: users.firstName,
        userType: users.userType,
      }).from(users).where(eq(users.id, referral.referrerId));

      res.json({ 
        code,
        referrer: referrer || null,
        referralType: referral.referralType,
        isValid: referral.status === "pending"
      });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  // Create referral code endpoint
  app.post('/api/referrals/create', isAuthenticated, async (req: any, res) => {
    try {
      const { referralType, targetUserType } = req.body;
      const referrerId = req.user?.id;

      // Validate referral type
      const validTypes = ["customer_to_customer", "customer_to_shopkeeper"];
      if (!validTypes.includes(referralType)) {
        return res.status(400).json({ message: "Invalid referral type" });
      }

      // Only customers can create referrals
      const [referrer] = await db.select()
        .from(users)
        .where(eq(users.id, referrerId));

      if (!referrer || referrer.userType !== "customer") {
        return res.status(403).json({ message: "Only customers can create referral codes" });
      }

      // Generate unique referral code
      const referralCode = await storage.generateUniqueReferralCode();

      // Create referral record without referredId (will be filled during signup)
      const newReferral = await storage.createReferral({
        referrerId,
        referredId: null, // Will be filled during signup
        referralCode,
        referralType,
        status: "pending",
        rewardAmount: referralType === "customer_to_customer" ? "50" : "0",
      });

      const shareUrl = `${req.protocol}://${req.hostname}/signup?ref=${referralCode}&type=${targetUserType || 'customer'}`;
      
      res.json({
        id: newReferral.id,
        referralCode,
        referralType,
        shareUrl,
        message: referralType === "customer_to_customer" 
          ? "Share this code with friends! You'll earn 1 free booking when 10 friends complete their first booking."
          : "Share this code with salon owners! You'll earn 1 free booking when they sign up."
      });
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ message: "Failed to create referral code" });
    }
  });

  // Notification settings endpoints
  app.get('/api/notification-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const [settings] = await db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
      
      if (!settings) {
        // Create default settings if they don't exist
        const [newSettings] = await db.insert(notificationSettings)
          .values({ userId })
          .returning();
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put('/api/notification-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const settings = req.body;
      
      const [updatedSettings] = await db.update(notificationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(notificationSettings.userId, userId))
        .returning();
      
      if (!updatedSettings) {
        // Create if doesn't exist
        const [newSettings] = await db.insert(notificationSettings)
          .values({ userId, ...settings })
          .returning();
        return res.json(newSettings);
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Push subscription endpoints
  app.post('/api/push-subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { endpoint, p256dhKey, authKey, userAgent } = req.body;
      
      // Check if subscription already exists
      const [existingSubscription] = await db.select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        ));
      
      if (existingSubscription) {
        return res.json(existingSubscription);
      }
      
      const [subscription] = await db.insert(pushSubscriptions)
        .values({
          userId,
          endpoint,
          p256dhKey,
          authKey,
          userAgent: userAgent || null
        })
        .returning();
      
      res.json(subscription);
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ message: "Failed to save push subscription" });
    }
  });

  app.delete('/api/push-subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { endpoint } = req.body;
      
      await db.update(pushSubscriptions)
        .set({ isActive: false })
        .where(and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ message: "Failed to remove push subscription" });
    }
  });

  // Notification history endpoint
  app.get('/api/notification-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await db.select()
        .from(notificationHistory)
        .where(eq(notificationHistory.userId, userId))
        .orderBy(desc(notificationHistory.sentAt))
        .limit(limit);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      res.status(500).json({ message: "Failed to fetch notification history" });
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
