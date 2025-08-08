import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { storage } from "./storage";
import type { Express } from "express";

export function setupSocialAuth(app: Express) {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by email
        const existingUser = profile.emails?.[0]?.value ? 
          await storage.getUserByEmail(profile.emails[0].value) : null;
        
        if (existingUser) {
          // User exists, log them in
          return done(null, existingUser);
        }
        
        // Create new user with customer as default type
        const newUser = await storage.createUser({
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
          lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
          userType: 'customer' as "customer" | "salon_owner",
          password: null, // Social auth users don't need password
          profileImageUrl: profile.photos?.[0]?.value || null,
          isSocialAuth: true,
          socialProvider: 'google',
          socialId: profile.id
        });
        
        return done(null, newUser);
      } catch (error) {
        console.error('Google auth error:', error);
        return done(error, undefined);
      }
    }));
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'photos', 'email', 'name']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by email
        const existingUser = profile.emails?.[0]?.value ? 
          await storage.getUserByEmail(profile.emails[0].value) : null;
        
        if (existingUser) {
          // User exists, log them in
          return done(null, existingUser);
        }
        
        // Create new user with customer as default type
        const newUser = await storage.createUser({
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
          lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
          userType: 'customer' as "customer" | "salon_owner",
          password: null, // Social auth users don't need password
          profileImageUrl: profile.photos?.[0]?.value || null,
          isSocialAuth: true,
          socialProvider: 'facebook',
          socialId: profile.id
        });
        
        return done(null, newUser);
      } catch (error) {
        console.error('Facebook auth error:', error);
        return done(error, undefined);
      }
    }));
  }

  // Social auth routes
  app.get('/api/auth/google', (req, res, next) => {
    // Store user type in session for callback
    const { userType } = req.query;
    if (userType) {
      (req.session as any).pendingUserType = userType;
    }
    
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state: JSON.stringify({ userType })
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );

  app.get('/api/auth/facebook', (req, res, next) => {
    // Store user type in session for callback
    const { userType } = req.query;
    if (userType) {
      (req.session as any).pendingUserType = userType;
    }
    
    passport.authenticate('facebook', { 
      scope: ['email', 'public_profile'] 
    })(req, res, next);
  });

  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth?error=facebook_auth_failed' }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );
}