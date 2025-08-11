import {
  users,
  salons,
  services,
  workingHours,
  timeSlots,
  bookings,
  reviews,
  salonGallery,
  salonLikes,
  referrals,
  referralMilestones,
  customerReferralCampaigns,
  freeBookingCredits,
  wallets,
  walletTransactions,
  verificationDocuments,
  adminActivityLogs,
  contentModerations,
  platformAnalytics,
  revenueShares,
  passwordResetOtps,
  type User,
  type UpsertUser,
  type Salon,
  type InsertSalon,
  type Service,
  type InsertService,
  type WorkingHours,
  type InsertWorkingHours,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type InsertWalkInBooking,
  type Review,
  type InsertReview,
  type SalonGallery,
  type InsertSalonGallery,
  type SalonLike,
  type InsertSalonLike,
  type Referral,
  type InsertReferral,
  type ReferralMilestone,
  type InsertReferralMilestone,
  type CustomerReferralCampaign,
  type InsertCustomerReferralCampaign,
  type FreeBookingCredit,
  type InsertFreeBookingCredit,
  type Wallet,
  type InsertWallet,
  type WalletTransaction,
  type InsertWalletTransaction,
  type VerificationDocument,
  type InsertVerificationDocument,
  type AdminActivityLog,
  type InsertAdminActivityLog,
  type ContentModeration,
  type InsertContentModeration,
  type PlatformAnalytics,
  type InsertPlatformAnalytics,
  type PasswordResetOtp,
  type InsertPasswordResetOtp,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for email/password and social auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySocialId(socialProvider: string, socialId: string): Promise<User | undefined>;
  getUserByClerkId(clerkId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  createUserFromClerk(userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    profileImageUrl: string | null;
    userType: "customer" | "salon_owner";
  }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserType(id: string, userType: "customer" | "salon_owner"): Promise<User>;

  // Salon operations
  createSalon(salon: InsertSalon): Promise<Salon>;
  getSalonById(id: string): Promise<Salon | undefined>;
  getSalonsByOwner(ownerId: string): Promise<Salon[]>;
  getAllSalons(): Promise<Salon[]>;
  updateSalon(id: string, salon: Partial<InsertSalon>): Promise<Salon | undefined>;

  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServicesBySalon(salonId: string): Promise<Service[]>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  // Working hours operations
  upsertWorkingHours(workingHour: InsertWorkingHours): Promise<WorkingHours>;
  getWorkingHoursBySalon(salonId: string): Promise<WorkingHours[]>;

  // Time slot operations
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getAvailableTimeSlots(salonId: string, date: string): Promise<TimeSlot[]>;
  updateTimeSlotAvailability(id: string, isAvailable: boolean): Promise<void>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  createWalkInBooking(booking: InsertWalkInBooking): Promise<Booking>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  getBookingsBySalon(salonId: string): Promise<Booking[]>;
  getWalkInBookingsBySalon(salonId: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string, paymentId?: string, paymentStatus?: string): Promise<void>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsBySalon(salonId: string): Promise<Review[]>;
  updateSalonRating(salonId: string): Promise<void>;

  // Gallery operations
  createGalleryImage(galleryImage: InsertSalonGallery): Promise<SalonGallery>;
  getGalleryImagesBySalon(salonId: string): Promise<SalonGallery[]>;
  updateGalleryImage(id: string, galleryImage: Partial<InsertSalonGallery>): Promise<SalonGallery | undefined>;
  deleteGalleryImage(id: string): Promise<void>;

  // Referral operations
  getReferralByCode(referralCode: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  completeReferral(referralId: string, bookingId: string): Promise<void>;
  generateUniqueReferralCode(): Promise<string>;
  
  // Customer referral campaign operations  
  getOrCreateCustomerReferralCampaign(referrerId: string): Promise<CustomerReferralCampaign>;
  updateCustomerReferralProgress(referrerId: string, referralId: string): Promise<boolean>; // Returns true if milestone completed
  
  // Free booking credit operations
  createFreeBookingCredit(credit: InsertFreeBookingCredit): Promise<FreeBookingCredit>;
  getAvailableFreeCredits(customerId: string): Promise<FreeBookingCredit[]>;
  useFreeBookingCredit(creditId: string, bookingId: string): Promise<void>;
  calculateAverageServicePrice(): Promise<number>;
  
  // Referral milestone operations (for shopkeepers)
  getOrCreateReferralMilestone(referrerId: string): Promise<ReferralMilestone>;
  updateReferralMilestoneProgress(referrerId: string, bookingId: string, confirmationAmount: number): Promise<boolean>; // Returns true if milestone completed
  
  // Wallet operations
  getOrCreateWallet(customerId: string): Promise<Wallet>;
  addWalletCredit(customerId: string, amount: number, description: string, referenceId: string, referenceType: string): Promise<void>;
  
  // Salon likes operations
  toggleSalonLike(customerId: string, salonId: string): Promise<{ isLiked: boolean; likesCount: number }>;
  getSalonLikeStatus(customerId: string, salonId: string): Promise<boolean>;
  getSalonLikesCount(salonId: string): Promise<number>;
  getSalonLikesByCustomer(customerId: string): Promise<SalonLike[]>;
  getSalonLikesForOwner(salonId: string): Promise<SalonLike[]>;
  getCustomerLikedSalons(customerId: string): Promise<any[]>;

  // Admin operations
  getAllUsers(userType?: string, search?: string): Promise<User[]>;
  blockUser(userId: string, adminId: string): Promise<void>;
  unblockUser(userId: string, adminId: string): Promise<void>;
  getAllSalonsForAdmin(): Promise<any[]>;
  getPendingSalons(): Promise<any[]>;
  approveSalon(salonId: string, adminId: string, notes?: string): Promise<void>;
  rejectSalon(salonId: string, adminId: string, notes: string): Promise<void>;
  uploadVerificationDocument(doc: InsertVerificationDocument): Promise<VerificationDocument>;
  getVerificationDocuments(salonId: string): Promise<VerificationDocument[]>;
  logAdminActivity(log: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAdminActivityLogs(limit?: number): Promise<AdminActivityLog[]>;
  createContentModeration(moderation: InsertContentModeration): Promise<ContentModeration>;
  getContentModerations(status?: string): Promise<ContentModeration[]>;
  updateContentModeration(id: string, updates: Partial<ContentModeration>): Promise<void>;
  getAdminDashboardStats(): Promise<any>;
  getPlatformAnalytics(days?: number): Promise<PlatformAnalytics[]>;

  // Password reset OTP operations
  createPasswordResetOtp(otp: InsertPasswordResetOtp): Promise<PasswordResetOtp>;
  getValidPasswordResetOtp(phone: string, otp: string): Promise<PasswordResetOtp | undefined>;
  markPasswordResetOtpUsed(id: string): Promise<void>;
  updateUserPassword(email: string, hashedPassword: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserBySocialId(socialProvider: string, socialId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.socialProvider, socialProvider as any),
        eq(users.socialId, socialId)
      )
    );
    return user;
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user;
  }

  async createUserFromClerk(userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    profileImageUrl: string | null;
    userType: "customer" | "salon_owner";
  }): Promise<User> {
    const [user] = await db.insert(users).values({
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      profileImageUrl: userData.profileImageUrl,
      userType: userData.userType,
      role: 'user',
    }).returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserType(id: string, userType: "customer" | "salon_owner"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        userType,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Salon operations
  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon).returning();
    return newSalon;
  }

  async getSalonById(id: string): Promise<Salon | undefined> {
    const [salonWithLikes] = await db
      .select({
        ...salons,
        likesCount: sql<number>`COALESCE(COUNT(${salonLikes.id}), 0)::int`
      })
      .from(salons)
      .leftJoin(salonLikes, and(eq(salons.id, salonLikes.salonId), eq(salonLikes.isLiked, true)))
      .where(eq(salons.id, id))
      .groupBy(salons.id);
    
    return salonWithLikes as any;
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.ownerId, ownerId));
  }

  async getAllSalons(): Promise<Salon[]> {
    const salonsWithLikes = await db
      .select({
        ...salons,
        likesCount: sql<number>`COALESCE(COUNT(${salonLikes.id}), 0)::int`
      })
      .from(salons)
      .leftJoin(salonLikes, and(eq(salons.id, salonLikes.salonId), eq(salonLikes.isLiked, true)))
      .where(eq(salons.isActive, true))
      .groupBy(salons.id)
      .orderBy(desc(salons.averageRating));
    
    return salonsWithLikes as any[];
  }

  async updateSalon(id: string, salonData: Partial<InsertSalon>): Promise<Salon | undefined> {
    const [salon] = await db
      .update(salons)
      .set({ ...salonData, updatedAt: new Date() })
      .where(eq(salons.id, id))
      .returning();
    return salon;
  }

  // Service operations
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.salonId, salonId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
  }

  async updateService(id: string, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Working hours operations
  async upsertWorkingHours(workingHour: InsertWorkingHours): Promise<WorkingHours> {
    const [result] = await db
      .insert(workingHours)
      .values(workingHour)
      .onConflictDoUpdate({
        target: [workingHours.salonId, workingHours.dayOfWeek],
        set: workingHour,
      })
      .returning();
    return result;
  }

  async getWorkingHoursBySalon(salonId: string): Promise<WorkingHours[]> {
    return await db
      .select()
      .from(workingHours)
      .where(eq(workingHours.salonId, salonId))
      .orderBy(asc(workingHours.dayOfWeek));
  }

  // Time slot operations
  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }

  async getAvailableTimeSlots(salonId: string, date: string): Promise<TimeSlot[]> {
    console.log(`[DEBUG] Fetching time slots for salon ${salonId} on date ${date}`);
    
    // Get all time slots for this salon and date
    const allSlots = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.salonId, salonId),
          eq(timeSlots.date, date)
        )
      )
      .orderBy(asc(timeSlots.startTime));

    console.log(`[DEBUG] Found ${allSlots.length} total time slots`);

    // Get all bookings for this salon and date to check which slots are booked
    const bookedSlots = await db
      .select({
        timeSlotId: bookings.timeSlotId
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.salonId, salonId),
          eq(bookings.date, date),
          // All bookings (pending, confirmed, completed) make slots unavailable
          // Once someone books a slot, it should not be available to others
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "completed")
          )
        )
      );

    const bookedSlotIds = new Set(bookedSlots.map(b => b.timeSlotId));
    console.log(`[DEBUG] Found ${bookedSlots.length} booked slots:`, Array.from(bookedSlotIds));

    // Return all slots with real-time availability based on actual bookings
    const result = allSlots.map(slot => ({
      ...slot,
      isAvailable: !bookedSlotIds.has(slot.id) // Available if not booked
    }));

    console.log(`[DEBUG] Returning slots with availability:`, result.map(s => ({ id: s.id, startTime: s.startTime, isAvailable: s.isAvailable })));
    return result;
  }

  async updateTimeSlotAvailability(id: string, isAvailable: boolean): Promise<void> {
    await db.update(timeSlots).set({ isAvailable }).where(eq(timeSlots.id, id));
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    
    // After creating a booking, the time slot becomes unavailable for others
    // Note: We don't modify the timeSlots table isAvailable field anymore
    // Instead, availability is calculated dynamically based on bookings
    
    return newBooking;
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    const bookingsWithDetails = await db
      .select({
        // Booking fields
        id: bookings.id,
        customerId: bookings.customerId,
        salonId: bookings.salonId,
        serviceId: bookings.serviceId,
        staffId: bookings.staffId,
        timeSlotId: bookings.timeSlotId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalAmount: bookings.totalAmount,
        confirmationAmount: bookings.confirmationAmount,
        status: bookings.status,
        paymentId: bookings.paymentId,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        isWalkIn: bookings.isWalkIn,
        walkInCustomerName: bookings.walkInCustomerName,
        walkInCustomerPhone: bookings.walkInCustomerPhone,
        notes: bookings.notes,
        // Salon details
        salon: {
          id: salons.id,
          name: salons.name,
          address: salons.address,
          phone: salons.phone,
        },
        // Service details
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
        },
        // Staff details (optional)
        staff: {
          id: staff.id,
          name: staff.name,
          designation: staff.designation,
        },
      })
      .from(bookings)
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(staff, eq(bookings.staffId, staff.id))
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));

    return bookingsWithDetails as any;
  }

  async getBookingsBySalon(salonId: string): Promise<Booking[]> {
    const bookingsWithDetails = await db
      .select({
        // Booking fields
        id: bookings.id,
        customerId: bookings.customerId,
        salonId: bookings.salonId,
        serviceId: bookings.serviceId,
        staffId: bookings.staffId,
        timeSlotId: bookings.timeSlotId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalAmount: bookings.totalAmount,
        confirmationAmount: bookings.confirmationAmount,
        status: bookings.status,
        paymentId: bookings.paymentId,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        isWalkIn: bookings.isWalkIn,
        walkInCustomerName: bookings.walkInCustomerName,
        walkInCustomerPhone: bookings.walkInCustomerPhone,
        notes: bookings.notes,
        // Customer details
        customer: {
          id: users.id,
          name: users.firstName || bookings.walkInCustomerName,
          email: users.email,
          phone: users.phone || bookings.walkInCustomerPhone,
        },
        // Service details
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
        },
        // Staff details (optional)
        staff: {
          id: staff.id,
          name: staff.name,
          designation: staff.designation,
        },
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(staff, eq(bookings.staffId, staff.id))
      .where(eq(bookings.salonId, salonId))
      .orderBy(desc(bookings.createdAt));

    return bookingsWithDetails as any;
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBookingStatus(
    id: string, 
    status: string, 
    paymentId?: string, 
    paymentStatus?: string
  ): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (paymentId) updateData.paymentId = paymentId;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    await db.update(bookings).set(updateData).where(eq(bookings.id, id));
  }

  async createWalkInBooking(booking: InsertWalkInBooking): Promise<Booking> {
    // Walk-in bookings are immediately confirmed and paid (cash/card/upi)
    const walkInBookingData = {
      ...booking,
      status: "confirmed" as const,
      paymentStatus: booking.walkInPaymentMethod === "online" ? "pending" : "completed" as const,
      // Leave customerId and timeSlotId null for walk-ins
      customerId: null,
      timeSlotId: null,
    };

    const [newBooking] = await db.insert(bookings).values(walkInBookingData).returning();
    return newBooking;
  }

  async getWalkInBookingsBySalon(salonId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.salonId, salonId), eq(bookings.isWalkIn, true)))
      .orderBy(desc(bookings.createdAt));
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update salon rating after creating review
    await this.updateSalonRating(review.salonId);
    
    return newReview;
  }

  async getReviewsBySalon(salonId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.salonId, salonId))
      .orderBy(desc(reviews.createdAt));
  }

  async updateSalonRating(salonId: string): Promise<void> {
    const salonReviews = await this.getReviewsBySalon(salonId);
    
    if (salonReviews.length > 0) {
      const averageRating = salonReviews.reduce((sum, review) => sum + review.rating, 0) / salonReviews.length;
      
      await db
        .update(salons)
        .set({
          averageRating: averageRating.toFixed(2),
          totalReviews: salonReviews.length,
        })
        .where(eq(salons.id, salonId));
    }
  }

  // Gallery operations
  async createGalleryImage(galleryImage: InsertSalonGallery): Promise<SalonGallery> {
    const [newGalleryImage] = await db.insert(salonGallery).values(galleryImage).returning();
    return newGalleryImage;
  }

  async getGalleryImagesBySalon(salonId: string): Promise<SalonGallery[]> {
    return await db
      .select()
      .from(salonGallery)
      .where(and(eq(salonGallery.salonId, salonId), eq(salonGallery.isActive, true)))
      .orderBy(asc(salonGallery.order), desc(salonGallery.createdAt));
  }

  async updateGalleryImage(id: string, galleryImage: Partial<InsertSalonGallery>): Promise<SalonGallery | undefined> {
    const [updatedImage] = await db
      .update(salonGallery)
      .set(galleryImage)
      .where(eq(salonGallery.id, id))
      .returning();
    return updatedImage;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.update(salonGallery).set({ isActive: false }).where(eq(salonGallery.id, id));
  }

  // Referral operations
  async getReferralByCode(referralCode: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, referralCode));
    return referral;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async completeReferral(referralId: string, bookingId: string): Promise<void> {
    await db.update(referrals).set({
      status: "completed",
      bookingId: bookingId,
      completedAt: new Date(),
    }).where(eq(referrals.id, referralId));
  }

  async generateUniqueReferralCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const existingReferral = await this.getReferralByCode(code);
      if (!existingReferral) {
        isUnique = true;
      }
    }
    
    return code!;
  }

  // Customer referral campaign operations
  async getOrCreateCustomerReferralCampaign(referrerId: string): Promise<CustomerReferralCampaign> {
    // Try to get existing active campaign
    const [existingCampaign] = await db.select().from(customerReferralCampaigns)
      .where(and(
        eq(customerReferralCampaigns.referrerId, referrerId),
        eq(customerReferralCampaigns.isCompleted, false),
        eq(customerReferralCampaigns.campaignType, "10_customer_free_booking")
      ));

    if (existingCampaign) {
      return existingCampaign;
    }

    // Create new campaign
    const [newCampaign] = await db.insert(customerReferralCampaigns).values({
      referrerId,
      campaignType: "10_customer_free_booking",
      targetCount: 10,
      currentCount: 0,
      completedReferralIds: [],
      freeBookingCredits: 0,
    }).returning();

    return newCampaign;
  }

  async updateCustomerReferralProgress(referrerId: string, referralId: string): Promise<boolean> {
    const campaign = await this.getOrCreateCustomerReferralCampaign(referrerId);
    
    // Check if this referral is already counted
    if (campaign.completedReferralIds && campaign.completedReferralIds.includes(referralId)) {
      return false; // Already counted
    }

    const newCount = campaign.currentCount + 1;
    const newCompletedReferralIds = [...(campaign.completedReferralIds || []), referralId];
    
    const isCompleted = newCount >= campaign.targetCount;
    const newCredits = isCompleted ? campaign.freeBookingCredits + 1 : campaign.freeBookingCredits;

    await db.update(customerReferralCampaigns).set({
      currentCount: newCount,
      completedReferralIds: newCompletedReferralIds,
      freeBookingCredits: newCredits,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(customerReferralCampaigns.id, campaign.id));

    // If milestone completed, create a free booking credit
    if (isCompleted) {
      const avgServicePrice = await this.calculateAverageServicePrice();
      
      await this.createFreeBookingCredit({
        customerId: referrerId,
        creditType: "customer_milestone",
        maxAmount: avgServicePrice.toString(),
        referenceId: campaign.id,
        description: `Free booking credit for referring 10 customers (up to ₹${avgServicePrice})`,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days expiry
      });
    }

    return isCompleted;
  }

  // Free booking credit operations
  async createFreeBookingCredit(credit: InsertFreeBookingCredit): Promise<FreeBookingCredit> {
    const [newCredit] = await db.insert(freeBookingCredits).values(credit).returning();
    return newCredit;
  }

  async getAvailableFreeCredits(customerId: string): Promise<FreeBookingCredit[]> {
    return await db.select().from(freeBookingCredits)
      .where(and(
        eq(freeBookingCredits.customerId, customerId),
        eq(freeBookingCredits.isUsed, false),
        or(
          isNull(freeBookingCredits.expiresAt),
          gte(freeBookingCredits.expiresAt, new Date())
        )
      ))
      .orderBy(asc(freeBookingCredits.expiresAt));
  }

  async useFreeBookingCredit(creditId: string, bookingId: string): Promise<void> {
    await db.update(freeBookingCredits).set({
      isUsed: true,
      bookingId: bookingId,
      usedAt: new Date(),
    }).where(eq(freeBookingCredits.id, creditId));
  }

  async calculateAverageServicePrice(): Promise<number> {
    const [result] = await db.select({
      avgPrice: sql<number>`AVG(${services.price}::numeric)::float`
    }).from(services);
    
    return Math.round(result?.avgPrice || 300); // Default to ₹300 if no services
  }

  // Referral milestone operations
  async getOrCreateReferralMilestone(referrerId: string): Promise<ReferralMilestone> {
    // Try to get existing active milestone
    const [existingMilestone] = await db.select().from(referralMilestones)
      .where(and(
        eq(referralMilestones.referrerId, referrerId),
        eq(referralMilestones.isCompleted, false),
        eq(referralMilestones.milestoneType, "5_customer_full_fee")
      ));

    if (existingMilestone) {
      return existingMilestone;
    }

    // Create new milestone
    const [newMilestone] = await db.insert(referralMilestones).values({
      referrerId,
      milestoneType: "5_customer_full_fee",
      targetCount: 5,
      currentCount: 0,
      rewardAmount: "0",
      completedBookingIds: [],
    }).returning();

    return newMilestone;
  }

  async updateReferralMilestoneProgress(referrerId: string, bookingId: string, confirmationAmount: number): Promise<boolean> {
    const milestone = await this.getOrCreateReferralMilestone(referrerId);
    
    // Check if this booking is already counted
    if (milestone.completedBookingIds && milestone.completedBookingIds.includes(bookingId)) {
      return false; // Already counted
    }

    const newCount = (milestone.currentCount || 0) + 1;
    const newCompletedBookingIds = [...(milestone.completedBookingIds || []), bookingId];
    const newRewardAmount = parseFloat(milestone.rewardAmount) + confirmationAmount;
    
    const isCompleted = newCount >= milestone.targetCount;

    await db.update(referralMilestones).set({
      currentCount: newCount,
      completedBookingIds: newCompletedBookingIds,
      rewardAmount: newRewardAmount.toString(),
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    }).where(eq(referralMilestones.id, milestone.id));

    // If milestone completed, credit the reward to referrer's wallet
    if (isCompleted) {
      await this.addWalletCredit(
        referrerId,
        newRewardAmount,
        `5-Customer Milestone Reward: 100% confirmation fees from ${milestone.targetCount} bookings`,
        milestone.id,
        "referral_milestone"
      );
    }

    return isCompleted;
  }

  // Wallet operations
  async getOrCreateWallet(customerId: string): Promise<Wallet> {
    const [existingWallet] = await db.select().from(wallets)
      .where(eq(wallets.customerId, customerId));

    if (existingWallet) {
      return existingWallet;
    }

    const [newWallet] = await db.insert(wallets).values({
      customerId,
      balance: "0",
    }).returning();

    return newWallet;
  }

  async addWalletCredit(customerId: string, amount: number, description: string, referenceId: string, referenceType: string): Promise<void> {
    const wallet = await this.getOrCreateWallet(customerId);
    const newBalance = parseFloat(wallet.balance) + amount;

    // Update wallet balance
    await db.update(wallets).set({
      balance: newBalance.toString(),
      updatedAt: new Date(),
    }).where(eq(wallets.id, wallet.id));

    // Record transaction
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: "credit",
      amount: amount.toString(),
      description,
      referenceId,
      referenceType: referenceType as any,
    });
  }

  // Salon likes operations
  async toggleSalonLike(customerId: string, salonId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    // Check if like already exists
    const [existingLike] = await db.select().from(salonLikes)
      .where(and(eq(salonLikes.customerId, customerId), eq(salonLikes.salonId, salonId)));

    if (existingLike) {
      // Unlike - remove the like
      await db.delete(salonLikes)
        .where(and(eq(salonLikes.customerId, customerId), eq(salonLikes.salonId, salonId)));
      
      const likesCount = await this.getSalonLikesCount(salonId);
      return { isLiked: false, likesCount };
    } else {
      // Like - add the like
      await db.insert(salonLikes).values({
        customerId,
        salonId,
        isLiked: true,
      });
      
      const likesCount = await this.getSalonLikesCount(salonId);
      return { isLiked: true, likesCount };
    }
  }

  async getSalonLikeStatus(customerId: string, salonId: string): Promise<boolean> {
    const [like] = await db.select().from(salonLikes)
      .where(and(eq(salonLikes.customerId, customerId), eq(salonLikes.salonId, salonId)));
    return !!like && like.isLiked;
  }

  async getSalonLikesCount(salonId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(salonLikes)
      .where(and(eq(salonLikes.salonId, salonId), eq(salonLikes.isLiked, true)));
    return result[0]?.count || 0;
  }

  async getSalonLikesByCustomer(customerId: string): Promise<SalonLike[]> {
    return await db.select().from(salonLikes)
      .where(and(eq(salonLikes.customerId, customerId), eq(salonLikes.isLiked, true)))
      .orderBy(desc(salonLikes.createdAt));
  }

  async getSalonLikesForOwner(salonId: string): Promise<SalonLike[]> {
    return await db.select({
      id: salonLikes.id,
      customerId: salonLikes.customerId,
      salonId: salonLikes.salonId,
      isLiked: salonLikes.isLiked,
      createdAt: salonLikes.createdAt,
      updatedAt: salonLikes.updatedAt,
      customerName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
      customerEmail: users.email,
    }).from(salonLikes)
      .innerJoin(users, eq(salonLikes.customerId, users.id))
      .where(and(eq(salonLikes.salonId, salonId), eq(salonLikes.isLiked, true)))
      .orderBy(desc(salonLikes.createdAt));
  }

  async getCustomerLikedSalons(customerId: string): Promise<any[]> {
    return await db.select({
      id: salons.id,
      name: salons.name,
      address: salons.address,
      imageUrl: salons.imageUrl,
      averageRating: salons.averageRating,
      confirmationAmount: salons.confirmationAmount,
      likesCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${salonLikes} 
        WHERE ${salonLikes.salonId} = ${salons.id} 
        AND ${salonLikes.isLiked} = true
      )`,
      likedAt: salonLikes.createdAt
    })
      .from(salonLikes)
      .innerJoin(salons, eq(salonLikes.salonId, salons.id))
      .where(and(
        eq(salonLikes.customerId, customerId),
        eq(salonLikes.isLiked, true),
        eq(salons.isActive, true)
      ))
      .orderBy(desc(salonLikes.createdAt));
  }

  // Admin operations implementation
  async getAllUsers(userType?: string, search?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    const conditions = [];
    if (userType) {
      conditions.push(eq(users.userType, userType as any));
    }
    
    if (search) {
      conditions.push(
        or(
          sql`${users.firstName} ILIKE ${`%${search}%`}`,
          sql`${users.lastName} ILIKE ${`%${search}%`}`,
          sql`${users.email} ILIKE ${`%${search}%`}`
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(users.createdAt));
  }

  async blockUser(userId: string, adminId: string): Promise<void> {
    await db.update(users)
      .set({ isBlocked: true })
      .where(eq(users.id, userId));
    
    await this.logAdminActivity({
      adminId,
      action: 'block_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({ action: 'User blocked' })
    });
  }

  async unblockUser(userId: string, adminId: string): Promise<void> {
    await db.update(users)
      .set({ isBlocked: false })
      .where(eq(users.id, userId));
    
    await this.logAdminActivity({
      adminId,
      action: 'unblock_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({ action: 'User unblocked' })
    });
  }

  async getAllSalonsForAdmin(): Promise<any[]> {
    const result = await db
      .select({
        salon: salons,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone
        }
      })
      .from(salons)
      .leftJoin(users, eq(salons.ownerId, users.id))
      .orderBy(desc(salons.createdAt));

    return result.map(row => ({
      ...row.salon,
      owner: row.owner
    }));
  }

  async getPendingSalons(): Promise<any[]> {
    const result = await db
      .select({
        salon: salons,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone
        }
      })
      .from(salons)
      .leftJoin(users, eq(salons.ownerId, users.id))
      .where(eq(salons.verificationStatus, 'pending'))
      .orderBy(desc(salons.createdAt));

    return result.map(row => ({
      ...row.salon,
      owner: row.owner
    }));
  }

  async approveSalon(salonId: string, adminId: string, notes?: string): Promise<void> {
    await db.update(salons)
      .set({
        verificationStatus: 'approved',
        verificationNotes: notes,
        verifiedAt: new Date(),
        verifiedBy: adminId
      })
      .where(eq(salons.id, salonId));
    
    await this.logAdminActivity({
      adminId,
      action: 'approve_salon',
      targetType: 'salon',
      targetId: salonId,
      details: JSON.stringify({ notes })
    });
  }

  async rejectSalon(salonId: string, adminId: string, notes: string): Promise<void> {
    await db.update(salons)
      .set({
        verificationStatus: 'rejected',
        verificationNotes: notes,
        verifiedAt: new Date(),
        verifiedBy: adminId
      })
      .where(eq(salons.id, salonId));
    
    await this.logAdminActivity({
      adminId,
      action: 'reject_salon',
      targetType: 'salon',
      targetId: salonId,
      details: JSON.stringify({ notes })
    });
  }

  async uploadVerificationDocument(doc: InsertVerificationDocument): Promise<VerificationDocument> {
    const [document] = await db
      .insert(verificationDocuments)
      .values(doc)
      .returning();
    return document;
  }

  async getVerificationDocuments(salonId: string): Promise<VerificationDocument[]> {
    return await db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.salonId, salonId))
      .orderBy(desc(verificationDocuments.uploadedAt));
  }

  async logAdminActivity(log: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const [activity] = await db
      .insert(adminActivityLogs)
      .values(log)
      .returning();
    return activity;
  }

  async getAdminActivityLogs(limit: number = 50): Promise<AdminActivityLog[]> {
    return await db
      .select()
      .from(adminActivityLogs)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit);
  }

  async createContentModeration(moderation: InsertContentModeration): Promise<ContentModeration> {
    const [mod] = await db
      .insert(contentModerations)
      .values(moderation)
      .returning();
    return mod;
  }

  async getContentModerations(status?: string): Promise<ContentModeration[]> {
    let query = db.select().from(contentModerations);
    
    if (status) {
      query = query.where(eq(contentModerations.status, status as any));
    }
    
    return await query.orderBy(desc(contentModerations.createdAt));
  }

  async updateContentModeration(id: string, updates: Partial<ContentModeration>): Promise<void> {
    await db.update(contentModerations)
      .set(updates)
      .where(eq(contentModerations.id, id));
  }

  async getAdminDashboardStats(): Promise<any> {
    const [customersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.userType, 'customer'));

    const [salonsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salons);

    const [pendingSalonsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salons)
      .where(eq(salons.verificationStatus, 'pending'));

    const [bookingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);

    const [totalRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(${revenueShares.platformShare}), 0)` })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .where(eq(bookings.paymentStatus, 'completed'));

    return {
      totalCustomers: customersCount?.count || 0,
      totalSalons: salonsCount?.count || 0,
      pendingSalons: pendingSalonsCount?.count || 0,
      totalBookings: bookingsCount?.count || 0,
      totalRevenue: totalRevenue?.total || 0
    };
  }

  async getPlatformAnalytics(days: number = 30): Promise<PlatformAnalytics[]> {
    return await db
      .select()
      .from(platformAnalytics)
      .orderBy(desc(platformAnalytics.date))
      .limit(days);
  }

  // Password reset operations
  async findUserForPasswordReset(email: string, phone: string): Promise<User | undefined> {
    // First try to find user with matching email and phone in users table
    const [directUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.phone, phone)));
    
    if (directUser) {
      return directUser;
    }

    // For salon owners, phone might be in salons table instead
    const [salonOwner] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profileImageUrl: users.profileImageUrl,
        userType: users.userType,
        isBlocked: users.isBlocked,
        isSocialAuth: users.isSocialAuth,
        socialProvider: users.socialProvider,
        socialId: users.socialId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(salons, eq(salons.ownerId, users.id))
      .where(and(
        eq(users.email, email),
        eq(salons.phone, phone),
        eq(users.userType, "salon_owner")
      ));
    
    return salonOwner;
  }

  // Password reset OTP operations
  async createPasswordResetOtp(otpData: InsertPasswordResetOtp): Promise<PasswordResetOtp> {
    const [otp] = await db.insert(passwordResetOtps).values(otpData).returning();
    return otp;
  }

  async getValidPasswordResetOtp(phone: string, otp: string): Promise<PasswordResetOtp | undefined> {
    const [otpRecord] = await db
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.phone, phone),
          eq(passwordResetOtps.otp, otp),
          eq(passwordResetOtps.isUsed, false),
          gte(passwordResetOtps.expiresAt, new Date())
        )
      );
    return otpRecord;
  }

  async markPasswordResetOtpUsed(id: string): Promise<void> {
    await db
      .update(passwordResetOtps)
      .set({ isUsed: true })
      .where(eq(passwordResetOtps.id, id));
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
