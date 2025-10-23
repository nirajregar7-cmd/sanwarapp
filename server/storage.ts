import {
  users,
  salons,
  services,
  staff,
  workingHours,
  timeSlots,
  bookings,
  reviews,
  reviewReplies,
  salonGallery,
  salonLikes,
  salonOwnerAccounts,
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
  emergencyBookingWaitlist,
  salonEmergencyConfig,
  emergencySlots,
  // Smart scheduling tables
  staffWorkingHours,
  staffServices,
  staffHolidays,
  staffTimeSlots,
  scheduleTemplates,
  type User,
  type UpsertUser,
  type Salon,
  type InsertSalon,
  type Service,
  type InsertService,
  type Staff,
  type InsertStaff,
  type WorkingHours,
  type InsertWorkingHours,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type InsertWalkInBooking,
  type Review,
  type ReviewWithCustomer,
  type ReviewReply,
  type ReviewWithReplies,
  type InsertReview,
  type InsertReviewReply,
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
  type EmergencyWaitlist,
  type InsertEmergencyWaitlist,
  type SalonEmergencyConfig,
  type InsertSalonEmergencyConfig,
  type EmergencySlot,
  type InsertEmergencySlot,
  // Smart scheduling types
  // Staff service management types are available from the schema
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for email/password and social auth)
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
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
  getTimeSlotsBySalonAndDate(salonId: string, date: string, serviceId?: string, staffId?: string): Promise<any[]>;
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
  
  // Review reply operations
  createReviewReply(reply: InsertReviewReply): Promise<ReviewReply>;
  getReviewReplies(reviewId: string): Promise<ReviewReply[]>;
  updateReviewReply(replyId: string, replyText: string): Promise<ReviewReply>;
  deleteReviewReply(replyId: string): Promise<void>;

  // Gallery operations
  createGalleryImage(galleryImage: InsertSalonGallery): Promise<SalonGallery>;
  getGalleryImagesBySalon(salonId: string): Promise<SalonGallery[]>;
  updateGalleryImage(id: string, galleryImage: Partial<InsertSalonGallery>): Promise<SalonGallery | undefined>;
  deleteGalleryImage(id: string): Promise<void>;

  // Referral operations
  getReferralByCode(referralCode: string): Promise<Referral | undefined>;
  getReferralById(referralId: string): Promise<Referral | undefined>;
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
  addWalletTransaction(customerId: string, amount: number, description: string, referenceId: string, referenceType: string): Promise<void>;
  
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

  // Emergency booking operations
  createEmergencyWaitlist(waitlist: InsertEmergencyWaitlist): Promise<EmergencyWaitlist>;
  getEmergencyWaitlistBySalon(salonId: string): Promise<EmergencyWaitlist[]>;
  getEmergencyWaitlistByCustomer(customerId: string): Promise<EmergencyWaitlist[]>;
  updateEmergencyWaitlistStatus(id: string, status: string, assignedSlotId?: string, assignedBookingId?: string): Promise<void>;
  getActiveEmergencyBookings(salonId: string, date: string): Promise<number>;

  // Salon emergency configuration
  getSalonEmergencyConfig(salonId: string): Promise<SalonEmergencyConfig | undefined>;
  upsertSalonEmergencyConfig(config: InsertSalonEmergencyConfig): Promise<SalonEmergencyConfig>;

  // Emergency slots operations
  createEmergencySlot(slot: InsertEmergencySlot): Promise<EmergencySlot>;
  getAvailableEmergencySlots(salonId: string, date: string): Promise<EmergencySlot[]>;
  bookEmergencySlot(slotId: string, bookingId: string): Promise<void>;
  getEmergencySlotsBySalon(salonId: string): Promise<EmergencySlot[]>;

  // Smart scheduling operations (staff-based scheduling)
  getSalonStaff(salonId: string): Promise<any[]>;
  createStaffMember(staff: any): Promise<any>;
  updateStaffMember(staffId: string, updates: any): Promise<any>;
  deleteStaffMember(staffId: string): Promise<void>;
  
  // Staff working hours operations
  upsertStaffWorkingHours(workingHour: any): Promise<any>;
  getStaffWorkingHours(staffId: string): Promise<any[]>;
  getStaffWorkingHoursByDay(staffId: string, dayOfWeek: number): Promise<any>;
  
  // Staff service assignments
  assignServiceToStaff(staffId: string, serviceId: string, customPrice?: number, estimatedDuration?: number): Promise<any>;
  removeServiceFromStaff(staffId: string, serviceId: string): Promise<void>;
  getStaffServices(staffId: string): Promise<any[]>;
  getStaffByService(serviceId: string): Promise<any[]>;
  
  // Staff holidays management
  createStaffHoliday(holiday: any): Promise<any>;
  getStaffHolidays(staffId: string): Promise<any[]>;
  approveStaffHoliday(holidayId: string, approvedBy: string): Promise<void>;
  deleteStaffHoliday(holidayId: string): Promise<void>;
  
  // Staff time slots operations
  createStaffTimeSlots(staffId: string, date: string, slots: any[]): Promise<any[]>;
  getStaffTimeSlots(staffId: string, date: string): Promise<any[]>;
  updateStaffTimeSlotAvailability(slotId: string, isAvailable: boolean): Promise<void>;
  deleteStaffTimeSlots(staffId: string, date: string): Promise<void>;
  
  // Schedule templates
  createScheduleTemplate(template: any): Promise<any>;
  getScheduleTemplates(salonId: string): Promise<any[]>;
  deleteScheduleTemplate(templateId: string): Promise<void>;

  // Admin settings operations
  getAdminSettings(): Promise<any[]>;
  getAdminSetting(settingKey: string): Promise<any | undefined>;
  updateAdminSetting(settingKey: string, settingValue: string, updatedBy: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
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
      password: null,
      isSocialAuth: false,
      isBlocked: false,
      socialProvider: null,
      socialId: null,
      brandName: null,
      brandDescription: null,
      isBrandOwner: false,
      isActive: true,
      isVerified: false,
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
    const [salon] = await db
      .select()
      .from(salons)
      .where(eq(salons.id, id));
    
    return salon;
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.ownerId, ownerId));
  }

  async getAllSalons(): Promise<Salon[]> {
    const salonsData = await db
      .select()
      .from(salons)
      .where(eq(salons.isActive, true))
      .orderBy(desc(salons.averageRating));
    
    return salonsData;
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

  async getTimeSlotsBySalonAndDate(salonId: string, date: string, serviceId?: string, staffId?: string): Promise<any[]> {
    console.log(`[DEBUG] Fetching manual time slots for salon ${salonId} on date ${date}, service: ${serviceId}, staff: ${staffId}`);

    // Build conditions for filtering manually created time slots
    const conditions = [
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.date, date)
    ];

    // For customer booking: if specific staff selected, filter by them
    // Service filter removed since slots are generated service-agnostic (serviceId: null)
    if (staffId && staffId !== 'undefined') {
      conditions.push(eq(timeSlots.staffId, staffId));
    }

    // Get all time slots with staff and service details
    const slotsWithDetails = await db
      .select({
        id: timeSlots.id,
        salonId: timeSlots.salonId,
        staffId: timeSlots.staffId,
        serviceId: timeSlots.serviceId,
        date: timeSlots.date,
        startTime: timeSlots.startTime,
        endTime: timeSlots.endTime,
        isAvailable: timeSlots.isAvailable,
        slotType: timeSlots.slotType,
        staffName: staff.name,
        staffRole: staff.role,
        staffPhoto: staff.photoUrl,
        serviceName: services.name,
        servicePrice: services.price,
        serviceDuration: services.duration,
      })
      .from(timeSlots)
      .leftJoin(staff, eq(timeSlots.staffId, staff.id))
      .leftJoin(services, eq(timeSlots.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(asc(timeSlots.startTime));

    console.log(`[DEBUG] Found ${slotsWithDetails.length} manually created time slots`);

    // Get booked slots to determine real-time availability
    const bookedSlots = await db
      .select({
        timeSlotId: bookings.timeSlotId
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.salonId, salonId),
          eq(bookings.date, date),
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "completed")
          )
        )
      );

    const bookedSlotIds = new Set(bookedSlots.map(b => b.timeSlotId));

    // Return slots with real-time availability
    const result = slotsWithDetails.map(slot => ({
      ...slot,
      isAvailable: !bookedSlotIds.has(slot.id)
    }));

    console.log(`[DEBUG] Returning ${result.length} manually created slots`);
    return result;
  }

  // Staff service assignment operations
  async assignServiceToStaff(staffId: string, serviceId: string, customPrice?: number, estimatedDuration?: number): Promise<any> {
    const assignmentData: any = {
      staffId,
      serviceId,
      isActive: true,
    };
    
    if (customPrice !== undefined) {
      assignmentData.customPrice = customPrice.toString();
    }
    
    if (estimatedDuration !== undefined) {
      assignmentData.estimatedDuration = estimatedDuration.toString();
    }

    const [assignment] = await db.insert(staffServices).values(assignmentData).returning();
    return assignment;
  }

  async getStaffServices(staffId: string): Promise<any[]> {
    return await db
      .select({
        id: staffServices.id,
        staffId: staffServices.staffId,
        serviceId: staffServices.serviceId,
        serviceName: services.name,
        servicePrice: services.price,
        serviceDuration: services.duration,
        customPrice: staffServices.customPrice,
        estimatedDuration: staffServices.estimatedDuration,
        isActive: staffServices.isActive,
      })
      .from(staffServices)
      .leftJoin(services, eq(staffServices.serviceId, services.id))
      .where(and(eq(staffServices.staffId, staffId), eq(staffServices.isActive, true)));
  }

  async getSalonStaffWithServices(salonId: string): Promise<any[]> {
    const staffList = await db
      .select()
      .from(staff)
      .where(and(eq(staff.salonId, salonId), eq(staff.isActive, true)));

    // Get services for each staff member
    const staffWithServices = await Promise.all(
      staffList.map(async (staffMember) => {
        const services = await this.getStaffServices(staffMember.id);
        return {
          ...staffMember,
          services,
        };
      })
    );

    return staffWithServices;
  }

  // Advanced staff-based slot generation
  async generateStaffBasedSlots(salonId: string, date: string): Promise<{ generated: number; message: string }> {
    console.log(`[SLOT GENERATION] Starting staff-based slot generation for salon ${salonId} on ${date}`);

    // Get salon working hours for the specified date
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const workingHours = await db
      .select()
      .from(workingHours)
      .where(and(eq(workingHours.salonId, salonId), eq(workingHours.dayOfWeek, dayOfWeek)));

    if (workingHours.length === 0 || !workingHours[0].isOpen) {
      return { generated: 0, message: "Salon is closed on this day" };
    }

    const { startTime, endTime } = workingHours[0];
    console.log(`[SLOT GENERATION] Salon hours: ${startTime} - ${endTime}`);

    // Get all active staff members with their assigned services
    const staffWithServices = await this.getSalonStaffWithServices(salonId);
    
    if (staffWithServices.length === 0) {
      return { generated: 0, message: "No active staff members found" };
    }

    console.log(`[SLOT GENERATION] Found ${staffWithServices.length} staff members`);

    // Check if slots already exist for this date
    const existingSlots = await db
      .select()
      .from(timeSlots)
      .where(and(eq(timeSlots.salonId, salonId), eq(timeSlots.date, date)));

    if (existingSlots.length > 0) {
      return { generated: 0, message: `${existingSlots.length} slots already exist for this date` };
    }

    let totalGeneratedSlots = 0;
    const slotsToInsert: any[] = [];

    // Generate slots for each staff member and their services
    for (const staffMember of staffWithServices) {
      if (staffMember.services.length === 0) {
        console.log(`[SLOT GENERATION] Staff ${staffMember.name} has no assigned services, skipping`);
        continue;
      }

      console.log(`[SLOT GENERATION] Generating slots for ${staffMember.name} with ${staffMember.services.length} services`);

      // For each service assigned to this staff member
      for (const service of staffMember.services) {
        const serviceDuration = service.estimatedDuration || service.serviceDuration || 30; // Default 30 minutes
        const slotDuration = staffMember.defaultSlotDuration || 30;

        // Generate time slots from start to end time
        let currentTime = startTime;
        const endTimeMinutes = this.timeToMinutes(endTime);

        while (this.timeToMinutes(currentTime) < endTimeMinutes) {
          const endSlotTime = this.addMinutes(currentTime, slotDuration);
          
          // Don't create slots that would go beyond working hours
          if (this.timeToMinutes(endSlotTime) > endTimeMinutes) {
            break;
          }

          slotsToInsert.push({
            salonId,
            staffId: staffMember.id,
            serviceId: service.serviceId,
            date,
            startTime: currentTime,
            endTime: endSlotTime,
            isAvailable: true,
            slotType: 'regular',
          });

          totalGeneratedSlots++;
          currentTime = endSlotTime;
        }
      }
    }

    // Insert all generated slots
    if (slotsToInsert.length > 0) {
      await db.insert(timeSlots).values(slotsToInsert);
      console.log(`[SLOT GENERATION] Successfully generated ${totalGeneratedSlots} slots`);
    }

    return {
      generated: totalGeneratedSlots,
      message: `Generated ${totalGeneratedSlots} staff-service specific slots`,
    };
  }

  // Get available slots grouped by staff and service
  async getStaffBasedTimeSlots(salonId: string, date: string, serviceId?: string, staffId?: string): Promise<any[]> {
    console.log(`[DEBUG] Fetching staff-based time slots for salon ${salonId} on date ${date}, service: ${serviceId}, staff: ${staffId}`);

    // Build dynamic where conditions
    const conditions = [
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.date, date)
    ];

    if (serviceId) {
      conditions.push(eq(timeSlots.serviceId, serviceId));
    }

    if (staffId) {
      conditions.push(eq(timeSlots.staffId, staffId));
    }

    // Get all time slots with staff and service details
    const slotsWithDetails = await db
      .select({
        id: timeSlots.id,
        salonId: timeSlots.salonId,
        staffId: timeSlots.staffId,
        serviceId: timeSlots.serviceId,
        date: timeSlots.date,
        startTime: timeSlots.startTime,
        endTime: timeSlots.endTime,
        isAvailable: timeSlots.isAvailable,
        slotType: timeSlots.slotType,
        staffName: staff.name,
        staffRole: staff.role,
        staffPhoto: staff.photoUrl,
        serviceName: services.name,
        servicePrice: services.price,
        serviceDuration: services.duration,
      })
      .from(timeSlots)
      .leftJoin(staff, eq(timeSlots.staffId, staff.id))
      .leftJoin(services, eq(timeSlots.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(asc(timeSlots.startTime));

    console.log(`[DEBUG] Found ${slotsWithDetails.length} total time slots with details`);

    // Get booked slots to determine availability
    const bookedSlots = await db
      .select({
        timeSlotId: bookings.timeSlotId
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.salonId, salonId),
          eq(bookings.date, date),
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "completed")
          )
        )
      );

    const bookedSlotIds = new Set(bookedSlots.map(b => b.timeSlotId));

    // Return slots with real-time availability
    const result = slotsWithDetails.map(slot => ({
      ...slot,
      isAvailable: !bookedSlotIds.has(slot.id)
    }));

    console.log(`[DEBUG] Returning ${result.length} staff-based slots`);
    return result;
  }

  // Utility functions for time calculations
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private addMinutes(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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
    // Get current date in IST (UTC+5:30)
    const currentDate = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const currentISTDate = new Date(currentDate.getTime() + istOffset);
    const todayIST = currentISTDate.toISOString().split('T')[0]; // YYYY-MM-DD format
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
        status: bookings.status,
        paymentId: bookings.paymentId,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        isWalkIn: bookings.isWalkIn,
        walkInCustomerName: bookings.walkInCustomerName,
        walkInCustomerPhone: bookings.walkInCustomerPhone,
        notes: bookings.notes,
        // Salon details - flatten instead of nested
        salonId_joined: salons.id,
        salonName: salons.name,
        salonAddress: salons.address,
        salonPhone: salons.phone,
        // Service details - flatten instead of nested
        serviceId_joined: services.id,
        serviceName: services.name,
        servicePrice: services.price,
        serviceDuration: services.duration,
        // Staff details - flatten instead of nested
        staffId_joined: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
      })
      .from(bookings)
      .leftJoin(salons, eq(bookings.salonId, salons.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(staff, eq(bookings.staffId, staff.id))
      .where(
        and(
          eq(bookings.customerId, customerId),
          gte(bookings.date, todayIST) // Only show today and future bookings
        )
      )
      .orderBy(desc(bookings.createdAt));

    // Transform flat results back to nested structure for API compatibility
    const transformedResults = bookingsWithDetails.map(booking => ({
      ...booking,
      salon: booking.salonId_joined ? {
        id: booking.salonId_joined,
        name: booking.salonName,
        address: booking.salonAddress,
        phone: booking.salonPhone,
      } : null,
      service: booking.serviceId_joined ? {
        id: booking.serviceId_joined,
        name: booking.serviceName,
        price: booking.servicePrice,
        duration: booking.serviceDuration,
      } : null,
      staff: booking.staffId_joined ? {
        id: booking.staffId_joined,
        name: booking.staffName,
        designation: booking.staffRole,
      } : null,
    }));

    return transformedResults as any;
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
        status: bookings.status,
        paymentId: bookings.paymentId,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        isWalkIn: bookings.isWalkIn,
        walkInCustomerName: bookings.walkInCustomerName,
        walkInCustomerPhone: bookings.walkInCustomerPhone,
        notes: bookings.notes,
        // Customer details - flatten instead of nested
        customerId_joined: users.id,
        customerFirstName: users.firstName,
        customerEmail: users.email,
        customerPhone: users.phone,
        // Service details - flatten instead of nested
        serviceId_joined: services.id,
        serviceName: services.name,
        servicePrice: services.price,
        serviceDuration: services.duration,
        // Staff details - flatten instead of nested
        staffId_joined: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.customerId, users.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(staff, eq(bookings.staffId, staff.id))
      .where(eq(bookings.salonId, salonId))
      .orderBy(desc(bookings.createdAt));

    // Transform flat results back to nested structure for API compatibility
    const transformedResults = bookingsWithDetails.map(booking => ({
      ...booking,
      customer: booking.customerId_joined ? {
        id: booking.customerId_joined,
        name: booking.customerFirstName || booking.walkInCustomerName,
        email: booking.customerEmail,
        phone: booking.customerPhone || booking.walkInCustomerPhone,
      } : null,
      service: booking.serviceId_joined ? {
        id: booking.serviceId_joined,
        name: booking.serviceName,
        price: booking.servicePrice,
        duration: booking.serviceDuration,
      } : null,
      staff: booking.staffId_joined ? {
        id: booking.staffId_joined,
        name: booking.staffName,
        designation: booking.staffRole,
      } : null,
    }));

    return transformedResults as any;
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
      paymentStatus: (booking.walkInPaymentMethod === "online" ? "pending" : "completed") as "pending" | "completed",
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

  async getReviewsBySalon(salonId: string): Promise<ReviewWithCustomer[]> {
    const reviewsData = await db
      .select()
      .from(reviews)
      .where(eq(reviews.salonId, salonId))
      .orderBy(desc(reviews.createdAt));

    // Fetch customer data for each review
    const reviewsWithCustomers = await Promise.all(
      reviewsData.map(async (review) => {
        let customerData = null;
        if (review.customerId) {
          const [customer] = await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
            })
            .from(users)
            .where(eq(users.id, review.customerId));
          customerData = customer || null;
        }

        return {
          ...review,
          customerFirstName: customerData?.firstName || null,
          customerLastName: customerData?.lastName || null,
          customerProfileImage: customerData?.profileImageUrl || null,
        } as ReviewWithCustomer;
      })
    );

    return reviewsWithCustomers;
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

  // Review reply operations
  async createReviewReply(reply: InsertReviewReply): Promise<ReviewReply> {
    const [newReply] = await db.insert(reviewReplies).values(reply).returning();
    return newReply;
  }

  async getReviewReplies(reviewId: string): Promise<ReviewReply[]> {
    return await db
      .select()
      .from(reviewReplies)
      .where(eq(reviewReplies.reviewId, reviewId))
      .orderBy(asc(reviewReplies.createdAt));
  }

  async updateReviewReply(replyId: string, replyText: string): Promise<ReviewReply> {
    const [updatedReply] = await db
      .update(reviewReplies)
      .set({ 
        replyText,
        updatedAt: sql`now()`
      })
      .where(eq(reviewReplies.id, replyId))
      .returning();
    return updatedReply;
  }

  async deleteReviewReply(replyId: string): Promise<void> {
    await db.delete(reviewReplies).where(eq(reviewReplies.id, replyId));
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

  async getReferralById(referralId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId));
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
        eq(customerReferralCampaigns.campaignType, "5_customer_free_booking")
      ));

    if (existingCampaign) {
      return existingCampaign;
    }

    // Create new campaign
    const [newCampaign] = await db.insert(customerReferralCampaigns).values({
      referrerId,
      campaignType: "5_customer_free_booking",
      targetCount: 5,
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
        description: `Free booking credit for referring 5 customers (up to ₹${avgServicePrice})`,
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
    const newBalance = parseFloat(wallet.balance || "0") + amount;

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

  async addWalletTransaction(customerId: string, amount: number, description: string, referenceId: string, referenceType: string): Promise<void> {
    // This is an alias for addWalletCredit for backward compatibility
    await this.addWalletCredit(customerId, amount, description, referenceId, referenceType);
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
    return !!like && (like.isLiked || false);
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

  // Automatic Payout System Methods
  async getSalonOwnerBankDetails(salonId: string): Promise<any> {
    const [account] = await db.select()
      .from(salonOwnerAccounts)
      .where(and(
        eq(salonOwnerAccounts.salonId, salonId),
        eq(salonOwnerAccounts.isVerified, true)
      ));
    return account;
  }

  async updateRevenueShareTransferStatus(
    bookingId: string, 
    status: 'pending' | 'completed' | 'failed',
    transferReference?: string,
    transferDate?: Date
  ): Promise<void> {
    const updateData: any = { transferStatus: status };
    if (transferReference) updateData.transferReference = transferReference;
    if (transferDate) updateData.transferDate = transferDate;

    await db.update(revenueShares)
      .set(updateData)
      .where(eq(revenueShares.bookingId, bookingId));
  }

  async getPendingRevenueShares(): Promise<any[]> {
    return await db.select({
      id: revenueShares.id,
      bookingId: revenueShares.bookingId,
      salonShare: revenueShares.salonShare,
      salonId: bookings.salonId,
      salonName: salons.name,
    })
      .from(revenueShares)
      .innerJoin(bookings, eq(revenueShares.bookingId, bookings.id))
      .innerJoin(salons, eq(bookings.salonId, salons.id))
      .where(eq(revenueShares.transferStatus, 'pending'));
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

  async rejectSalon(salonId: string, adminId: string, reason: string): Promise<void> {
    await db.update(salons)
      .set({
        verificationStatus: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: reason,
        verificationNotes: reason
      })
      .where(eq(salons.id, salonId));
    
    await this.logAdminActivity({
      adminId,
      action: 'reject_salon',
      targetType: 'salon',
      targetId: salonId,
      details: JSON.stringify({ reason })
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

  // Emergency booking operations
  async createEmergencyWaitlist(waitlist: InsertEmergencyWaitlist): Promise<EmergencyWaitlist> {
    const [emergencyWaitlist] = await db.insert(emergencyBookingWaitlist).values(waitlist).returning();
    return emergencyWaitlist;
  }

  async getEmergencyWaitlistBySalon(salonId: string): Promise<EmergencyWaitlist[]> {
    return await db.select().from(emergencyBookingWaitlist)
      .where(eq(emergencyBookingWaitlist.salonId, salonId))
      .orderBy(desc(emergencyBookingWaitlist.createdAt));
  }

  async getEmergencyWaitlistByCustomer(customerId: string): Promise<EmergencyWaitlist[]> {
    return await db.select().from(emergencyBookingWaitlist)
      .where(eq(emergencyBookingWaitlist.customerId, customerId))
      .orderBy(desc(emergencyBookingWaitlist.createdAt));
  }

  async updateEmergencyWaitlistStatus(id: string, status: string, assignedSlotId?: string, assignedBookingId?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedSlotId) updateData.assignedSlotId = assignedSlotId;
    if (assignedBookingId) updateData.assignedBookingId = assignedBookingId;
    if (status === 'confirmed') updateData.confirmedAt = new Date();

    await db.update(emergencyBookingWaitlist)
      .set(updateData)
      .where(eq(emergencyBookingWaitlist.id, id));
  }

  async getActiveEmergencyBookings(salonId: string, date: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(emergencyBookingWaitlist)
      .where(
        and(
          eq(emergencyBookingWaitlist.salonId, salonId),
          eq(emergencyBookingWaitlist.preferredDate, date),
          eq(emergencyBookingWaitlist.status, 'confirmed')
        )
      );
    return result[0]?.count || 0;
  }

  // Salon emergency configuration
  async getSalonEmergencyConfig(salonId: string): Promise<SalonEmergencyConfig | undefined> {
    const [config] = await db.select().from(salonEmergencyConfig)
      .where(eq(salonEmergencyConfig.salonId, salonId));
    return config;
  }

  async upsertSalonEmergencyConfig(config: InsertSalonEmergencyConfig): Promise<SalonEmergencyConfig> {
    const [emergencyConfig] = await db
      .insert(salonEmergencyConfig)
      .values(config)
      .onConflictDoUpdate({
        target: salonEmergencyConfig.salonId,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return emergencyConfig;
  }

  // Emergency slots operations
  async createEmergencySlot(slot: InsertEmergencySlot): Promise<EmergencySlot> {
    const [emergencySlot] = await db.insert(emergencySlots).values(slot).returning();
    return emergencySlot;
  }

  async getAvailableEmergencySlots(salonId: string, date: string): Promise<EmergencySlot[]> {
    return await db.select().from(emergencySlots)
      .where(
        and(
          eq(emergencySlots.salonId, salonId),
          eq(emergencySlots.date, date),
          eq(emergencySlots.isBooked, false)
        )
      )
      .orderBy(asc(emergencySlots.startTime));
  }

  async bookEmergencySlot(slotId: string, bookingId: string): Promise<void> {
    await db.update(emergencySlots)
      .set({ isBooked: true, bookingId })
      .where(eq(emergencySlots.id, slotId));
  }

  async getEmergencySlotsBySalon(salonId: string): Promise<EmergencySlot[]> {
    return await db.select().from(emergencySlots)
      .where(eq(emergencySlots.salonId, salonId))
      .orderBy(desc(emergencySlots.createdAt));
  }

  // Smart scheduling operations implementation
  async getSalonStaff(salonId: string): Promise<any[]> {
    const staffMembers = await db.select().from(staff)
      .where(and(eq(staff.salonId, salonId), eq(staff.isActive, true)))
      .orderBy(staff.name);
    
    // Format photo URLs for display
    return staffMembers.map(member => ({
      ...member,
      photoUrl: member.photoUrl ? 
        (member.photoUrl.startsWith('/objects/') ? member.photoUrl : `/objects/uploads/${member.photoUrl}`) 
        : null
    }));
  }

  async createStaffMember(staffData: any): Promise<any> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  }

  async updateStaffMember(staffId: string, updates: any): Promise<any> {
    const [updatedStaff] = await db
      .update(staff)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staff.id, staffId))
      .returning();
    return updatedStaff;
  }

  async deleteStaffMember(staffId: string): Promise<void> {
    await db.update(staff)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(staff.id, staffId));
  }

  // Staff working hours operations
  async upsertStaffWorkingHours(workingHour: any): Promise<any> {
    const [result] = await db
      .insert(staffWorkingHours)
      .values(workingHour)
      .onConflictDoUpdate({
        target: [staffWorkingHours.staffId, staffWorkingHours.dayOfWeek],
        set: {
          ...workingHour,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getStaffWorkingHours(staffId: string): Promise<any[]> {
    return await db.select().from(staffWorkingHours)
      .where(eq(staffWorkingHours.staffId, staffId))
      .orderBy(staffWorkingHours.dayOfWeek);
  }

  async getStaffWorkingHoursByDay(staffId: string, dayOfWeek: number): Promise<any> {
    const [result] = await db.select().from(staffWorkingHours)
      .where(and(
        eq(staffWorkingHours.staffId, staffId),
        eq(staffWorkingHours.dayOfWeek, dayOfWeek)
      ));
    return result;
  }

  // This function has been moved earlier in the file - removing duplicate

  async removeServiceFromStaff(staffId: string, serviceId: string): Promise<void> {
    await db.update(staffServices)
      .set({ isActive: false })
      .where(and(
        eq(staffServices.staffId, staffId),
        eq(staffServices.serviceId, serviceId)
      ));
  }

  // getStaffServices function already exists earlier - removing duplicate

  async getStaffByService(serviceId: string): Promise<any[]> {
    return await db.select({
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      staffRating: staff.rating,
      customPrice: staffServices.customPrice,
      estimatedDuration: staffServices.estimatedDuration,
    })
    .from(staff)
    .innerJoin(staffServices, eq(staff.id, staffServices.staffId))
    .where(and(
      eq(staffServices.serviceId, serviceId),
      eq(staffServices.isActive, true),
      eq(staff.isActive, true)
    ))
    .orderBy(staff.rating, staff.name);
  }

  // Staff holidays management
  async createStaffHoliday(holiday: any): Promise<any> {
    const [newHoliday] = await db.insert(staffHolidays).values(holiday).returning();
    return newHoliday;
  }

  async getStaffHolidays(staffId: string): Promise<any[]> {
    return await db.select().from(staffHolidays)
      .where(eq(staffHolidays.staffId, staffId))
      .orderBy(desc(staffHolidays.date));
  }

  async approveStaffHoliday(holidayId: string, approvedBy: string): Promise<void> {
    await db.update(staffHolidays)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(staffHolidays.id, holidayId));
  }

  async deleteStaffHoliday(holidayId: string): Promise<void> {
    await db.delete(staffHolidays)
      .where(eq(staffHolidays.id, holidayId));
  }

  // Staff time slots operations
  async createStaffTimeSlots(staffId: string, date: string, slots: any[]): Promise<any[]> {
    // Delete existing slots for this staff member and date
    await db.delete(staffTimeSlots)
      .where(and(
        eq(staffTimeSlots.staffId, staffId),
        eq(staffTimeSlots.date, date)
      ));

    // Insert new slots
    if (slots.length > 0) {
      return await db.insert(staffTimeSlots).values(slots).returning();
    }
    return [];
  }

  async getStaffTimeSlots(staffId: string, date: string): Promise<any[]> {
    return await db.select().from(staffTimeSlots)
      .where(and(
        eq(staffTimeSlots.staffId, staffId),
        eq(staffTimeSlots.date, date)
      ))
      .orderBy(staffTimeSlots.startTime);
  }

  async updateStaffTimeSlotAvailability(slotId: string, isAvailable: boolean): Promise<void> {
    await db.update(staffTimeSlots)
      .set({ isAvailable })
      .where(eq(staffTimeSlots.id, slotId));
  }

  async deleteStaffTimeSlots(staffId: string, date: string): Promise<void> {
    await db.delete(staffTimeSlots)
      .where(and(
        eq(staffTimeSlots.staffId, staffId),
        eq(staffTimeSlots.date, date)
      ));
  }

  // Schedule templates
  async createScheduleTemplate(template: any): Promise<any> {
    const [newTemplate] = await db.insert(scheduleTemplates).values(template).returning();
    return newTemplate;
  }

  async getScheduleTemplates(salonId: string): Promise<any[]> {
    return await db.select().from(scheduleTemplates)
      .where(and(
        eq(scheduleTemplates.salonId, salonId),
        eq(scheduleTemplates.isActive, true)
      ))
      .orderBy(scheduleTemplates.name);
  }

  async deleteScheduleTemplate(templateId: string): Promise<void> {
    await db.update(scheduleTemplates)
      .set({ isActive: false })
      .where(eq(scheduleTemplates.id, templateId));
  }

  // Helper methods for time conversion
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Enhanced slot generation methods
  async generateBulkStaffSlots(salonId: string, startDate: string, endDate: string): Promise<any> {
    console.log(`[BULK GENERATION] Processing bulk slots for salon ${salonId} from ${startDate} to ${endDate}`);
    
    let totalGenerated = 0;
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`[BULK GENERATION] Generating slots for date ${dateStr}`);
      
      try {
        const result = await this.generateStaffBasedSlots(salonId, dateStr);
        totalGenerated += result.generated;
        console.log(`[BULK GENERATION] Generated ${result.generated} slots for ${dateStr}`);
      } catch (error) {
        console.error(`[BULK GENERATION] Error generating slots for ${dateStr}:`, error);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`[BULK GENERATION] Completed bulk generation: ${totalGenerated} total slots created`);
    
    return {
      totalGenerated,
      message: `Successfully generated ${totalGenerated} slots from ${startDate} to ${endDate}`
    };
  }

  async generateDynamicStaffSlots(
    salonId: string, 
    staffId: string, 
    date: string, 
    openingTime: string, 
    closingTime: string, 
    breakDuration: number
  ): Promise<any> {
    console.log(`[DYNAMIC GENERATION] Generating dynamic slots for staff ${staffId} on ${date} (${openingTime}-${closingTime}, break: ${breakDuration}min)`);
    
    // Get staff information and their assigned services
    const staffInfo = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        serviceId: staffServices.serviceId,
        serviceName: services.name,
        serviceDuration: services.duration,
        estimatedDuration: staffServices.estimatedDuration,
        customPrice: staffServices.customPrice,
        servicePrice: services.price,
      })
      .from(staff)
      .leftJoin(staffServices, and(
        eq(staffServices.staffId, staff.id),
        eq(staffServices.isActive, true)
      ))
      .leftJoin(services, eq(services.id, staffServices.serviceId))
      .where(and(
        eq(staff.salonId, salonId),
        eq(staff.id, staffId),
        eq(staff.isActive, true)
      ));

    if (staffInfo.length === 0 || !staffInfo[0].serviceId) {
      console.log(`[DYNAMIC GENERATION] No active staff member or services found for staff ${staffId}`);
      return { generated: 0, staffName: 'Unknown', message: 'No active services assigned to this staff member' };
    }

    // Get existing bookings for this date to avoid conflicts
    const existingBookings = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime
      })
      .from(bookings)
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.staffId, staffId),
        eq(bookings.date, date),
        eq(bookings.status, 'confirmed')
      ));

    // Parse opening and closing times
    const openingMinutes = this.timeToMinutes(openingTime);
    const closingMinutes = this.timeToMinutes(closingTime);
    
    // Calculate break time (halfway through the day)
    const workingMinutes = closingMinutes - openingMinutes;
    const breakStartMinutes = openingMinutes + Math.floor(workingMinutes / 2);
    const breakEndMinutes = breakStartMinutes + breakDuration;

    const slots = [];
    const staffName = staffInfo[0].staffName;
    
    // Group services by duration for sequence generation
    const servicesByDuration = staffInfo.reduce((acc: any, service) => {
      if (service.serviceId) {
        const duration = service.estimatedDuration || service.serviceDuration;
        const durationKey = String(duration);
        if (!acc[durationKey]) acc[durationKey] = [];
        acc[durationKey].push(service);
      }
      return acc;
    }, {});

    const allServices = Object.values(servicesByDuration).flat() as any[];
    let serviceIndex = 0;
    
    let currentTime = openingMinutes;
    
    while (currentTime < closingMinutes) {
      // Skip break time
      if (currentTime >= breakStartMinutes && currentTime < breakEndMinutes) {
        currentTime = breakEndMinutes;
        continue;
      }
      
      // Get next service in sequence
      const currentService = allServices[serviceIndex % allServices.length];
      const serviceDuration = currentService.estimatedDuration || currentService.serviceDuration;
      const endTime = currentTime + serviceDuration;
      
      // Check if slot fits before closing time
      if (endTime > closingMinutes) {
        break;
      }
      
      // Check if slot conflicts with break time
      if (currentTime < breakEndMinutes && endTime > breakStartMinutes) {
        currentTime = breakEndMinutes;
        continue;
      }
      
      const startTimeStr = this.minutesToTime(currentTime);
      const endTimeStr = this.minutesToTime(endTime);
      
      // Check for conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = this.timeToMinutes(booking.startTime);
        const bookingEnd = this.timeToMinutes(booking.endTime);
        return (currentTime < bookingEnd && endTime > bookingStart);
      });
      
      if (!hasConflict) {
        slots.push({
          id: crypto.randomUUID(),
          salonId,
          staffId,
          serviceId: currentService.serviceId,
          date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          isAvailable: true,
          slotType: 'regular' as const,
          price: currentService.customPrice || currentService.servicePrice
        });
      }
      
      currentTime = endTime;
      serviceIndex++;
    }

    // Clear existing dynamic slots for this staff and date
    await db.delete(timeSlots)
      .where(and(
        eq(timeSlots.salonId, salonId),
        eq(timeSlots.staffId, staffId),
        eq(timeSlots.date, date),
        eq(timeSlots.slotType, 'regular')
      ));

    // Insert new slots
    if (slots.length > 0) {
      await db.insert(timeSlots).values(slots);
    }

    console.log(`[DYNAMIC GENERATION] Generated ${slots.length} dynamic service-based slots for ${staffName}`);
    
    return {
      generated: slots.length,
      staffName,
      message: `Generated ${slots.length} service-based slots with custom working hours and break time`
    };
  }

  // Payment processing functions (stubs for future implementation)
  async createSalonFundAccount(salonId: string, bankDetails: any): Promise<any> {
    // Placeholder implementation - would integrate with payment gateway
    console.log(`Creating fund account for salon ${salonId}`, bankDetails);
    return { success: true, fundAccountId: `fa_${Date.now()}` };
  }

  async processSalonPayout(salonId: string, amount: number, transferReference?: string): Promise<any> {
    // Placeholder implementation - would integrate with payment gateway
    console.log(`Processing payout for salon ${salonId}, amount: ${amount}, reference: ${transferReference}`);
    return { success: true, transferId: `tr_${Date.now()}`, status: 'completed' };
  }

  // Access to db for the smart scheduling service
  get db() {
    return db;
  }

  // Admin settings operations
  async getAdminSettings(): Promise<any[]> {
    const { adminSettings } = await import('@shared/schema');
    return db.select().from(adminSettings);
  }

  async getAdminSetting(settingKey: string): Promise<any | undefined> {
    const { adminSettings } = await import('@shared/schema');
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, settingKey));
    return setting;
  }

  async updateAdminSetting(settingKey: string, settingValue: string, updatedBy: string): Promise<any> {
    const { adminSettings } = await import('@shared/schema');
    const existingSetting = await this.getAdminSetting(settingKey);
    
    if (existingSetting) {
      const [updated] = await db
        .update(adminSettings)
        .set({ 
          settingValue, 
          updatedBy,
          updatedAt: new Date() 
        })
        .where(eq(adminSettings.settingKey, settingKey))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(adminSettings)
        .values({ 
          settingKey, 
          settingValue, 
          updatedBy 
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
