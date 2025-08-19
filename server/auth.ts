import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, referrals, customerReferralCampaigns, freeBookingCredits } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

import { sendWelcomeEmail } from "./welcomeEmail";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Process referral rewards based on type and rules
async function processReferralRewards(referralRecord: any, newUser: any) {
  const referrerId = referralRecord.referrerId;
  
  try {
    if (referralRecord.referralType === "customer_to_shopkeeper") {
      // Immediate reward for shopkeeper referrals
      if (newUser.userType === "salon_owner") {
        // Create free booking credit for referrer
        await db.insert(freeBookingCredits).values({
          id: `credit_${Date.now()}_${referrerId}`,
          customerId: referrerId,
          creditType: "shopkeeper_referral",
          maxAmount: "100", // Free booking up to ₹100
          isUsed: false,
          referenceId: referralRecord.id,
          description: "Free booking for referring a salon owner",
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        });

        // Update referral status
        await db.update(referrals).set({
          status: "completed",
          completedAt: new Date(),
        }).where(eq(referrals.id, referralRecord.id));

        console.log(`🎉 Shopkeeper referral reward: ₹100 free booking credit for user ${referrerId}`);
      }
    } else if (referralRecord.referralType === "customer_to_customer") {
      // Track progress for customer milestone rewards
      if (newUser.userType === "customer") {
        // Get or create referral campaign
        const [existingCampaign] = await db.select()
          .from(customerReferralCampaigns)
          .where(eq(customerReferralCampaigns.referrerId, referrerId));

        if (existingCampaign) {
          // Update existing campaign count
          const newCount = existingCampaign.currentCount + 1;
          const isCompleted = newCount >= existingCampaign.targetCount;

          await db.update(customerReferralCampaigns).set({
            currentCount: newCount,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            updatedAt: new Date(),
          }).where(eq(customerReferralCampaigns.id, existingCampaign.id));

          // Award milestone reward if completed
          if (isCompleted) {
            await db.insert(freeBookingCredits).values({
              id: `milestone_${Date.now()}_${referrerId}`,
              customerId: referrerId,
              creditType: "customer_milestone",
              maxAmount: "150", // Free booking up to ₹150 for milestone
              isUsed: false,
              referenceId: existingCampaign.id,
              description: "Free booking for 10-customer milestone",
              expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
            });

            console.log(`🎉 Milestone reward: ₹150 free booking credit for user ${referrerId} (10 customers completed)`);
          } else {
            console.log(`📈 Customer referral progress: ${newCount}/10 for user ${referrerId}`);
          }
        } else {
          // Create new campaign
          await db.insert(customerReferralCampaigns).values({
            id: `campaign_${Date.now()}_${referrerId}`,
            referrerId,
            campaignType: "10_customer_milestone",
            targetCount: 10,
            currentCount: 1,
            isCompleted: false,
            freeBookingCredits: 1,
            creditsUsed: 0,
          });

          console.log(`📈 New customer referral campaign started for user ${referrerId} (1/10)`);
        }

        // Update referral status to completed
        await db.update(referrals).set({
          status: "completed",
          completedAt: new Date(),
        }).where(eq(referrals.id, referralRecord.id));
      }
    }
  } catch (error) {
    console.error("Error processing referral rewards:", error);
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: false, // Table already exists
    ttl: 7 * 24 * 60 * 60, // 7 days
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password!))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Social authentication removed - using email/password only

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phone, userType, referralCode } = req.body;

      // Validate input
      if (!email || !password || !firstName || !phone || !userType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["customer", "salon_owner", "brand_owner"].includes(userType)) {
        return res.status(400).json({ error: "Invalid user type" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Validate referral code if provided
      let referralRecord: any = null;
      if (referralCode) {
        referralRecord = await storage.getReferralByCode(referralCode);
        if (!referralRecord) {
          return res.status(400).json({ error: "Invalid referral code" });
        }
        if (referralRecord.status !== "pending") {
          return res.status(400).json({ error: "Referral code has already been used" });
        }
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        userType,
        profileImageUrl: null,
      });

      // Handle referral logic after user creation
      if (referralRecord) {
        // Update the existing referral with the new user
        await db.update(referrals).set({
          referredId: user.id,
        }).where(eq(referrals.id, referralRecord.id));

        // Process referral rewards based on type
        await processReferralRewards(referralRecord, user);
        console.log(`✅ Referral processed: ${referralRecord.referralType} for user ${user.firstName}`);
      }

      // Send welcome email (async, don't block registration)
      sendWelcomeEmail(user.email, user.firstName, user.userType as 'customer' | 'salon_owner' | 'brand_owner')
        .then(success => {
          if (success) {
            console.log(`Welcome email sent successfully to ${user.email}`);
          } else {
            console.log(`Welcome email failed for ${user.email}`);
          }
        })
        .catch(error => console.error('Failed to send welcome email:', error));

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          profileImageUrl: user.profileImageUrl,
          referralUsed: !!referralRecord,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          profileImageUrl: user.profileImageUrl,
        });
      });
    })(req, res, next);
  });

  // Logout routes (support both GET and POST)
  const logoutHandler = (req: any, res: any, next: any) => {
    console.log("Logout attempt for user:", req.user?.id);
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return next(err);
        }
        res.clearCookie('connect.sid', { path: '/' });
        console.log("User logged out successfully");
        
        // For GET requests, redirect to home
        if (req.method === 'GET') {
          res.redirect('/');
        } else {
          // For POST requests, send JSON response
          res.sendStatus(200);
        }
      });
    });
  };

  app.post("/api/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);

  // GET /api/login - redirect to auth page
  app.get("/api/login", (req, res) => {
    res.redirect('/auth');
  });

  // Get current user route
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const user = req.user!;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      profileImageUrl: user.profileImageUrl,
    });
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};