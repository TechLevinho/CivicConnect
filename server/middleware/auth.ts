import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase";

export interface FirebaseUser {
  uid: string;
  email: string;
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
    
    // Log the request for debugging
    console.log(`Auth request to ${req.path}:`, {
      headers: req.headers.authorization ? 'Has Authorization' : 'No Authorization',
      cookies: req.cookies,
      method: req.method,
      isDev
    });

    // Check for token in Authorization header
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    }
    
    // If no token in header, check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      // For development, allow requests without token
      if (isDev) {
        console.log("DEV MODE: Allowing request without token");
        req.firebaseUser = {
          uid: "dev-user-id",
          email: "dev@example.com",
          isOrganization: false
        };
        return next();
      }
      
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      isOrganization: decodedToken.isOrganization || false,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    
    // For development, allow requests even if token verification fails
    if (process.env.NODE_ENV === 'development') {
      console.log("DEV MODE: Allowing request despite auth error");
      req.firebaseUser = {
        uid: "dev-user-id",
        email: "dev@example.com",
        isOrganization: false
      };
      return next();
    }
    
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
} 