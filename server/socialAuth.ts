import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { storage } from "./storage";
import type { Express } from "express";

export function setupSocialAuth(app: Express) {
  console.log('🔧 Setting up social auth...');
  console.log('🔧 Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('🔧 Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
  
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Registering Google OAuth strategy');
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.NODE_ENV === 'production' ? 'https://sanwarhub.in' : 'http://localhost:5000'}/api/auth/google/callback`,
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
        
        // Store user data in session for role selection
        const userData = {
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
          lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          socialProvider: 'google',
          socialId: profile.id
        };
        
        // Check if user type was specified in the OAuth request
        // Note: req is not available here in passport strategy callback
        // We'll handle this logic in the route handlers
        
        // Always redirect to role selection for new users
        // Store user data in session for role selection
        // Return a temporary user object to complete OAuth flow
        return done(null, { 
          id: 'pending_google_user',
          needsRoleSelection: true,
          ...userData 
        });

        // Send welcome email (async, don't block login)
        import('./welcomeEmail').then(({ sendWelcomeEmail }) => {
          sendWelcomeEmail(newUser.email, newUser.firstName, newUser.userType as 'customer' | 'salon_owner' | 'brand_owner')
            .catch(error => console.error('Failed to send welcome email (Google OAuth):', error));
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

        // Send welcome email (async, don't block login)
        import('./welcomeEmail').then(({ sendWelcomeEmail }) => {
          sendWelcomeEmail(newUser.email, newUser.firstName, newUser.userType as 'customer' | 'salon_owner' | 'brand_owner')
            .catch(error => console.error('Failed to send welcome email (Facebook OAuth):', error));
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
    console.log('🔧 Google OAuth route hit');
    // Store user type in session for callback
    const { userType } = req.query;
    if (userType) {
      (req.session as any).pendingUserType = userType;
      console.log('🔧 Storing user type in session:', userType);
    }
    
    console.log('🔧 Initiating Google OAuth with scopes: profile, email');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state: JSON.stringify({ userType: userType || null }),
      accessType: 'offline'
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
    (req, res) => {
      const user = req.user as any;
      
      if (user && user.needsRoleSelection) {
        // Store user data in session for role selection
        (req.session as any).pendingGoogleUser = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          socialProvider: user.socialProvider,
          socialId: user.socialId
        };
        
        // Redirect to role selection page
        res.redirect('/auth/role-selection?provider=google');
      } else {
        // Successful authentication, redirect to home
        res.redirect('/');
      }
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
      const user = req.user as any;
      
      if (user && user.needsRoleSelection) {
        // Redirect to role selection page
        res.redirect('/auth/role-selection?provider=facebook');
      } else {
        // Successful authentication, redirect to home
        res.redirect('/');
      }
    }
  );

  // Complete social registration with role selection
  app.post("/api/auth/complete-social-registration", async (req: any, res) => {
    try {
      const { userType, provider } = req.body;
      
      if (!userType || !['customer', 'salon_owner', 'brand_owner'].includes(userType)) {
        return res.status(400).json({ message: "Valid user type is required" });
      }

      const sessionData = req.session as any;
      const pendingUserData = sessionData[`pending${provider.charAt(0).toUpperCase() + provider.slice(1)}User`];
      
      if (!pendingUserData) {
        return res.status(400).json({ message: "No pending social registration found" });
      }

      // Create the user with selected role
      const newUser = await storage.createUser({
        ...pendingUserData,
        userType: userType as "customer" | "salon_owner" | "brand_owner",
        password: null,
        isSocialAuth: true,
      });

      // Clear pending user data
      delete sessionData[`pending${provider.charAt(0).toUpperCase() + provider.slice(1)}User`];
      
      // Log in the user
      req.login(newUser, (err: any) => {
        if (err) {
          console.error('Login error after social registration:', err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }

        // Send welcome email (async)
        import('./welcomeEmail').then(({ sendWelcomeEmail }) => {
          sendWelcomeEmail(newUser.email, newUser.firstName, newUser.userType as 'customer' | 'salon_owner' | 'brand_owner')
            .catch(error => console.error('Failed to send welcome email:', error));
        });

        res.json({ 
          message: "Registration completed successfully",
          user: newUser 
        });
      });
    } catch (error) {
      console.error("Error completing social registration:", error);
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });
}