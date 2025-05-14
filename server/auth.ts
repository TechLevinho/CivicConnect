import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { DatabaseStorage } from "./db/storage";
import { User as DatabaseUser } from "./db/types";

// Extended user type for authentication
interface AuthUser extends DatabaseUser {
  password: string;
  username: string;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);
const storage = new DatabaseStorage();

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
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Use a default secret for development if SESSION_SECRET is not defined
  const sessionSecret = process.env.SESSION_SECRET || 'civicconnect-dev-secret-key-12345';
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  try {
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log("Session and Passport middleware initialized successfully");
  } catch (error) {
    console.error("Error initializing session middleware:", error);
    if (isDev) {
      console.warn("Continuing without session support in development mode");
    } else {
      throw error;
    }
  }

  passport.use(
    new LocalStrategy(async (username: string, password: string, done: any) => {
      try {
        const user = await storage.getUserByUsername(username) as AuthUser;
        if (!user) {
          console.log(`Login failed: User ${username} not found`);
          return done(null, false);
        }
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          console.log(`Login failed: Invalid password for user ${username}`);
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done: any) => done(null, user.id));
  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      console.log('Registration attempt for username:', req.body.username);
      
      // Validate required fields
      if (!req.body.username || !req.body.password || !req.body.email) {
        console.log('Registration failed: Missing required fields');
        return res.status(400).json({ 
          message: "Username, password, and email are required" 
        });
      }

      // Validate password strength
      if (req.body.password.length < 6) {
        console.log('Registration failed: Password too short');
        return res.status(400).json({ 
          message: "Password must be at least 6 characters long" 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        console.log('Registration failed: Invalid email format');
        return res.status(400).json({ 
          message: "Invalid email format" 
        });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Registration failed: Username already exists:', req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        name: req.body.name || req.body.username,
        uid: req.body.uid || '', // Use provided uid or empty string
        isOrganization: req.body.isOrganization || false,
      }) as AuthUser;

      console.log('User registered successfully:', user.name);
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error('Login after registration failed:', err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = (req as any).user;
    
    // Enhanced logging for user login
    console.log("User logged in:", {
      id: user.id,
      username: user.username,
      role: user.role,
      isOrganization: user.isOrganization
    });
    
    // Always check both the role and isOrganization fields
    const isOrg = user.isOrganization === true || user.role === "organization";
    const redirectPath = isOrg ? "/organization/dashboard" : "/user/dashboard";
    
    console.log(`User will be redirected to: ${redirectPath} (isOrganization: ${isOrg})`);
    
    res.status(200).json({
      ...user,
      isOrganization: isOrg, // Ensure this field is always set correctly
      role: user.role || (isOrg ? "organization" : "user"), // Ensure role is always set
      redirectPath // Include redirect path in the response
    });
  });

  app.post("/api/auth/logout", (req, res, next) => {
    try {
      // Handle traditional session logout if available
      if ((req as any).logout) {
        (req as any).logout((err: any) => {
          if (err) {
            console.error("Session logout error:", err);
            // Continue anyway - we'll handle Firebase logout too
          }
        });
      }
      
      // For Firebase, we just clear any session cookies from the server
      // The actual token invalidation happens on the client
      res.clearCookie('token');
      
      // Return success regardless - the client needs to clear local storage too
      res.status(200).json({ 
        message: "Logout successful", 
        success: true 
      });
    } catch (error) {
      console.error("Error in logout endpoint:", error);
      // Even if there's an error, return success to client
      // The client side still needs to clear tokens
      res.status(200).json({ 
        message: "Partial logout - client should clear tokens", 
        success: true 
      });
    }
  });

  // Session-based /api/auth/me endpoint - used when Firebase auth is not available
  app.get("/api/auth/session", (req, res) => {
    try {
      // Check if the session exists and user is authenticated
      if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
        console.log("Auth/session endpoint: User not authenticated");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Safely access user data
      const userData = (req as any).user;
      if (!userData) {
        console.error("Auth/session endpoint: User authenticated but no user data in session");
        return res.status(500).json({ message: "User session data missing" });
      }
      
      // Return the user data
      res.json(userData);
    } catch (error) {
      // Log the full error details
      console.error("Error in /api/auth/session endpoint:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      
      // Return a generic error to the client
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
