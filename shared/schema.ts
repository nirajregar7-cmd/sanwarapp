import { 
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table for email/password and social authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password auth (null for social auth)
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name"),
  phone: varchar("phone", { length: 20 }),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["customer", "salon_owner", "admin", "super_admin"] }).notNull().default("customer"),
  isBlocked: boolean("is_blocked").default(false),
  // Social authentication fields
  isSocialAuth: boolean("is_social_auth").default(false),
  socialProvider: varchar("social_provider", { enum: ["google", "facebook"] }),
  socialId: varchar("social_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salons table
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  imageUrl: varchar("image_url"),
  // Location fields for map integration
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  // Rating fields
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  // Business settings
  confirmationAmount: integer("confirmation_amount").default(0), // in paise (₹20 = 2000 paise)
  monthlyFee: integer("monthly_fee").default(10000), // ₹100 in paise
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false), // for premium features
  verificationStatus: varchar("verification_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Working hours table
export const workingHours = pgTable("working_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean("is_open").default(true),
  openTime: varchar("open_time", { length: 5 }), // HH:MM format
  closeTime: varchar("close_time", { length: 5 }), // HH:MM format
  breakStartTime: varchar("break_start_time", { length: 5 }),
  breakEndTime: varchar("break_end_time", { length: 5 }),
});

// Time slots table
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id, { onDelete: "cascade" }).notNull(),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).default("pending"),
  paymentId: varchar("payment_id"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  moodRating: varchar("mood_rating", { enum: ["very_happy", "happy", "neutral", "sad", "very_sad"] }), // emoji mood rating
  comment: text("comment"),
  photos: text("photos").array(), // Array of photo URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  photoUrl: varchar("photo_url"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salon gallery table for work showcase images
export const salonGallery = pgTable("salon_gallery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  imageUrl: varchar("image_url").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 100 }), // e.g., "work", "staff", "interior"
  order: integer("order").default(0), // for ordering images
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform statistics table
export const platformStats = pgTable("platform_stats", {
  id: varchar("id").primaryKey().default("stats"),
  totalCustomers: integer("total_customers").default(0),
  totalSalons: integer("total_salons").default(0),
  totalBookings: integer("total_bookings").default(0),
  totalServices: integer("total_services").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Password reset OTP table
export const passwordResetOtps = pgTable("password_reset_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email").notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification settings table
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  bookingConfirmation: boolean("booking_confirmation").default(true),
  bookingReminder: boolean("booking_reminder").default(true),
  dayBeforeReminder: boolean("day_before_reminder").default(true),
  hourBeforeReminder: boolean("hour_before_reminder").default(true),
  promotionalNotifications: boolean("promotional_notifications").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  webPushNotifications: boolean("web_push_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push subscriptions table for web push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification history table
export const notificationHistory = pgTable("notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { 
    enum: ["booking_confirmation", "booking_reminder", "day_before_reminder", "hour_before_reminder", "promotional"] 
  }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  channel: varchar("channel", { enum: ["web_push", "email", "sms"] }).notNull(),
  status: varchar("status", { enum: ["sent", "delivered", "failed", "pending"] }).default("pending"),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
});

// Salon Owner Account Details for money transfers
export const salonOwnerAccounts = pgTable("salon_owner_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull().unique(),
  bankName: varchar("bank_name").notNull(),
  accountHolderName: varchar("account_holder_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  ifscCode: varchar("ifsc_code").notNull(),
  branch: varchar("branch"),
  upiId: varchar("upi_id"),
  isVerified: boolean("is_verified").default(false),
  // Enhanced verification fields
  verificationStatus: varchar("verification_status", { enum: ["pending", "verified", "failed"] }).default("pending"),
  verificationMessage: text("verification_message"),
  verifiedAccountHolderName: varchar("verified_account_holder_name"), // Name from bank records
  verifiedAt: timestamp("verified_at"),
  verificationAttempts: integer("verification_attempts").default(0),
  lastVerificationAttempt: timestamp("last_verification_attempt"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue tracking for each booking
export const revenueShares = pgTable("revenue_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  confirmationAmount: decimal("confirmation_amount", { precision: 10, scale: 2 }).notNull(),
  platformShare: decimal("platform_share", { precision: 10, scale: 2 }).notNull(), // 45%
  salonShare: decimal("salon_share", { precision: 10, scale: 2 }).notNull(), // 55%
  transferStatus: varchar("transfer_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  transferDate: timestamp("transfer_date"),
  transferReference: varchar("transfer_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallets table for customer credits/referrals
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet transactions table
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { enum: ["credit", "debit"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: varchar("reference_id"), // booking_id, referral_id, etc.
  referenceType: varchar("reference_type", { enum: ["booking", "referral", "admin"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  referredId: varchar("referred_id").references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 10 }).notNull().unique(),
  referralType: varchar("referral_type", { enum: ["customer_to_shopkeeper", "customer_to_customer", "shopkeeper_milestone"] }).default("customer_to_customer"),
  status: varchar("status", { enum: ["pending", "completed", "expired"] }).default("pending"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default("50"), // ₹50 default
  isRewardClaimed: boolean("is_reward_claimed").default(false),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // Track which booking completed the referral
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Customer referral campaigns table - For tracking 10-customer milestones
export const customerReferralCampaigns = pgTable("customer_referral_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignType: varchar("campaign_type").notNull().default("10_customer_free_booking"),
  targetCount: integer("target_count").notNull().default(10),
  currentCount: integer("current_count").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedReferralIds: text("completed_referral_ids").array().default([]),
  freeBookingCredits: integer("free_booking_credits").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Free booking credits table
export const freeBookingCredits = pgTable("free_booking_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditType: varchar("credit_type", { enum: ["shopkeeper_referral", "customer_milestone"] }).notNull(),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }).notNull(), // Maximum service price covered
  isUsed: boolean("is_used").notNull().default(false),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  referenceId: varchar("reference_id").notNull(), // ID of referral or campaign
  description: text("description").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Referral milestones table for tracking special rewards (like 5-customer milestone)
export const referralMilestones = pgTable("referral_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  milestoneType: varchar("milestone_type", { enum: ["5_customer_full_fee"] }).notNull(),
  targetCount: integer("target_count").notNull(), // e.g., 5 for 5-customer milestone
  currentCount: integer("current_count").default(0),
  isCompleted: boolean("is_completed").default(false),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull(), // Total confirmation fees from 5 bookings
  completedBookingIds: text("completed_booking_ids").array().default([]), // Track which bookings contributed
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salon likes table for customers to like/save salons
export const salonLikes = pgTable("salon_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  isLiked: boolean("is_liked").default(true), // For future unlike functionality
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure one like per customer per salon
  index("unique_customer_salon_like").on(table.customerId, table.salonId)
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedSalons: many(salons, { relationName: "salon_owner" }),
  bookings: many(bookings, { relationName: "customer_bookings" }),
  reviews: many(reviews, { relationName: "customer_reviews" }),
  wallet: one(wallets),
  likedSalons: many(salonLikes),
}));

export const salonsRelations = relations(salons, ({ one, many }) => ({
  owner: one(users, {
    fields: [salons.ownerId],
    references: [users.id],
    relationName: "salon_owner",
  }),
  services: many(services),
  staff: many(staff),
  workingHours: many(workingHours),
  timeSlots: many(timeSlots),
  bookings: many(bookings),
  reviews: many(reviews),
  gallery: many(salonGallery),
  account: one(salonOwnerAccounts),
  likes: many(salonLikes),
}));

export const salonOwnerAccountsRelations = relations(salonOwnerAccounts, ({ one }) => ({
  salon: one(salons, {
    fields: [salonOwnerAccounts.salonId],
    references: [salons.id],
  }),
}));

export const revenueSharesRelations = relations(revenueShares, ({ one }) => ({
  booking: one(bookings, {
    fields: [revenueShares.bookingId],
    references: [bookings.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  salon: one(salons, {
    fields: [services.salonId],
    references: [salons.id],
  }),
  bookings: many(bookings),
}));

export const workingHoursRelations = relations(workingHours, ({ one }) => ({
  salon: one(salons, {
    fields: [workingHours.salonId],
    references: [salons.id],
  }),
}));

export const timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
  salon: one(salons, {
    fields: [timeSlots.salonId],
    references: [salons.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: "customer_bookings",
  }),
  salon: one(salons, {
    fields: [bookings.salonId],
    references: [salons.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
    relationName: "customer_reviews",
  }),
  salon: one(salons, {
    fields: [reviews.salonId],
    references: [salons.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  salon: one(salons, {
    fields: [staff.salonId],
    references: [salons.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  customer: one(users, {
    fields: [wallets.customerId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "user_referrals_given",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "user_referrals_received",
  }),
  booking: one(bookings, {
    fields: [referrals.bookingId],
    references: [bookings.id],
  }),
}));

export const referralMilestonesRelations = relations(referralMilestones, ({ one }) => ({
  referrer: one(users, {
    fields: [referralMilestones.referrerId],
    references: [users.id],
  }),
}));

export const salonGalleryRelations = relations(salonGallery, ({ one }) => ({
  salon: one(salons, {
    fields: [salonGallery.salonId],
    references: [salons.id],
  }),
}));

export const salonLikesRelations = relations(salonLikes, ({ one }) => ({
  customer: one(users, {
    fields: [salonLikes.customerId],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [salonLikes.salonId],
    references: [salons.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  userType: true,
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkingHoursSchema = createInsertSchema(workingHours).omit({
  id: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertReferralMilestoneSchema = createInsertSchema(referralMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertSalonGallerySchema = createInsertSchema(salonGallery).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerReferralCampaignSchema = createInsertSchema(customerReferralCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertFreeBookingCreditSchema = createInsertSchema(freeBookingCredits).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertSalonLikeSchema = createInsertSchema(salonLikes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetOtpSchema = createInsertSchema(passwordResetOtps).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Salon = typeof salons.$inferSelect;
export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type WorkingHours = typeof workingHours.$inferSelect;
export type InsertWorkingHours = z.infer<typeof insertWorkingHoursSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type PlatformStats = typeof platformStats.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type ReferralMilestone = typeof referralMilestones.$inferSelect;
export type InsertReferralMilestone = z.infer<typeof insertReferralMilestoneSchema>;
export type CustomerReferralCampaign = typeof customerReferralCampaigns.$inferSelect;
export type InsertCustomerReferralCampaign = z.infer<typeof insertCustomerReferralCampaignSchema>;
export type FreeBookingCredit = typeof freeBookingCredits.$inferSelect;
export type SalonLike = typeof salonLikes.$inferSelect;
export type InsertSalonLike = z.infer<typeof insertSalonLikeSchema>;
export type InsertFreeBookingCredit = z.infer<typeof insertFreeBookingCreditSchema>;
export type SalonOwnerAccount = typeof salonOwnerAccounts.$inferSelect;
export type InsertSalonOwnerAccount = typeof salonOwnerAccounts.$inferInsert;
export type RevenueShare = typeof revenueShares.$inferSelect;
export type SalonGallery = typeof salonGallery.$inferSelect;
export type InsertSalonGallery = z.infer<typeof insertSalonGallerySchema>;
export type PasswordResetOtp = typeof passwordResetOtps.$inferSelect;
export type InsertPasswordResetOtp = z.infer<typeof insertPasswordResetOtpSchema>;

// Mood rating utility types and functions
export type MoodRating = "very_happy" | "happy" | "neutral" | "sad" | "very_sad";

export const MOOD_EMOJIS: Record<MoodRating, { emoji: string; label: string; color: string }> = {
  very_happy: { emoji: "😍", label: "Absolutely Amazing", color: "text-green-600" },
  happy: { emoji: "😊", label: "Really Good", color: "text-green-500" },
  neutral: { emoji: "😐", label: "It's Okay", color: "text-yellow-500" },
  sad: { emoji: "😔", label: "Not Great", color: "text-orange-500" },
  very_sad: { emoji: "😞", label: "Very Disappointed", color: "text-red-500" }
};

export function getMoodFromRating(rating: number): MoodRating {
  if (rating >= 5) return "very_happy";
  if (rating >= 4) return "happy"; 
  if (rating >= 3) return "neutral";
  if (rating >= 2) return "sad";
  return "very_sad";
}

export function getRatingFromMood(mood: MoodRating): number {
  const moodToRating: Record<MoodRating, number> = {
    very_happy: 5,
    happy: 4,
    neutral: 3,
    sad: 2,
    very_sad: 1
  };
  return moodToRating[mood];
}

// Verification Documents table for shopkeeper document uploads
export const verificationDocuments = pgTable("verification_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }).notNull(),
  documentType: varchar("document_type", { enum: ["business_license", "id_proof", "address_proof", "other"] }).notNull(),
  documentUrl: varchar("document_url").notNull(),
  documentName: varchar("document_name"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Admin Activity Logs table for tracking admin actions
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // approve_salon, reject_salon, block_user, etc.
  targetType: varchar("target_type", { enum: ["salon", "user", "booking", "review", "content"] }),
  targetId: varchar("target_id"),
  details: text("details"), // JSON string with action details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Moderation table for flagged content
export const contentModerations = pgTable("content_moderations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: varchar("content_type", { enum: ["review", "salon_image", "service", "user_profile"] }).notNull(),
  contentId: varchar("content_id").notNull(),
  reportedBy: varchar("reported_by").references(() => users.id),
  reason: varchar("reason", { enum: ["inappropriate", "spam", "fake", "offensive", "other"] }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["pending", "approved", "removed", "resolved"] }).default("pending"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform Analytics table for tracking key metrics
export const platformAnalytics = pgTable("platform_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  totalCustomers: integer("total_customers").default(0),
  totalSalons: integer("total_salons").default(0),
  totalBookings: integer("total_bookings").default(0),
  totalRevenue: integer("total_revenue").default(0), // in paise
  newCustomers: integer("new_customers").default(0),
  newSalons: integer("new_salons").default(0),
  newBookings: integer("new_bookings").default(0),
  dailyRevenue: integer("daily_revenue").default(0), // in paise
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_platform_analytics_date").on(table.date)
]);

// Zod schemas for new admin tables
export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments);
export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs);
export const insertContentModerationSchema = createInsertSchema(contentModerations);
export const insertPlatformAnalyticsSchema = createInsertSchema(platformAnalytics);

// Type exports for admin tables
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;
export type VerificationDocument = typeof verificationDocuments.$inferSelect;

export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;

export type InsertContentModeration = z.infer<typeof insertContentModerationSchema>;
export type ContentModeration = typeof contentModerations.$inferSelect;

export type InsertPlatformAnalytics = z.infer<typeof insertPlatformAnalyticsSchema>;
export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;