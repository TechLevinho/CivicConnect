import { Request, Response, NextFunction } from "express";
import { auth, db } from "../firebase";

export interface FirebaseUser {
  uid: string;
  email: string;
  role: string;
  isOrganization?: boolean;
}

export interface AuthRequest extends Request {
  firebaseUser?: FirebaseUser;
}

export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // For development, add a bypass option
    const isDev = process.env.NODE_ENV === 'development';
    
    // Log incoming request details
    console.log(`${req.method} ${req.path} {
  body: ${JSON.stringify(req.body || {})},
  query: ${JSON.stringify(req.query || {})},
  cookies: ${JSON.stringify(req.cookies || {})},
  headers: { contentType: ${req.headers['content-type']}, authorization: ${req.headers.authorization ? '"Bearer [token]"' : '"None"'} }
}`);

    // Check for token in Authorization header
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
      console.log("Found token in Authorization header, length:", token ? token.length : 0);
    }
    
    // If no token in header, check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
      console.log("Found token in cookies, length:", token ? token.length : 0);
    }
    
    if (!token) {
      // For development, allow requests without token
      if (isDev) {
        console.log("DEV MODE: Allowing request without token");
        req.firebaseUser = {
          uid: "dev-user-id",
          email: "dev@example.com",
          role: "user",
          isOrganization: false
        };
        return next();
      }
      
      console.log("No token provided, returning 401 Unauthorized");
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // Verify the token
    try {
      console.log("Verifying token...");
      const decodedToken = await auth.verifyIdToken(token);
      console.log("Token verified successfully");
      console.log("Decoded token:", JSON.stringify(decodedToken, null, 2));
      
      // Get custom claims with role information
      const userId = decodedToken.uid;
      
      // Use custom claims to determine role
      const role = decodedToken.role || "user";
      
      // Check for isOrganization in claims
      const isOrganization = decodedToken.isOrganization === true || role === "organization";
      
      console.log("User authenticated:", { 
        uid: userId, 
        email: decodedToken.email, 
        role,
        isOrganization 
      });
      
      // Set user data based on role
      req.firebaseUser = {
        uid: userId,
        email: decodedToken.email || "",
        role: role,
        isOrganization
      };
      
      return next();
    } catch (verifyError) {
      console.error("Error verifying token:", verifyError);
      
      // For development, still proceed even with invalid token
      if (isDev) {
        console.log("DEV MODE: Allowing request despite invalid token");
        req.firebaseUser = {
          uid: "dev-user-id",
          email: "dev@example.com",
          role: "user",
          isOrganization: false
        };
        return next();
      }
      
      return res.status(401).json({ 
        error: "Unauthorized - Invalid token",
        details: isDev ? (verifyError as Error).message : undefined
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    
    // For development, allow requests even if token verification fails
    if (process.env.NODE_ENV === 'development') {
      console.log("DEV MODE: Allowing request despite auth error");
      req.firebaseUser = {
        uid: "dev-user-id",
        email: "dev@example.com",
        role: "user",
        isOrganization: false
      };
      return next();
    }
    
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
} 