import {
  users,
  salons,
  services,
  workingHours,
  timeSlots,
  bookings,
  reviews,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();
