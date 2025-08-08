import {
  users,
  salons,
  services,
  workingHours,
  timeSlots,
  bookings,
  reviews,
  salonGallery,
  referrals,
  referralMilestones,
  wallets,
  walletTransactions,
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
  type Review,
  type InsertReview,
  type SalonGallery,
  type InsertSalonGallery,
  type Referral,
  type InsertReferral,
  type ReferralMilestone,
  type InsertReferralMilestone,
  type Wallet,
  type InsertWallet,
  type WalletTransaction,
  type InsertWalletTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for email/password auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
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
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  getBookingsBySalon(salonId: string): Promise<Booking[]>;
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
  
  // Referral milestone operations
  getOrCreateReferralMilestone(referrerId: string): Promise<ReferralMilestone>;
  updateReferralMilestoneProgress(referrerId: string, bookingId: string, confirmationAmount: number): Promise<boolean>; // Returns true if milestone completed
  
  // Wallet operations
  getOrCreateWallet(customerId: string): Promise<Wallet>;
  addWalletCredit(customerId: string, amount: number, description: string, referenceId: string, referenceType: string): Promise<void>;
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
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon;
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.ownerId, ownerId));
  }

  async getAllSalons(): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.isActive, true)).orderBy(desc(salons.averageRating));
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
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsBySalon(salonId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.salonId, salonId))
      .orderBy(desc(bookings.createdAt));
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

    const newCount = milestone.currentCount + 1;
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
      referenceType,
    });
  }
}

export const storage = new DatabaseStorage();
