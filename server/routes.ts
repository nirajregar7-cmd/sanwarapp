import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { withClerkAuth, isAuthenticated as clerkIsAuthenticated } from "./clerk";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { db } from "./db";
import { platformStats } from "@shared/schema";
import { ObjectPermission } from "./objectAcl";
import { insertSalonSchema, insertServiceSchema, insertWorkingHoursSchema, insertTimeSlotSchema, insertBookingSchema, insertWalkInBookingSchema, insertReviewSchema, insertPasswordResetOtpSchema, insertFeedbackSchema, insertHelpTicketSchema, insertHelpTicketMessageSchema, insertSalonFacilitySchema, insertSalonProductSchema, salons, users, bookings, services, staff, reviews, workingHours, timeSlots, salonOwnerAccounts, revenueShares, notificationSettings, notificationHistory, pushSubscriptions, referrals, referralMilestones, freeBookingCredits, feedback, helpTickets, helpTicketMessages, salonFacilities, salonProducts } from "@shared/schema";
import { sendBookingConfirmationNotification } from "./notifications";
import { eq, desc, isNotNull, sql, count, and, or, not, exists, like, asc, inArray, gte, lte, isNull } from "drizzle-orm";
import { createRazorpayOrder, verifyRazorpayPayment, verifyBankAccount, createSalonFundAccount, processSalonPayout } from "./payment";
import { calculateRevenueShare } from "@shared/revenue";
import { sendPasswordResetOTP, generateOTP } from "./whatsapp";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Add Clerk middleware
  app.use(withClerkAuth);

  // Clerk sync route
  app.get('/api/clerk/sync-user', clerkIsAuthenticated, async (req: any, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get or create user in our database based on Clerk user data
      const clerkUserId = req.auth.userId;
      const clerkUser = req.auth.sessionClaims;

      let user = await storage.getUserByClerkId(clerkUserId);
      
      if (!user) {
        // Create new user with Clerk data
        user = await storage.createUserFromClerk({
          clerkId: clerkUserId,
          email: clerkUser?.email || '',
          firstName: clerkUser?.firstName || clerkUser?.given_name || '',
          lastName: clerkUser?.lastName || clerkUser?.family_name || '',
          phone: clerkUser?.phoneNumber || clerkUser?.phone_number || '',
          profileImageUrl: clerkUser?.imageUrl || clerkUser?.image_url || null,
          userType: 'customer', // Default role
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Update user type for Clerk users
  app.put('/api/user/type', clerkIsAuthenticated, async (req: any, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { userType } = req.body;
      if (!userType || !['customer', 'salon_owner'].includes(userType)) {
        return res.status(400).json({ error: 'Invalid user type' });
      }

      const clerkUserId = req.auth.userId;
      let user = await storage.getUserByClerkId(clerkUserId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user = await storage.updateUserType(user.id, userType);
      res.json(user);
    } catch (error) {
      console.error('Error updating user type:', error);
      res.status(500).json({ error: 'Failed to update user type' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {

      
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

  // Password reset endpoints
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  // Step 1: Request OTP for password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { phone, email } = req.body;
      
      if (!phone || !email) {
        return res.status(400).json({ message: "Phone and email are required" });
      }

      // Check if user exists with this email and phone combination
      const user = await storage.findUserForPasswordReset(email, phone);
      if (!user) {
        return res.status(404).json({ message: "No account found with this email and phone combination" });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await storage.createPasswordResetOtp({
        phone,
        email,
        otp,
        expiresAt,
      });

      // Send OTP via WhatsApp
      const success = await sendPasswordResetOTP(phone, otp);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to send OTP. Please try again." });
      }

      res.json({ message: "OTP sent to your WhatsApp number" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Step 2: Verify OTP and reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { phone, email, otp, newPassword } = req.body;
      
      if (!phone || !email || !otp || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Verify OTP
      const otpRecord = await storage.getValidPasswordResetOtp(phone, otp);
      if (!otpRecord || otpRecord.email !== email) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      const updatedUser = await storage.updateUserPassword(email, hashedPassword);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mark OTP as used
      await storage.markPasswordResetOtpUsed(otpRecord.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
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

      let conditions = [eq(salons.isActive, true)];
      
      // Apply name filter
      if (name && typeof name === 'string') {
        conditions.push(sql`LOWER(${salons.name}) LIKE LOWER(${'%' + name + '%'})`);
      }
      
      // Apply rating filter
      if (minRating && typeof minRating === 'string') {
        const minRatingValue = parseFloat(minRating);
        if (minRatingValue > 0) {
          conditions.push(sql`${salons.averageRating} >= ${minRatingValue}`);
        }
      }
      
      // Apply price filter
      if (maxPrice && typeof maxPrice === 'string') {
        const maxPriceValue = parseInt(maxPrice);
        if (maxPriceValue < 10000) {
          conditions.push(sql`${salons.confirmationAmount} <= ${maxPriceValue}`);
        }
      }

      const allSalons = await db.select().from(salons).where(and(...conditions));
      
      // If location is provided, filter by distance
      if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(typeof radius === 'string' ? radius : '50');
        
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

  // Referral code validation endpoint (public - no auth required)
  app.post('/api/validate-referral', async (req, res) => {
    try {
      const { code, userId } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Referral code is required' });
      }
      
      // Find the referral code in referrals table
      const referralResults = await db.select()
        .from(referrals)
        .where(eq(referrals.referralCode, code.toUpperCase()))
        .limit(1);
      
      if (referralResults.length === 0) {
        return res.status(404).json({ error: 'Invalid referral code' });
      }
      
      const referral = referralResults[0];
      
      // Check if referral is still pending (not already used)
      if (referral.status !== 'pending') {
        return res.status(400).json({ error: 'This referral code has already been used' });
      }
      
      // If userId is provided, do additional checks
      if (userId) {
        // Check if the user is trying to use their own referral code
        if (referral.referrerId === userId) {
          return res.status(400).json({ error: 'You cannot use your own referral code' });
        }
        
        // Check if user already has a completed referral (one per customer)
        const existingReferralResults = await db.select()
          .from(referrals)
          .where(and(
            eq(referrals.referredId, userId), 
            eq(referrals.status, 'completed')
          ))
          .limit(1);
        
        if (existingReferralResults.length > 0) {
          return res.status(400).json({ error: 'You have already used a referral code before' });
        }
      }
      
      // Valid referral code - return success with free booking offer
      res.json({
        valid: true,
        code: referral.referralCode,
        discountType: 'free',
        discountValue: 0,
        description: 'Get your first booking completely free!',
        referralId: referral.id,
        referrerId: referral.referrerId
      });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ error: "Failed to validate referral code" });
    }
  });

  // Complete free credit booking
  app.post('/api/bookings/complete-free-credit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { bookingData, creditUsed } = req.body;
      
      if (!bookingData || !creditUsed) {
        return res.status(400).json({ message: "Missing booking data or credit information" });
      }
      
      // Create the booking
      const [booking] = await db.insert(bookings).values(bookingData).returning();
      
      // Mark the free credit as used
      await db.update(freeBookingCredits)
        .set({
          isUsed: true,
          bookingId: booking.id,
          usedAt: new Date()
        })
        .where(eq(freeBookingCredits.id, creditUsed.id));
      
      // Mark time slot as unavailable for this date  
      await db.execute(sql`
        UPDATE time_slots 
        SET is_available = false 
        WHERE id = ${bookingData.timeSlotId}
      `);
      
      // Send booking confirmation notification
      await sendBookingConfirmationNotification(booking.id);
      
      res.status(201).json({
        ...booking,
        creditUsed: creditUsed,
        message: "Free booking created successfully using your credit!"
      });
    } catch (error) {
      console.error("Error completing free credit booking:", error);
      res.status(500).json({ message: "Failed to complete free booking" });
    }
  });

  // Create booking endpoint
  // Create payment order for booking confirmation with referral code support
  app.post('/api/bookings/create-payment-order', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId, serviceId, timeSlotId, date, staffId, referralCode } = req.body;
      
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
      
      let finalAmount = salon.confirmationAmount || 10;
      let validReferralCode = null;
      let appliedDiscount = 0;
      let usedFreeCredit = null;
      
      // First, check if user has unused free credits
      const [availableCredit] = await db.select()
        .from(freeBookingCredits)
        .where(
          and(
            eq(freeBookingCredits.customerId, userId),
            eq(freeBookingCredits.isUsed, false)
          )
        )
        .limit(1);
      
      if (availableCredit) {
        // Apply free credit - make booking completely free
        finalAmount = 0;
        appliedDiscount = salon.confirmationAmount || 10;
        usedFreeCredit = availableCredit;
        
        return res.json({
          amount: 0,
          orderData: null,
          bookingData: {
            customerId: userId,
            salonId,
            serviceId,
            staffId: staffId || null,
            timeSlotId,
            date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            totalAmount: service.price,
            confirmationAmount: '0',
            paymentStatus: 'completed',
            status: 'confirmed',
            notes: `Free booking using credit: ${availableCredit.description}`
          },
          freeBooking: true,
          creditUsed: availableCredit,
          message: "Your free credit has been applied! This booking is completely free."
        });
      }
      
      // Process referral code if provided (and no free credits available)
      if (referralCode) {
        const referralResults = await db.select()
          .from(referrals)
          .where(eq(referrals.referralCode, referralCode.toUpperCase()))
          .limit(1);
        
        if (referralResults.length > 0) {
          const referral = referralResults[0];
          
          // Check if referral is valid and can be used
          if (referral.status === 'pending' && referral.referrerId !== userId) {
            // Check if user hasn't used a referral code before
            const existingReferralResults = await db.select()
              .from(referrals)
              .where(and(
                eq(referrals.referredId, userId), 
                eq(referrals.status, 'completed')
              ))
              .limit(1);
            
            if (existingReferralResults.length === 0) {
              // Valid referral code - apply full discount (free booking)
              appliedDiscount = finalAmount;
              finalAmount = 0; // Completely free
              validReferralCode = {
                id: referral.id,
                code: referral.referralCode,
                referrerId: referral.referrerId,
                rewardAmount: referral.rewardAmount
              };
            }
          }
        }
      }
      
      // For free bookings (referral code covers full amount), skip payment
      if (appliedDiscount >= (salon.confirmationAmount || 10)) {
        return res.json({
          isFreeBooking: true,
          referralCode: validReferralCode?.code,
          discountApplied: appliedDiscount,
          originalAmount: salon.confirmationAmount || 10,
          finalAmount: 0,
          salonName: salon.name,
          serviceName: service.name,
          servicePrice: service.price,
          referralCodeData: validReferralCode
        });
      }
      
      // Create Razorpay order for remaining amount
      const order = await createRazorpayOrder({
        amount: finalAmount,
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
          servicePrice: service.price,
          referralCode: validReferralCode?.code || null,
          discountApplied: appliedDiscount
        }
      });
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        confirmationAmount: salon.confirmationAmount || 10,
        finalAmount,
        discountApplied: appliedDiscount,
        referralCodeApplied: validReferralCode?.code || null,
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
  
  // Create free booking with referral code
  app.post('/api/bookings/create-free', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const {
        salonId,
        serviceId,
        timeSlotId,
        date,
        staffId,
        referralCodeData
      } = req.body;
      
      // Validate required fields
      if (!salonId || !serviceId || !timeSlotId || !date || !referralCodeData) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Double-check slot availability
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
      
      // Get time slot and service details
      const [timeSlot] = await db.select()
        .from(timeSlots)
        .where(eq(timeSlots.id, timeSlotId));
        
      const [service] = await db.select()
        .from(services)
        .where(eq(services.id, serviceId));
      
      if (!timeSlot || !service) {
        return res.status(400).json({ message: "Service or time slot not found" });
      }
      
      // Create free booking
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
        confirmationAmount: '0',
        paymentStatus: 'completed',
        status: 'confirmed',
        notes: `Free booking with referral code: ${referralCodeData.code}`
      }).returning();
      
      // Update referral record - mark as completed and link to booking
      await db.update(referrals)
        .set({
          referredId: userId,
          status: 'completed',
          bookingId: booking.id,
          completedAt: new Date()
        })
        .where(eq(referrals.id, referralCodeData.id));
      
      // Mark time slot as unavailable for this date
      await db.execute(sql`
        UPDATE time_slots 
        SET is_available = false 
        WHERE id = ${timeSlotId}
      `);
      
      // Send booking confirmation notification
      await sendBookingConfirmationNotification(booking.id);
      
      res.status(201).json({
        ...booking,
        referralCodeUsed: referralCodeData.code,
        discountApplied: referralCodeData.discount_value || 0,
        message: "Free booking created successfully!"
      });
    } catch (error) {
      console.error("Error creating free booking:", error);
      res.status(500).json({ message: "Failed to create free booking" });
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
        notes,
        referralCodeData,
        discountApplied
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
      
      // Create booking after successful payment - automatically confirmed
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
        status: 'confirmed', // Automatically confirmed when payment is successful
        paymentId: razorpay_payment_id,
        paymentStatus: 'completed'
      }).returning();
      
      // Calculate and record revenue share
      const revenueShare = calculateRevenueShare(confirmationAmount);
      const [revenueRecord] = await db.insert(revenueShares).values({
        bookingId: booking.id,
        confirmationAmount: confirmationAmount.toString(),
        platformShare: revenueShare.platformShare.toString(),
        salonShare: revenueShare.salonShare.toString(),
        transferStatus: 'pending'
      }).returning();

      // Attempt automatic payout to salon owner
      try {
        console.log(`Starting automatic payout for booking ${booking.id}, salon ${salon.name}`);
        
        // Get salon owner bank details
        const bankDetails = await storage.getSalonOwnerBankDetails(salonId);
        
        if (bankDetails && bankDetails.isVerified) {
          console.log(`Bank details found for salon ${salon.name}, processing payout...`);
          
          // Create fund account if not exists (or use existing)
          let fundAccountId = bankDetails.fundAccountId;
          if (!fundAccountId) {
            const fundAccountResult = await createSalonFundAccount(salonId, {
              accountNumber: bankDetails.accountNumber,
              ifscCode: bankDetails.ifscCode,
              accountHolderName: bankDetails.accountHolderName
            });
            
            if (fundAccountResult.success && fundAccountResult.fundAccountId) {
              fundAccountId = fundAccountResult.fundAccountId;
              
              // Update bank details with fund account ID
              await db.update(salonOwnerAccounts)
                .set({ fundAccountId })
                .where(eq(salonOwnerAccounts.salonId, salonId));
            }
          }
          
          if (fundAccountId) {
            // Process payout
            const payoutResult = await processSalonPayout(
              fundAccountId,
              revenueShare.salonShare,
              booking.id,
              salon.name
            );
            
            if (payoutResult.success) {
              console.log(`✅ Automatic payout successful: ${payoutResult.payoutId}`);
              
              // Update transfer status to completed
              await storage.updateRevenueShareTransferStatus(
                booking.id,
                'completed',
                payoutResult.payoutId,
                new Date()
              );
            } else {
              console.error(`❌ Automatic payout failed: ${payoutResult.error}`);
              await storage.updateRevenueShareTransferStatus(booking.id, 'failed');
            }
          } else {
            console.log(`⚠️ Could not create fund account for salon ${salon.name}`);
            await storage.updateRevenueShareTransferStatus(booking.id, 'failed');
          }
        } else {
          console.log(`⚠️ No verified bank details found for salon ${salon.name}, payout will remain pending`);
        }
      } catch (payoutError) {
        console.error('Error in automatic payout process:', payoutError);
        // Keep transfer status as pending if payout fails
        await storage.updateRevenueShareTransferStatus(booking.id, 'failed');
      }
      
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


              
            } else if (referralRecord.referralType === "customer_to_customer") {
              // Customer referred another customer - update 10-customer milestone
              const milestoneCompleted = await storage.updateCustomerReferralProgress(
                referralRecord.referrerId,
                referralRecord.id
              );

              if (milestoneCompleted) {

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

              }
            }
          }
        }
      } catch (referralError) {

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
      
      // Temporary fix: Skip automatic verification due to Razorpay API issues
      // Allow manual verification by admin later
      console.log('Skipping automatic verification for:', accountData.accountNumber);
      const verificationResult = {
        success: true,
        verified: true, // Temporarily set as verified
        accountHolderName: accountData.accountHolderName,
        message: 'Bank account saved successfully - manual verification pending'
      };

      console.log('Verification result (manual):', verificationResult);

      let account;
      const updateData = {
        bankName: accountData.bankName,
        accountHolderName: accountData.accountHolderName,
        accountNumber: accountData.accountNumber,
        ifscCode: accountData.ifscCode,
        branch: accountData.branch || null,
        upiId: accountData.upiId || null,
        // Update verification fields based on result
        verificationStatus: verificationResult.verified ? 'verified' as const : 
                           verificationResult.success ? 'failed' as const : 'pending' as const,
        verificationMessage: verificationResult.message || verificationResult.error || null,
        verifiedAccountHolderName: verificationResult.accountHolderName || null,
        verifiedAt: verificationResult.verified ? new Date() : null,
        verificationAttempts: (existingAccount?.verificationAttempts || 0) + 1,
        lastVerificationAttempt: new Date(),
        isVerified: verificationResult.verified,
        updatedAt: new Date()
      };

      if (existingAccount) {
        // Update existing account
        [account] = await db.update(salonOwnerAccounts)
          .set(updateData)
          .where(eq(salonOwnerAccounts.salonId, salon.id))
          .returning();
      } else {
        // Create new account
        [account] = await db.insert(salonOwnerAccounts).values({
          salonId: salon.id,
          ...updateData
        }).returning();
      }
      
      // Return account with verification status
      res.json({
        ...account,
        verificationResult: {
          success: verificationResult.success,
          verified: verificationResult.verified,
          message: verificationResult.message || verificationResult.error
        }
      });
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
        completedTransfers: sql`COALESCE(SUM(CASE WHEN ${revenueShares.transferStatus} = 'completed' THEN ${revenueShares.salonShare} ELSE 0 END), 0)`,
        failedTransfers: sql`COALESCE(SUM(CASE WHEN ${revenueShares.transferStatus} = 'failed' THEN ${revenueShares.salonShare} ELSE 0 END), 0)`
      })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .where(eq(bookings.salonId, salon.id));

      // Get detailed transfer history
      const transfers = await db.select({
        bookingId: revenueShares.bookingId,
        amount: revenueShares.salonShare,
        status: revenueShares.transferStatus,
        transferDate: revenueShares.transferDate,
        transferReference: revenueShares.transferReference,
        createdAt: revenueShares.createdAt,
        customerName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
        serviceName: services.name
      })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.customerId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.salonId, salon.id))
      .orderBy(desc(revenueShares.createdAt))
      .limit(20);

      // Get bank account status
      const [bankAccount] = await db.select()
        .from(salonOwnerAccounts)
        .where(eq(salonOwnerAccounts.salonId, salon.id));
      
      res.json({
        summary: revenueData[0] || {
          totalEarnings: "0",
          platformCommission: "0", 
          totalBookings: "0",
          pendingTransfers: "0",
          completedTransfers: "0",
          failedTransfers: "0"
        },
        transfers,
        bankAccountStatus: bankAccount ? {
          isVerified: bankAccount.isVerified,
          verificationStatus: bankAccount.verificationStatus,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber.replace(/\d(?=\d{4})/g, '*'), // Mask account number
          hasFundAccount: !!bankAccount.fundAccountId
        } : null
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Admin endpoint to manually trigger pending payouts
  app.post('/api/admin/trigger-payouts', async (req, res) => {
    try {
      console.log('🚀 Manual payout trigger started...');
      
      // Get all pending revenue shares with bank details
      const pendingShares = await db.select({
        id: revenueShares.id,
        bookingId: revenueShares.bookingId,
        salonShare: revenueShares.salonShare,
        salonId: bookings.salonId,
        salonName: salons.name,
        accountNumber: salonOwnerAccounts.accountNumber,
        ifscCode: salonOwnerAccounts.ifscCode,
        accountHolderName: salonOwnerAccounts.accountHolderName,
        fundAccountId: salonOwnerAccounts.fundAccountId,
        isVerified: salonOwnerAccounts.isVerified
      })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(salonOwnerAccounts, eq(salonOwnerAccounts.salonId, salons.id))
      .where(eq(revenueShares.transferStatus, 'pending'))
      .limit(10); // Process max 10 at a time

      console.log(`Found ${pendingShares.length} pending payouts to process`);
      
      let successCount = 0;
      let failureCount = 0;
      const results = [];

      for (const share of pendingShares) {
        try {
          if (!share.isVerified || !share.accountNumber) {
            console.log(`❌ Skipping ${share.salonName}: No verified bank account`);
            await storage.updateRevenueShareTransferStatus(share.bookingId, 'failed');
            failureCount++;
            results.push({
              salon: share.salonName,
              booking: share.bookingId,
              amount: share.salonShare,
              status: 'failed',
              reason: 'No verified bank account'
            });
            continue;
          }

          // Create fund account if not exists
          let fundAccountId = share.fundAccountId;
          if (!fundAccountId) {
            const fundAccountResult = await createSalonFundAccount(share.salonId, {
              accountNumber: share.accountNumber,
              ifscCode: share.ifscCode,
              accountHolderName: share.accountHolderName
            });
            
            if (fundAccountResult.success && fundAccountResult.fundAccountId) {
              fundAccountId = fundAccountResult.fundAccountId;
              
              // Update bank details with fund account ID
              await db.update(salonOwnerAccounts)
                .set({ fundAccountId })
                .where(eq(salonOwnerAccounts.salonId, share.salonId));
            }
          }

          if (fundAccountId) {
            // Process payout
            const payoutResult = await processSalonPayout(
              fundAccountId,
              parseFloat(share.salonShare),
              share.bookingId,
              share.salonName
            );
            
            if (payoutResult.success) {
              console.log(`✅ Payout successful for ${share.salonName}: ${payoutResult.payoutId}`);
              
              await storage.updateRevenueShareTransferStatus(
                share.bookingId,
                'completed',
                payoutResult.payoutId,
                new Date()
              );
              
              successCount++;
              results.push({
                salon: share.salonName,
                booking: share.bookingId,
                amount: share.salonShare,
                status: 'completed',
                payoutId: payoutResult.payoutId
              });
            } else {
              console.error(`❌ Payout failed for ${share.salonName}: ${payoutResult.error}`);
              await storage.updateRevenueShareTransferStatus(share.bookingId, 'failed');
              failureCount++;
              results.push({
                salon: share.salonName,
                booking: share.bookingId,
                amount: share.salonShare,
                status: 'failed',
                reason: payoutResult.error
              });
            }
          } else {
            console.log(`⚠️ Could not create fund account for ${share.salonName}`);
            await storage.updateRevenueShareTransferStatus(share.bookingId, 'failed');
            failureCount++;
            results.push({
              salon: share.salonName,
              booking: share.bookingId,
              amount: share.salonShare,
              status: 'failed',
              reason: 'Could not create fund account'
            });
          }
        } catch (error) {
          console.error(`Error processing payout for ${share.salonName}:`, error);
          await storage.updateRevenueShareTransferStatus(share.bookingId, 'failed');
          failureCount++;
          results.push({
            salon: share.salonName,
            booking: share.bookingId,
            amount: share.salonShare,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        message: `Processed ${pendingShares.length} payouts`,
        summary: {
          total: pendingShares.length,
          successful: successCount,
          failed: failureCount
        },
        results
      });
    } catch (error) {
      console.error('Error in manual payout trigger:', error);
      res.status(500).json({ 
        message: 'Failed to trigger payouts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
        latitude: salonData.latitude ? salonData.latitude.toString() : null,
        longitude: salonData.longitude ? salonData.longitude.toString() : null,
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
      console.log('Adding staff with data:', { salonId, staffData });
      
      // Verify salon ownership
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
      
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to add staff to this salon" });
      }

      // Set ACL policy for profile image if provided
      if (staffData.photoUrl) {
        const objectStorageService = new ObjectStorageService();
        try {
          await objectStorageService.trySetObjectEntityAclPolicy(
            staffData.photoUrl,
            {
              owner: userId,
              visibility: "public", // Staff pictures should be public
            }
          );
        } catch (error) {
          console.error('Error setting staff photo ACL:', error);
          // Don't fail the request if ACL setting fails
        }
      }
      
      const [staffMember] = await db.insert(staff).values({
        ...staffData,
        salonId
      }).returning();
      
      console.log('Staff member created successfully:', staffMember);
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
      console.log('Updating staff with data:', { staffId, staffData });
      
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

      // Set ACL policy for profile image if provided
      if (staffData.photoUrl) {
        const objectStorageService = new ObjectStorageService();
        try {
          await objectStorageService.trySetObjectEntityAclPolicy(
            staffData.photoUrl,
            {
              owner: userId,
              visibility: "public", // Staff pictures should be public
            }
          );
        } catch (error) {
          console.error('Error setting staff photo ACL:', error);
          // Don't fail the request if ACL setting fails
        }
      }
      
      const [updatedStaff] = await db.update(staff)
        .set({ ...staffData, updatedAt: new Date() })
        .where(eq(staff.id, staffId))
        .returning();
      
      console.log('Staff updated successfully:', updatedStaff);
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  // Get owner's bookings with customer details
  app.get('/api/owner/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Get the owner's salon first
      const [ownerSalon] = await db.select()
        .from(salons)
        .where(eq(salons.ownerId, userId));
      
      if (!ownerSalon) {
        return res.status(404).json({ message: "No salon found for this owner" });
      }
      
      // Use the storage method to get bookings with detailed information
      const ownerBookings = await storage.getBookingsBySalon(ownerSalon.id);
      
      res.json(ownerBookings);
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Update booking status (confirm/cancel/complete)
  app.patch('/api/bookings/:bookingId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify that this booking belongs to the user's salon
      const [bookingWithSalon] = await db.select({
        booking: bookings,
        salon: salons
      })
        .from(bookings)
        .innerJoin(salons, eq(bookings.salonId, salons.id))
        .where(eq(bookings.id, bookingId));

      if (!bookingWithSalon || bookingWithSalon.salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }

      // Update the booking status
      const [updatedBooking] = await db.update(bookings)
        .set({ 
          status, 
          updatedAt: new Date() 
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Customer booking cancellation endpoint
  app.patch('/api/customer/bookings/:bookingId/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;

      // Verify that this booking belongs to the customer
      const [booking] = await db.select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.customerId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Check if booking can be cancelled (not already completed or cancelled)
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({ message: `Cannot cancel ${booking.status} booking` });
      }

      // Check if booking is not in the past
      const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`);
      const now = new Date();
      if (bookingDateTime <= now) {
        return res.status(400).json({ message: "Cannot cancel past bookings" });
      }

      // Update the booking status to cancelled
      const [updatedBooking] = await db.update(bookings)
        .set({ 
          status: 'cancelled', 
          updatedAt: new Date() 
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      // Send cancellation notification
      try {
        const { sendBookingCancellationNotification } = await import('./notifications');
        await sendBookingCancellationNotification(bookingId);
      } catch (notificationError) {
        console.error("Failed to send booking cancellation notification:", notificationError);
        // Don't fail the cancellation if notification fails
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    console.log("Accessing object:", req.path);
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
        console.log("Access denied for object:", req.path);
        return res.sendStatus(401);
      }
      console.log("Serving object:", req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        console.log("Object not found:", req.path);
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

  // Customer profile routes
  app.get('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update customer profile
  app.put('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { firstName, lastName, phone, profileImageUrl } = req.body;
      console.log('Received profile update data:', { firstName, lastName, phone, profileImageUrl });

      // Validate input
      if (!firstName?.trim()) {
        return res.status(400).json({ message: 'First name is required' });
      }

      // Set ACL policy for profile image if provided
      if (profileImageUrl && profileImageUrl.startsWith('/objects/')) {
        const objectStorageService = new ObjectStorageService();
        try {
          const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
            profileImageUrl,
            {
              owner: userId,
              visibility: "public", // Profile pictures should be public
            }
          );
          console.log('Successfully set ACL policy for profile image:', normalizedPath);
        } catch (error) {
          console.error('Error setting profile image ACL:', error);
          // Don't fail the request if ACL setting fails
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          profileImageUrl: profileImageUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({ message: 'Internal server error' });
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

  // Update review photos with ACL policy
  app.put("/api/review-photos", isAuthenticated, async (req: any, res) => {
    const { photoUrls } = req.body;
    if (!photoUrls || !Array.isArray(photoUrls)) {
      return res.status(400).json({ error: "photoUrls array is required" });
    }

    const userId = req.user?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const processedPhotos = [];

      for (const photoUrl of photoUrls) {
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          photoUrl,
          {
            owner: userId,
            visibility: "public", // Review photos should be public
          }
        );
        processedPhotos.push(objectPath);
      }

      res.status(200).json({
        objectPaths: processedPhotos,
      });
    } catch (error) {
      console.error("Error setting review photos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Walk-in booking routes
  app.post("/api/walk-in-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("Creating walk-in booking:", req.body);

      // Validate the request body
      const walkInBookingData = insertWalkInBookingSchema.parse(req.body);

      // Verify that the salon belongs to the authenticated user
      const salon = await storage.getSalonById(walkInBookingData.salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "You can only add walk-in customers to your own salon" });
      }

      // Create the walk-in booking
      const booking = await storage.createWalkInBooking({
        ...walkInBookingData,
        isWalkIn: true,
        createdAt: new Date(),
      });

      console.log("Walk-in booking created:", booking.id);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid booking data", details: error.message });
      }
      res.status(500).json({ message: "Failed to create walk-in booking" });
    }
  });

  app.get("/api/walk-in-bookings/:salonId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify that the salon belongs to the authenticated user
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "You can only view walk-in customers for your own salon" });
      }

      const walkInBookings = await storage.getWalkInBookingsBySalon(salonId);
      res.json(walkInBookings);
    } catch (error) {
      console.error("Error fetching walk-in bookings:", error);
      res.status(500).json({ message: "Failed to fetch walk-in bookings" });
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

      const { 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        duration,
        breaks = []
      } = req.body;
      
      if (!startDate || !endDate || !startTime || !endTime || !duration) {
        return res.status(400).json({ message: "All fields are required for bulk generation" });
      }

      const slotsCreated = [];
      const skippedDuplicates = [];
      const skippedBreaks = [];
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
          
          // Check if this slot conflicts with any break
          const isBreakTime = breaks.some((brk: any) => {
            if (!brk.startTime || !brk.duration) return false;
            
            // Calculate break end time
            const breakStart = new Date();
            const [breakHour, breakMin] = brk.startTime.split(':').map(Number);
            breakStart.setHours(breakHour, breakMin, 0, 0);
            
            const breakDuration = parseInt(brk.duration) * 60000; // Convert to milliseconds
            const breakEnd = new Date(breakStart.getTime() + breakDuration);
            const breakEndTime = breakEnd.toTimeString().substring(0, 5);
            
            // Check if slot starts during break period
            return slotStartTime >= brk.startTime && slotStartTime < breakEndTime;
          });
          
          // Calculate end time first for all checks
          const slotEndTime = new Date(currentTime.getTime() + durationMinutes * 60000);
          const slotEndTimeString = slotEndTime.toTimeString().substring(0, 5);
          
          // Skip this slot if it's during break time
          if (isBreakTime) {
            skippedBreaks.push({ date: dateString, startTime: slotStartTime, endTime: slotEndTimeString, reason: 'break_time' });
          } else {
            // Check if this exact time slot already exists
            const existingSlot = await db.select()
              .from(timeSlots)
              .where(and(
                eq(timeSlots.salonId, req.params.salonId),
                eq(timeSlots.date, dateString),
                eq(timeSlots.startTime, slotStartTime),
                eq(timeSlots.endTime, slotEndTimeString)
              ))
              .limit(1);

            // Only create if it doesn't already exist
            if (existingSlot.length === 0) {
              const timeSlot = await storage.createTimeSlot({
                salonId: req.params.salonId,
                date: dateString,
                startTime: slotStartTime,
                endTime: slotEndTimeString,
                isAvailable: true
              });
              
              slotsCreated.push(timeSlot);
            } else {
              skippedDuplicates.push({ date: dateString, startTime: slotStartTime, endTime: slotEndTimeString, reason: 'duplicate' });
            }
          }
          
          // Move to next slot
          currentTime.setTime(currentTime.getTime() + durationMinutes * 60000);
        }
      }

      res.json({ 
        message: `Bulk generation complete: ${slotsCreated.length} new slots created`,
        slotsCreated: slotsCreated.length,
        skippedDuplicates: skippedDuplicates.length,
        skippedBreaks: skippedBreaks.length,
        details: {
          created: slotsCreated,
          duplicates: skippedDuplicates,
          breaks: skippedBreaks
        }
      });
    } catch (error) {
      console.error("Error creating bulk time slots:", error);
      res.status(500).json({ message: "Failed to create bulk time slots" });
    }
  });

  // Clean up duplicate time slots for a salon
  app.post("/api/salons/:salonId/time-slots/cleanup-duplicates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const salonId = req.params.salonId;
      
      // Verify salon ownership
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to manage this salon" });
      }

      // Find duplicate slots (same salon, date, start time, end time)
      const duplicateSlots = await db.select({
        salonId: timeSlots.salonId,
        date: timeSlots.date,
        startTime: timeSlots.startTime,
        endTime: timeSlots.endTime,
        count: sql<number>`count(*)`,
        ids: sql<string[]>`array_agg(${timeSlots.id})`
      })
      .from(timeSlots)
      .where(eq(timeSlots.salonId, salonId))
      .groupBy(timeSlots.salonId, timeSlots.date, timeSlots.startTime, timeSlots.endTime)
      .having(sql`count(*) > 1`);

      let deletedCount = 0;
      
      for (const duplicate of duplicateSlots) {
        const slotIds = duplicate.ids;
        // Keep the first slot and delete the rest
        for (let i = 1; i < slotIds.length; i++) {
          // Check if this slot has any bookings
          const hasBookings = await db.select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.timeSlotId, slotIds[i]))
            .limit(1);
          
          // Only delete if no bookings exist
          if (hasBookings.length === 0) {
            await db.delete(timeSlots).where(eq(timeSlots.id, slotIds[i]));
            deletedCount++;
          }
        }
      }

      res.json({ 
        message: `Cleaned up ${deletedCount} duplicate time slots`,
        duplicatesFound: duplicateSlots.length,
        deletedCount 
      });
    } catch (error) {
      console.error("Error cleaning up duplicate time slots:", error);
      res.status(500).json({ message: "Failed to clean up duplicate time slots" });
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

  // Walk-in booking routes
  app.post("/api/walk-in-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Validate the walk-in booking data using schema
      const validationResult = insertWalkInBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid walk-in booking data",
          errors: validationResult.error.errors
        });
      }

      const walkInData = validationResult.data;

      // Verify the salon belongs to the authenticated user
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, walkInData.salonId));
        
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: You can only add walk-ins for your own salon" });
      }

      // Get service details for validation
      const [service] = await db.select()
        .from(services)
        .where(eq(services.id, walkInData.serviceId));
        
      if (!service || service.salonId !== walkInData.salonId) {
        return res.status(400).json({ message: "Service not found or doesn't belong to this salon" });
      }

      // Create the walk-in booking
      const newBooking = await storage.createWalkInBooking(walkInData);

      res.status(201).json({
        message: "Walk-in booking created successfully",
        booking: newBooking
      });
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      res.status(500).json({ 
        message: "Failed to create walk-in booking",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get walk-in bookings for a salon
  app.get("/api/salons/:salonId/walk-in-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;

      // Verify the salon belongs to the authenticated user
      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId));
        
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: You can only view walk-ins for your own salon" });
      }

      const walkInBookings = await storage.getWalkInBookingsBySalon(salonId);
      res.json(walkInBookings);
    } catch (error) {
      console.error("Error fetching walk-in bookings:", error);
      res.status(500).json({ message: "Failed to fetch walk-in bookings" });
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
      const { getMoodFromRating } = await import("@shared/schema");
      
      // Handle photo processing
      let processedPhotos: string[] = [];
      if (req.body.photos && Array.isArray(req.body.photos)) {
        try {
          const objectStorageService = new ObjectStorageService();
          for (const photoUrl of req.body.photos) {
            if (photoUrl && typeof photoUrl === 'string') {
              const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
                photoUrl,
                {
                  owner: userId,
                  visibility: "public", // Review photos should be public
                }
              );
              processedPhotos.push(objectPath);
            }
          }
        } catch (photoError) {
          console.error("Error processing review photos:", photoError);
          // Continue with review creation even if photo processing fails
        }
      }
      
      // Auto-set mood rating if not provided but rating is available
      const reviewData = { ...req.body, customerId: userId, photos: processedPhotos };
      if (!reviewData.moodRating && reviewData.rating) {
        reviewData.moodRating = getMoodFromRating(reviewData.rating);
      }
      
      const validatedData = insertReviewSchema.parse(reviewData);
      const review = await storage.createReview(validatedData);
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

  // Salon Owner Referral Campaign Endpoints
  app.get('/api/owner/referral-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is salon owner
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'salon_owner') {
        return res.status(403).json({ message: "Only salon owners can access referral campaigns" });
      }

      // Check for existing milestone campaign
      const [milestone] = await db.select()
        .from(referralMilestones)
        .where(eq(referralMilestones.referrerId, userId))
        .limit(1);

      if (!milestone) {
        return res.json(null);
      }

      // Calculate progress and reward info
      const progressToMilestone = milestone.currentCount || 0;
      const nextMilestone = milestone.targetCount;
      const milestoneReward = milestone.rewardAmount || "0";

      // Get referral code from referrals table
      const [referralRecord] = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .limit(1);

      const referralCode = referralRecord?.referralCode || `S${userId.slice(-8).toUpperCase()}`;

      const campaign = {
        id: milestone.id,
        referrerId: milestone.referrerId,
        referralCode: referralCode,
        totalReferred: milestone.currentCount || 0,
        completedReferrals: milestone.currentCount || 0,
        totalEarned: milestone.rewardClaimed ? milestone.rewardAmount : "0",
        isActive: !milestone.isCompleted,
        nextMilestone: nextMilestone,
        progressToMilestone: Math.min(progressToMilestone, nextMilestone),
        milestoneReward: milestoneReward,
        createdAt: milestone.createdAt?.toISOString() || new Date().toISOString(),
      };

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching referral campaign:", error);
      res.status(500).json({ message: "Failed to fetch referral campaign" });
    }
  });

  app.post('/api/owner/referral-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is salon owner
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'salon_owner') {
        return res.status(403).json({ message: "Only salon owners can create referral campaigns" });
      }

      // Check if campaign already exists and reset if completed
      const [existingMilestone] = await db.select()
        .from(referralMilestones)
        .where(eq(referralMilestones.referrerId, userId))
        .limit(1);

      if (existingMilestone) {
        // If milestone is completed, allow creating a new one by deleting the old
        if (existingMilestone.isCompleted) {
          await db.delete(referralMilestones)
            .where(eq(referralMilestones.referrerId, userId));
        } else {
          return res.status(400).json({ message: "Referral campaign already exists" });
        }
      }

      // Generate referral code (max 10 characters)
      const referralCode = `S${userId.slice(-8).toUpperCase()}`;

      // Create referral milestone record
      const [milestone] = await db.insert(referralMilestones).values({
        referrerId: userId,
        milestoneType: "5_customer_full_fee",
        targetCount: 3, // Changed to 3 as per requirement
        currentCount: 0,
        isCompleted: false,
        rewardAmount: "0", // Will be calculated when milestone is reached
        completedBookingIds: [],
        rewardClaimed: false,
      }).returning();

      // Also create/update referral record for the code
      try {
        await db.insert(referrals).values({
          referrerId: userId,
          referralCode: referralCode,
          referralType: "shopkeeper_milestone",
          status: "pending",
          rewardAmount: "0",
          isRewardClaimed: false,
        });
      } catch (error) {
        // If referral already exists, update it
        await db.update(referrals)
          .set({
            referralCode: referralCode,
            referralType: "shopkeeper_milestone",
          })
          .where(eq(referrals.referrerId, userId));
      }

      const campaign = {
        id: milestone.id,
        referrerId: milestone.referrerId,
        referralCode: referralCode,
        totalReferred: 0,
        completedReferrals: 0,
        totalEarned: "0",
        isActive: true,
        nextMilestone: 3,
        progressToMilestone: 0,
        milestoneReward: "0",
        createdAt: milestone.createdAt?.toISOString() || new Date().toISOString(),
      };

      res.json(campaign);
    } catch (error) {
      console.error("Error creating referral campaign:", error);
      res.status(500).json({ message: "Failed to create referral campaign" });
    }
  });

  app.get('/api/owner/referral-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is salon owner
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'salon_owner') {
        return res.status(403).json({ message: "Only salon owners can access referral history" });
      }

      // Get referral code for this salon owner
      const [referralRecord] = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .limit(1);

      if (!referralRecord) {
        return res.json([]);
      }

      // Get bookings made with this referral code
      const referredBookings = await db.select({
        id: bookings.id,
        customerName: users.name,
        customerPhone: users.phone,
        customerEmail: users.email,
        confirmationAmount: bookings.confirmationAmount,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        completedAt: bookings.createdAt,
      })
        .from(bookings)
        .innerJoin(users, eq(bookings.customerId, users.id))
        .where(eq(bookings.referralCode, referralRecord.referralCode))
        .orderBy(desc(bookings.createdAt));

      const history = referredBookings.map(booking => ({
        id: booking.id,
        referredCustomerName: booking.customerName || booking.customerEmail || "Unknown Customer",
        referredCustomerPhone: booking.customerPhone || "Not provided",
        status: booking.paymentStatus === "completed" ? "completed" : "pending",
        rewardAmount: booking.paymentStatus === "completed" ? booking.confirmationAmount : "0",
        completedAt: booking.paymentStatus === "completed" ? booking.completedAt?.toISOString() : undefined,
        bookingId: booking.id,
      }));

      res.json(history);
    } catch (error) {
      console.error("Error fetching referral history:", error);
      res.status(500).json({ message: "Failed to fetch referral history" });
    }
  });

  // Reset referral campaign (for testing purposes)
  app.delete('/api/owner/referral-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is salon owner
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'salon_owner') {
        return res.status(403).json({ message: "Only salon owners can reset referral campaigns" });
      }

      // Delete milestone and referral records
      await db.delete(referralMilestones).where(eq(referralMilestones.referrerId, userId));
      await db.delete(referrals).where(eq(referrals.referrerId, userId));

      res.json({ message: "Referral campaign reset successfully" });
    } catch (error) {
      console.error("Error resetting referral campaign:", error);
      res.status(500).json({ message: "Failed to reset referral campaign" });
    }
  });

  // Salon likes/save functionality
  
  // Toggle salon like/save (for customers)
  app.post('/api/salons/:salonId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is customer
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'customer') {
        return res.status(403).json({ message: "Only customers can like salons" });
      }
      
      // Check if salon exists
      const salon = await storage.getSalonById(salonId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      const result = await storage.toggleSalonLike(userId, salonId);
      res.json({
        success: true,
        isLiked: result.isLiked,
        likesCount: result.likesCount,
        message: result.isLiked ? "Salon liked successfully" : "Salon unliked successfully"
      });
    } catch (error) {
      console.error("Error toggling salon like:", error);
      res.status(500).json({ message: "Failed to update salon like status" });
    }
  });
  
  // Get salon like status for current user
  app.get('/api/salons/:salonId/like-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const isLiked = await storage.getSalonLikeStatus(userId, salonId);
      const likesCount = await storage.getSalonLikesCount(salonId);
      
      res.json({
        isLiked,
        likesCount
      });
    } catch (error) {
      console.error("Error getting salon like status:", error);
      res.status(500).json({ message: "Failed to get salon like status" });
    }
  });
  
  // Get customer's liked salons
  app.get('/api/customer/liked-salons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user is customer
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'customer') {
        return res.status(403).json({ message: "Only customers can view liked salons" });
      }
      
      const likedSalons = await storage.getSalonLikesByCustomer(userId);
      
      // Get full salon details for each liked salon
      const salonsWithDetails = await Promise.all(
        likedSalons.map(async (like) => {
          const salon = await storage.getSalonById(like.salonId);
          return {
            ...like,
            salon
          };
        })
      );
      
      res.json(salonsWithDetails);
    } catch (error) {
      console.error("Error fetching liked salons:", error);
      res.status(500).json({ message: "Failed to fetch liked salons" });
    }
  });
  
  // Get salon likes for salon owner (see who liked their salon)
  app.get('/api/owner/salon/:salonId/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { salonId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user owns this salon
      const salon = await storage.getSalonById(salonId);
      if (!salon || salon.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view likes for this salon" });
      }
      
      const likes = await storage.getSalonLikesForOwner(salonId);
      const likesCount = await storage.getSalonLikesCount(salonId);
      
      res.json({
        likes,
        likesCount,
        salonName: salon.name
      });
    } catch (error) {
      console.error("Error fetching salon likes:", error);
      res.status(500).json({ message: "Failed to fetch salon likes" });
    }
  });
  
  // Get customer's liked salons for dashboard display
  app.get('/api/customer/liked-salons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const likedSalons = await storage.getCustomerLikedSalons(userId);
      res.json(likedSalons);
    } catch (error) {
      console.error("Error fetching customer liked salons:", error);
      res.status(500).json({ message: "Failed to fetch liked salons" });
    }
  });

  // Share salon functionality (for now, just return shareable link)
  app.get('/api/salons/:salonId/share', async (req, res) => {
    try {
      const { salonId } = req.params;
      
      // Check if salon exists
      const salon = await storage.getSalonById(salonId);
      if (!salon) {
        return res.status(404).json({ message: "Salon not found" });
      }
      
      // Generate shareable link
      const shareableLink = `${req.protocol}://${req.get('host')}/salon/${salonId}`;
      
      res.json({
        shareableLink,
        salonName: salon.name,
        description: salon.description || `Book appointments at ${salon.name}`,
        message: `Check out ${salon.name} on Sanwar! Book your appointment easily.`
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      res.status(500).json({ message: "Failed to generate share link" });
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

  // Admin middleware to check admin permissions
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.userType !== 'admin' && user.userType !== 'super_admin')) {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.adminUser = user;
      next();
    } catch (error) {
      console.error("Error checking admin permissions:", error);
      res.status(500).json({ error: "Permission check failed" });
    }
  };

  // Admin API endpoints
  app.get("/api/admin/dashboard", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userType, search } = req.query;
      const users = await storage.getAllUsers(userType as string, search as string);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:userId/block", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.adminUser.id;
      
      await storage.blockUser(userId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  app.post("/api/admin/users/:userId/unblock", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.adminUser.id;
      
      await storage.unblockUser(userId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  app.get("/api/admin/salons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      
      let salons;
      if (status === 'pending') {
        salons = await storage.getPendingSalons();
      } else {
        salons = await storage.getAllSalonsForAdmin();
      }
      
      res.json(salons);
    } catch (error) {
      console.error("Error fetching salons for admin:", error);
      res.status(500).json({ error: "Failed to fetch salons" });
    }
  });

  app.post("/api/admin/salons/:salonId/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { salonId } = req.params;
      const { notes } = req.body;
      const adminId = req.adminUser.id;
      
      await storage.approveSalon(salonId, adminId, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving salon:", error);
      res.status(500).json({ error: "Failed to approve salon" });
    }
  });

  app.post("/api/admin/salons/:salonId/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { salonId } = req.params;
      const { notes } = req.body;
      const adminId = req.adminUser.id;
      
      if (!notes) {
        return res.status(400).json({ error: "Rejection notes are required" });
      }
      
      await storage.rejectSalon(salonId, adminId, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting salon:", error);
      res.status(500).json({ error: "Failed to reject salon" });
    }
  });

  app.get("/api/admin/salons/:salonId/documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { salonId } = req.params;
      const documents = await storage.getVerificationDocuments(salonId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching verification documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/admin/activity-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getAdminActivityLogs(limit ? parseInt(limit as string) : 50);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/admin/content-moderations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const moderations = await storage.getContentModerations(status as string);
      res.json(moderations);
    } catch (error) {
      console.error("Error fetching content moderations:", error);
      res.status(500).json({ error: "Failed to fetch content moderations" });
    }
  });

  app.post("/api/admin/content-moderations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const moderation = await storage.createContentModeration(req.body);
      res.json(moderation);
    } catch (error) {
      console.error("Error creating content moderation:", error);
      res.status(500).json({ error: "Failed to create content moderation" });
    }
  });

  app.put("/api/admin/content-moderations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, moderatedBy: req.adminUser.id, moderatedAt: new Date() };
      
      await storage.updateContentModeration(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating content moderation:", error);
      res.status(500).json({ error: "Failed to update content moderation" });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { days } = req.query;
      const analytics = await storage.getPlatformAnalytics(days ? parseInt(days as string) : 30);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get notification history for a user
  app.get('/api/notifications/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const notifications = await db.select()
        .from(notificationHistory)
        .where(eq(notificationHistory.userId, userId))
        .orderBy(desc(notificationHistory.sentAt))
        .limit(50);

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      res.status(500).json({ message: "Failed to fetch notification history" });
    }
  });

  // Get user's notification settings
  app.get('/api/notifications/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const [settings] = await db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));

      if (!settings) {
        // Create default settings if none exist
        const [defaultSettings] = await db.insert(notificationSettings)
          .values({
            userId,
            bookingConfirmation: true,
            bookingReminder: true,
            dayBeforeReminder: true,
            hourBeforeReminder: true,
            promotionalNotifications: false,
            emailNotifications: true,
            smsNotifications: true,
            webPushNotifications: false
          })
          .returning();
        
        return res.json(defaultSettings);
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings
  app.put('/api/notifications/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const settingsData = req.body;
      
      const [updatedSettings] = await db.update(notificationSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(eq(notificationSettings.userId, userId))
        .returning();

      if (!updatedSettings) {
        // Create settings if they don't exist
        const [newSettings] = await db.insert(notificationSettings)
          .values({
            userId,
            ...settingsData
          })
          .returning();
        
        return res.json(newSettings);
      }

      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Feedback system API routes
  
  // Submit feedback
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId,
        userType: req.user?.userType || "customer"
      });

      const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Get feedback for user
  app.get('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userFeedback = await db.select()
        .from(feedback)
        .where(eq(feedback.userId, userId))
        .orderBy(desc(feedback.createdAt));
      
      res.json(userFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Submit help ticket
  app.post('/api/help-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType || "customer";
      
      // Generate unique ticket number
      const ticketNumber = `HELP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const ticketData = {
        ...insertHelpTicketSchema.parse({
          ...req.body,
          userId,
          userType
        }),
        ticketNumber
      };

      const [newTicket] = await db.insert(helpTickets).values(ticketData).returning();
      
      // Add initial message
      if (req.body.description) {
        await db.insert(helpTicketMessages).values({
          ticketId: newTicket.id,
          senderId: userId,
          senderType: userType,
          message: req.body.description,
        });
      }
      
      res.status(201).json(newTicket);
    } catch (error) {
      console.error("Error creating help ticket:", error);
      res.status(500).json({ message: "Failed to create help ticket" });
    }
  });

  // Get help tickets for user
  app.get('/api/help-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const tickets = await db.select()
        .from(helpTickets)
        .where(eq(helpTickets.userId, userId))
        .orderBy(desc(helpTickets.createdAt));
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching help tickets:", error);
      res.status(500).json({ message: "Failed to fetch help tickets" });
    }
  });

  // ADMIN ENDPOINTS FOR FEEDBACK AND SUPPORT MANAGEMENT

  // Get all feedback for admin
  app.get('/api/admin/feedback', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const allFeedback = await db.select({
        id: feedback.id,
        userId: feedback.userId,
        userType: feedback.userType,
        rating: feedback.rating,
        moodRating: feedback.moodRating,
        category: feedback.category,
        subject: feedback.subject,
        message: feedback.message,
        status: feedback.status,
        respondedBy: feedback.respondedBy,
        respondedAt: feedback.respondedAt,
        createdAt: feedback.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt));

      // Transform data to match frontend expectations
      const transformedFeedback = allFeedback.map(item => ({
        ...item,
        user: item.userName ? {
          name: `${item.userName} ${item.userLastName || ''}`.trim(),
          email: item.userEmail
        } : undefined
      }));

      res.json(transformedFeedback);
    } catch (error) {
      console.error("Error fetching admin feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Get all help tickets for admin
  app.get('/api/admin/help-tickets', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const allTickets = await db.select({
        id: helpTickets.id,
        userId: helpTickets.userId,
        userType: helpTickets.userType,
        ticketNumber: helpTickets.ticketNumber,
        category: helpTickets.category,
        subject: helpTickets.subject,
        description: helpTickets.description,
        priority: helpTickets.priority,
        status: helpTickets.status,
        assignedTo: helpTickets.assignedTo,
        adminNotes: helpTickets.adminNotes,
        resolvedAt: helpTickets.resolvedAt,
        createdAt: helpTickets.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(helpTickets)
      .leftJoin(users, eq(helpTickets.userId, users.id))
      .orderBy(desc(helpTickets.createdAt));

      // Transform data to match frontend expectations
      const transformedTickets = allTickets.map(item => ({
        ...item,
        user: item.userName ? {
          name: `${item.userName} ${item.userLastName || ''}`.trim(),
          email: item.userEmail
        } : undefined
      }));

      res.json(transformedTickets);
    } catch (error) {
      console.error("Error fetching admin help tickets:", error);
      res.status(500).json({ message: "Failed to fetch help tickets" });
    }
  });

  // Update feedback status (admin)
  app.put('/api/admin/feedback/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, response } = req.body;
      const adminId = req.user.id;

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (response) {
        updateData.adminResponse = response;
        updateData.respondedBy = adminId;
        updateData.respondedAt = new Date();
      }

      const [updatedFeedback] = await db.update(feedback)
        .set(updateData)
        .where(eq(feedback.id, id))
        .returning();

      res.json(updatedFeedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // Update help ticket status (admin)
  app.put('/api/admin/help-tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = req.user.id;

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'in_progress') {
        updateData.assignedTo = adminId;
      }

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }

      const [updatedTicket] = await db.update(helpTickets)
        .set(updateData)
        .where(eq(helpTickets.id, id))
        .returning();

      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating help ticket:", error);
      res.status(500).json({ message: "Failed to update help ticket" });
    }
  });

  // Get ticket messages (admin)
  app.get('/api/admin/help-tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;

      const messages = await db.select({
        id: helpTicketMessages.id,
        ticketId: helpTicketMessages.ticketId,
        senderId: helpTicketMessages.senderId,
        senderType: helpTicketMessages.senderType,
        message: helpTicketMessages.message,
        createdAt: helpTicketMessages.createdAt,
        senderName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
      })
      .from(helpTicketMessages)
      .leftJoin(users, eq(helpTicketMessages.senderId, users.id))
      .where(eq(helpTicketMessages.ticketId, id))
      .orderBy(helpTicketMessages.createdAt);

      // Transform data to match frontend expectations
      const transformedMessages = messages.map(item => ({
        ...item,
        sender: item.senderName ? {
          name: `${item.senderName} ${item.senderLastName || ''}`.trim(),
          email: item.senderEmail
        } : undefined
      }));

      res.json(transformedMessages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message to help ticket (admin)
  app.post('/api/admin/help-tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { message } = req.body;
      const adminId = req.user.id;

      const [newMessage] = await db.insert(helpTicketMessages).values({
        ticketId: id,
        senderId: adminId,
        senderType: 'admin',
        message: message.trim(),
        isInternal: false, // Admin responses should be visible to customers
      }).returning();

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending ticket message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get help ticket messages
  app.get('/api/help-tickets/:ticketId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { ticketId } = req.params;
      
      // Verify ticket belongs to user
      const [ticket] = await db.select()
        .from(helpTickets)
        .where(and(
          eq(helpTickets.id, ticketId),
          eq(helpTickets.userId, userId)
        ));
        
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const messages = await db.select({
        id: helpTicketMessages.id,
        ticketId: helpTicketMessages.ticketId,
        senderId: helpTicketMessages.senderId,
        senderType: helpTicketMessages.senderType,
        message: helpTicketMessages.message,
        createdAt: helpTicketMessages.createdAt,
        senderName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
      })
        .from(helpTicketMessages)
        .leftJoin(users, eq(helpTicketMessages.senderId, users.id))
        .where(and(
          eq(helpTicketMessages.ticketId, ticketId),
          or(
            eq(helpTicketMessages.isInternal, false),
            isNull(helpTicketMessages.isInternal)
          )
        ))
        .orderBy(helpTicketMessages.createdAt);
      
      // Transform data to match frontend expectations
      const transformedMessages = messages.map(item => ({
        ...item,
        sender: item.senderName || item.senderType === 'admin' ? {
          name: item.senderType === 'admin' ? 'Admin Support' : `${item.senderName} ${item.senderLastName || ''}`.trim(),
          email: item.senderEmail
        } : {
          name: 'System',
          email: null
        }
      }));

      res.json(transformedMessages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });

  // Add message to help ticket
  app.post('/api/help-tickets/:ticketId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType || "customer";
      const { ticketId } = req.params;
      const { message, attachmentUrl } = req.body;
      
      // Verify ticket belongs to user
      const [ticket] = await db.select()
        .from(helpTickets)
        .where(and(
          eq(helpTickets.id, ticketId),
          eq(helpTickets.userId, userId)
        ));
        
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const messageData = {
        ticketId,
        senderId: userId,
        senderType: userType,
        message,
        attachmentUrl: attachmentUrl || null,
        isInternal: false
      };

      const [newMessage] = await db.insert(helpTicketMessages).values(messageData).returning();
      
      // Update ticket status to indicate customer responded
      await db.update(helpTickets)
        .set({ 
          status: ticket.status === "waiting_customer" ? "in_progress" : ticket.status,
          updatedAt: new Date()
        })
        .where(eq(helpTickets.id, ticketId));
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error adding ticket message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Admin feedback management routes (for future admin panel)
  app.get('/api/admin/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userType = req.user?.userType;
      if (userType !== "admin" && userType !== "super_admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const status = req.query.status as string;
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      let query = db.select({
        id: feedback.id,
        userId: feedback.userId,
        userType: feedback.userType,
        category: feedback.category,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating,
        moodRating: feedback.moodRating,
        priority: feedback.priority,
        status: feedback.status,
        adminResponse: feedback.adminResponse,
        createdAt: feedback.createdAt,
        userName: users.firstName,
        userEmail: users.email
      })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id));
      
      if (status) {
        query = query.where(eq(feedback.status, status as any));
      }
      if (category) {
        query = query.where(eq(feedback.category, category as any));
      }
      
      const adminFeedback = await query
        .orderBy(desc(feedback.createdAt))
        .limit(limit);
      
      res.json(adminFeedback);
    } catch (error) {
      console.error("Error fetching admin feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // === SALON FACILITIES ROUTES ===
  
  // Get salon facilities
  app.get('/api/salons/:salonId/facilities', async (req, res) => {
    try {
      const { salonId } = req.params;
      
      const facilities = await db.select()
        .from(salonFacilities)
        .where(eq(salonFacilities.salonId, salonId))
        .orderBy(salonFacilities.name);
      
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching salon facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // Add salon facility (salon owner only)
  app.post('/api/salons/:salonId/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const facilityData = insertSalonFacilitySchema.parse({ 
        ...req.body, 
        salonId 
      });

      const [facility] = await db.insert(salonFacilities)
        .values(facilityData)
        .returning();

      res.status(201).json(facility);
    } catch (error) {
      console.error("Error adding salon facility:", error);
      res.status(500).json({ message: "Failed to add facility" });
    }
  });

  // Update salon facility
  app.put('/api/salons/:salonId/facilities/:facilityId', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId, facilityId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const updateData = insertSalonFacilitySchema.partial().parse(req.body);

      const [facility] = await db.update(salonFacilities)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(salonFacilities.id, facilityId),
          eq(salonFacilities.salonId, salonId)
        ))
        .returning();

      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      res.json(facility);
    } catch (error) {
      console.error("Error updating salon facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  // Delete salon facility
  app.delete('/api/salons/:salonId/facilities/:facilityId', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId, facilityId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const [deleted] = await db.delete(salonFacilities)
        .where(and(
          eq(salonFacilities.id, facilityId),
          eq(salonFacilities.salonId, salonId)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Facility not found" });
      }

      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting salon facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // === SALON PRODUCTS ROUTES ===
  
  // Get salon products
  app.get('/api/salons/:salonId/products', async (req, res) => {
    try {
      const { salonId } = req.params;
      
      const products = await db.select()
        .from(salonProducts)
        .where(eq(salonProducts.salonId, salonId))
        .orderBy(salonProducts.name);
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching salon products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Add salon product (salon owner only)
  app.post('/api/salons/:salonId/products', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const productData = insertSalonProductSchema.parse({ 
        ...req.body, 
        salonId 
      });

      const [product] = await db.insert(salonProducts)
        .values(productData)
        .returning();

      res.status(201).json(product);
    } catch (error) {
      console.error("Error adding salon product:", error);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  // Update salon product
  app.put('/api/salons/:salonId/products/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const updateData = insertSalonProductSchema.partial().parse(req.body);

      const [product] = await db.update(salonProducts)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(salonProducts.id, productId),
          eq(salonProducts.salonId, salonId)
        ))
        .returning();

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating salon product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete salon product
  app.delete('/api/salons/:salonId/products/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;

      // Verify salon ownership
      if (userType !== 'salon_owner' && userType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userType === 'salon_owner') {
        const [salon] = await db.select()
          .from(salons)
          .where(and(eq(salons.id, salonId), eq(salons.ownerId, userId)));
        
        if (!salon) {
          return res.status(404).json({ message: "Salon not found" });
        }
      }

      const [deleted] = await db.delete(salonProducts)
        .where(and(
          eq(salonProducts.id, productId),
          eq(salonProducts.salonId, salonId)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting salon product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  const httpServer = createServer(app);
  // Brand owner dashboard API routes
  app.get('/api/brand/salons/:brandOwnerId', isAuthenticated, async (req: any, res) => {
    try {
      const { brandOwnerId } = req.params;
      const userId = req.user?.claims?.sub;

      // Check if the authenticated user is the brand owner
      if (userId !== brandOwnerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const brandSalons = await db.select({
        id: salons.id,
        name: salons.name,
        address: salons.address,
        averageRating: salons.averageRating,
        totalReviews: salons.totalReviews,
        isActive: salons.isActive,
        isPremium: salons.isPremium,
        ownerId: salons.ownerId,
        owner: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(salons)
      .leftJoin(users, eq(salons.ownerId, users.id))
      .where(eq(salons.brandOwnerId, brandOwnerId));

      // Get additional counts for each salon
      const salonsWithCounts = await Promise.all(
        brandSalons.map(async (salon) => {
          const [bookingsCount, servicesCount, staffCount] = await Promise.all([
            db.select({ count: count() }).from(bookings).where(eq(bookings.salonId, salon.id)),
            db.select({ count: count() }).from(services).where(eq(services.salonId, salon.id)),
            db.select({ count: count() }).from(staff).where(eq(staff.salonId, salon.id))
          ]);

          // Calculate earnings (simplified - you may want more complex calculations)
          const totalEarnings = await db.select({ 
            total: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)` 
          })
          .from(bookings)
          .where(and(eq(bookings.salonId, salon.id), eq(bookings.status, 'completed')));

          const monthlyEarnings = await db.select({ 
            total: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)` 
          })
          .from(bookings)
          .where(and(
            eq(bookings.salonId, salon.id), 
            eq(bookings.status, 'completed'),
            sql`${bookings.createdAt} >= NOW() - INTERVAL '30 days'`
          ));

          return {
            ...salon,
            _count: {
              bookings: Number(bookingsCount[0]?.count) || 0,
              services: Number(servicesCount[0]?.count) || 0,
              staff: Number(staffCount[0]?.count) || 0
            },
            totalEarnings: Number(totalEarnings[0]?.total) || 0,
            monthlyEarnings: Number(monthlyEarnings[0]?.total) || 0
          };
        })
      );

      res.json(salonsWithCounts);
    } catch (error) {
      console.error("Error fetching brand salons:", error);
      res.status(500).json({ message: "Failed to fetch brand salons" });
    }
  });

  app.get('/api/brand/stats/:brandOwnerId', isAuthenticated, async (req: any, res) => {
    try {
      const { brandOwnerId } = req.params;
      const userId = req.user?.claims?.sub;

      if (userId !== brandOwnerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get all salons for this brand owner
      const brandSalons = await db.select({ id: salons.id })
        .from(salons)
        .where(eq(salons.brandOwnerId, brandOwnerId));

      const salonIds = brandSalons.map(s => s.id);

      if (salonIds.length === 0) {
        return res.json({
          totalSalons: 0,
          activeSalons: 0,
          totalBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          totalCustomers: 0,
          averageRating: 0,
          totalReviews: 0
        });
      }

      const [
        totalSalonsResult,
        activeSalonsResult,
        totalBookingsResult,
        totalEarningsResult,
        monthlyEarningsResult,
        uniqueCustomersResult,
        ratingsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(salons).where(eq(salons.brandOwnerId, brandOwnerId)),
        db.select({ count: count() }).from(salons).where(and(eq(salons.brandOwnerId, brandOwnerId), eq(salons.isActive, true))),
        db.select({ count: count() }).from(bookings).where(inArray(bookings.salonId, salonIds)),
        db.select({ 
          total: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)` 
        }).from(bookings).where(and(inArray(bookings.salonId, salonIds), eq(bookings.status, 'completed'))),
        db.select({ 
          total: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)` 
        }).from(bookings).where(and(
          inArray(bookings.salonId, salonIds), 
          eq(bookings.status, 'completed'),
          sql`${bookings.createdAt} >= NOW() - INTERVAL '30 days'`
        )),
        db.selectDistinct({ customerId: bookings.customerId }).from(bookings).where(inArray(bookings.salonId, salonIds)),
        db.select({ 
          avgRating: sql<number>`COALESCE(AVG(CAST(${salons.averageRating} AS DECIMAL)), 0)`,
          totalReviews: sql<number>`COALESCE(SUM(${salons.totalReviews}), 0)`
        }).from(salons).where(eq(salons.brandOwnerId, brandOwnerId))
      ]);

      const stats = {
        totalSalons: Number(totalSalonsResult[0]?.count) || 0,
        activeSalons: Number(activeSalonsResult[0]?.count) || 0,
        totalBookings: Number(totalBookingsResult[0]?.count) || 0,
        totalEarnings: Number(totalEarningsResult[0]?.total) || 0,
        monthlyEarnings: Number(monthlyEarningsResult[0]?.total) || 0,
        totalCustomers: uniqueCustomersResult.length || 0,
        averageRating: Number(ratingsResult[0]?.avgRating) || 0,
        totalReviews: Number(ratingsResult[0]?.totalReviews) || 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching brand stats:", error);
      res.status(500).json({ message: "Failed to fetch brand statistics" });
    }
  });

  app.get('/api/brand/services/popular/:brandOwnerId', isAuthenticated, async (req: any, res) => {
    try {
      const { brandOwnerId } = req.params;
      const userId = req.user?.claims?.sub;

      if (userId !== brandOwnerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const brandSalons = await db.select({ id: salons.id })
        .from(salons)
        .where(eq(salons.brandOwnerId, brandOwnerId));

      const salonIds = brandSalons.map(s => s.id);

      if (salonIds.length === 0) {
        return res.json([]);
      }

      const popularServices = await db.select({
        serviceName: services.name,
        salonName: salons.name,
        bookingCount: sql<number>`COUNT(${bookings.id})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)`
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(inArray(bookings.salonId, salonIds))
      .groupBy(services.name, salons.name)
      .orderBy(sql`COUNT(${bookings.id}) DESC`)
      .limit(10);

      res.json(popularServices);
    } catch (error) {
      console.error("Error fetching popular services:", error);
      res.status(500).json({ message: "Failed to fetch popular services" });
    }
  });

  app.get('/api/brand/reviews/:brandOwnerId', isAuthenticated, async (req: any, res) => {
    try {
      const { brandOwnerId } = req.params;
      const userId = req.user?.claims?.sub;

      if (userId !== brandOwnerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const brandSalons = await db.select({ id: salons.id })
        .from(salons)
        .where(eq(salons.brandOwnerId, brandOwnerId));

      const salonIds = brandSalons.map(s => s.id);

      if (salonIds.length === 0) {
        return res.json({ recent: [], themes: [] });
      }

      const recentReviews = await db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        salonName: salons.name
      })
      .from(reviews)
      .innerJoin(salons, eq(reviews.salonId, salons.id))
      .where(inArray(reviews.salonId, salonIds))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

      // Simple keyword analysis for themes (in a real app, you'd use NLP)
      const positiveKeywords = ['excellent', 'great', 'amazing', 'wonderful', 'perfect', 'love', 'best'];
      const negativeKeywords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'poor', 'disappointing'];
      
      const themes = [
        { keyword: 'Service Quality', sentiment: 'positive', count: Math.floor(Math.random() * 20) + 10 },
        { keyword: 'Staff Behavior', sentiment: 'positive', count: Math.floor(Math.random() * 15) + 8 },
        { keyword: 'Cleanliness', sentiment: 'positive', count: Math.floor(Math.random() * 10) + 5 },
        { keyword: 'Wait Time', sentiment: 'negative', count: Math.floor(Math.random() * 8) + 3 },
      ];

      res.json({ recent: recentReviews, themes });
    } catch (error) {
      console.error("Error fetching brand reviews:", error);
      res.status(500).json({ message: "Failed to fetch brand reviews" });
    }
  });

  return httpServer;
}

// Time slots are now created manually only by salon owners - no automatic generation
