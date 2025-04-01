import express from "express";
import { db as firestore } from "./firebase";
import { verifyToken, AuthRequest } from "./middleware/auth";
import admin from "firebase-admin";
import { DatabaseStorage } from "./db/storage";

// Initialize Storage
const storage = new DatabaseStorage();

// Define predefined organizations grouped by issue type
const ORGANIZATIONS = [
  {
    id: 'bmc-drainage',
    name: 'BMC Stormwater Drain Department',
    description: 'Handles drainage systems and waterlogging issues in Mumbai',
    issueTypes: ['waterlogging']
  },
  {
    id: 'pwd',
    name: 'Public Works Department (PWD)',
    description: 'Responsible for construction and maintenance of public infrastructure',
    issueTypes: ['waterlogging', 'roads']
  },
  {
    id: 'mjp',
    name: 'Maharashtra Jeevan Pradhikaran (MJP)',
    description: 'Water supply and sanitation in Maharashtra',
    issueTypes: ['waterlogging', 'water_supply']
  },
  {
    id: 'mmrda',
    name: 'Mumbai Metropolitan Region Development Authority (MMRDA)',
    description: 'Infrastructure development in Mumbai Metropolitan Region',
    issueTypes: ['roads']
  },
  {
    id: 'bmc-waste',
    name: 'BMC Solid Waste Management Department',
    description: 'Waste collection and disposal in Mumbai',
    issueTypes: ['garbage']
  },
  {
    id: 'mpcb',
    name: 'Maharashtra Pollution Control Board (MPCB)',
    description: 'Monitoring and control of pollution in Maharashtra',
    issueTypes: ['garbage']
  },
  {
    id: 'sba',
    name: 'Swachh Bharat Abhiyan (SBA) Local Ward Office',
    description: 'Cleanliness mission at local level',
    issueTypes: ['garbage', 'public_places']
  },
  {
    id: 'muni-waste',
    name: 'Municipal Corporation Waste Management Division',
    description: 'Local waste management services',
    issueTypes: ['garbage']
  },
  {
    id: 'muni-roads',
    name: 'Municipal Road Maintenance Department',
    description: 'Road repair and maintenance at local level',
    issueTypes: ['roads']
  },
  {
    id: 'bmc-garden',
    name: 'BMC - Garden & Recreation Department',
    description: 'Maintenance of public parks and gardens',
    issueTypes: ['public_places']
  },
  {
    id: 'muda',
    name: 'Mumbai Urban Development Authority (MUDA)',
    description: 'Urban planning and development in Mumbai',
    issueTypes: ['public_places']
  },
  {
    id: 'suda',
    name: 'State Urban Development Authority (SUDA)',
    description: 'Urban planning at state level',
    issueTypes: ['public_places']
  },
  {
    id: 'muni-parks',
    name: 'Municipal Park Maintenance Division',
    description: 'Maintenance of local parks and recreational areas',
    issueTypes: ['public_places']
  },
  {
    id: 'mseb',
    name: 'Maharashtra State Electricity Board (MSEB)',
    description: 'Electricity supply and infrastructure in Maharashtra',
    issueTypes: ['streetlights']
  },
  {
    id: 'tata-power',
    name: 'Tata Power',
    description: 'Private electricity distribution company',
    issueTypes: ['streetlights']
  },
  {
    id: 'adani-electricity',
    name: 'Adani Electricity Mumbai',
    description: 'Private electricity distribution company',
    issueTypes: ['streetlights']
  },
  {
    id: 'local-electricity',
    name: 'Local Municipal Electricity Department',
    description: 'Municipal electricity distribution and maintenance',
    issueTypes: ['streetlights']
  },
  {
    id: 'bmc-water',
    name: 'BMC Water Supply Department',
    description: 'Water supply and distribution in Mumbai',
    issueTypes: ['water_supply']
  },
  {
    id: 'water-management',
    name: 'City Water Management Authorities',
    description: 'Local water supply and management',
    issueTypes: ['water_supply']
  }
];

export const registerRoutes = (app: express.Application) => {
  app.use(express.json());

  // Root route for health check
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "CivicConnect API is running",
      version: "1.0.0",
      endpoints: ["/api/health", "/api/auth/login", "/api/issues"]
    });
  });
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Test route that doesn't require authentication
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
  });

  // Organization routes
  app.get("/api/organizations", (req, res) => {
    try {
      res.json(ORGANIZATIONS);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:issueType", (req, res) => {
    try {
      const { issueType } = req.params;
      const filteredOrgs = ORGANIZATIONS.filter(org => 
        org.issueTypes.includes(issueType)
      );
      res.json(filteredOrgs);
    } catch (error) {
      console.error("Error fetching organizations by issue type:", error);
      res.status(500).json({ error: "Failed to fetch organizations by issue type" });
    }
  });

  // User routes
  app.post("/api/users", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { email, isOrganization, organizationName } = req.body;
      const { uid } = req.firebaseUser!;

      // For organization users, validate that the organization name is in our predefined list
      if (isOrganization) {
        const organizationExists = ORGANIZATIONS.some(org => org.name === organizationName);
        if (!organizationExists) {
          return res.status(400).json({ error: "Invalid organization name. Please select from the predefined list." });
        }
      }

      const userData = {
        email,
        isOrganization,
        organizationName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await firestore.collection("users").doc(uid).set(userData);
      res.json({ id: uid, ...userData });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Add a new endpoint to check user status and get correct redirection
  app.get("/api/auth/me", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const uid = req.firebaseUser.uid;
      
      // Get the latest token claims
      const tokenResult = await admin.auth().getUser(uid);
      const customClaims = tokenResult.customClaims || {};
      
      // Also get the user document from Firestore for complete data
      const userDoc = await firestore.collection("users").doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userData = userDoc.data();
      
      res.json({
        uid,
        email: req.firebaseUser.email,
        isOrganization: customClaims.isOrganization || userData?.isOrganization || false,
        organizationName: customClaims.organizationName || userData?.organizationName || null,
        userType: (customClaims.isOrganization || userData?.isOrganization) ? 'organization' : 'user'
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Update the profile endpoint to properly set custom claims
  app.post("/api/auth/update-profile", async (req, res, next) => {
    try {
      console.log("Received update-profile request:", req.body);

      const { uid, email, isOrganization, organizationName } = req.body;

      if (!uid || !email) {
        console.log("Missing required fields:", { uid, email });
        return res.status(400).json({ message: "User ID and email are required" });
      }

      // For organization users, validate that the organization name is in our predefined list
      if (isOrganization) {
        if (!organizationName) {
          console.log("Missing organization name for organization user");
          return res.status(400).json({ message: "Organization name is required for organization users" });
        }

        const organizationExists = ORGANIZATIONS.some(org => org.name === organizationName);
        if (!organizationExists) {
          console.log("Invalid organization name:", organizationName);
          return res.status(400).json({ message: "Invalid organization name. Please select from the predefined list." });
        }
      }

      // Use Firestore directly
      const userRef = firestore.collection("users").doc(uid);

      // Check if user exists
      const userDoc = await userRef.get();
      const userData: {
        email: string;
        username: string;
        isOrganization: boolean;
        organizationName: string | null;
        updatedAt: Date;
        createdAt?: Date;
      } = {
        email,
        username: email.split('@')[0],
        isOrganization: isOrganization || false,
        organizationName: isOrganization ? organizationName : null,
        updatedAt: new Date()
      };

      if (!userDoc.exists) {
        console.log("User not found in Firestore, creating new user document");
        // If user doesn't exist, create them
        userData.createdAt = new Date();
      }

      // Set or update the user document
      await userRef.set(userData, { merge: true });
      
      // Always update the Firebase Auth custom claims to ensure they stay in sync
      console.log("Updating Firebase custom claims for user:", { uid, isOrganization });
      await admin.auth().setCustomUserClaims(uid, {
        isOrganization: Boolean(isOrganization),
        organizationName: isOrganization ? organizationName : null
      });
      
      // Force token refresh
      try {
        // Revoke refresh tokens to ensure new token with updated claims is issued on next sign-in
        await admin.auth().revokeRefreshTokens(uid);
        console.log("Refresh tokens revoked for user:", uid);
      } catch (tokenError) {
        console.error("Error revoking refresh tokens:", tokenError);
        // Continue anyway as the user document was updated successfully
      }

      res.status(200).json({
        message: "User profile updated successfully",
        isOrganization: Boolean(isOrganization),
        organizationName: isOrganization ? organizationName : null
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Issue routes
  app.get("/api/issues", verifyToken, async (req: AuthRequest, res) => {
    try {
      console.log("GET /api/issues request received:", {
        user: req.firebaseUser ? {
          uid: req.firebaseUser.uid,
          isOrganization: req.firebaseUser.isOrganization
        } : 'No user',
        headers: req.headers.authorization ? "Has auth header" : "No auth header"
      });

      // Configure Firestore query based on user role
      let query = firestore.collection("issues");
      
      // If the user is an organization member, they might have specific filtering
      // For now, we'll fetch all issues for any user
      
      console.log("Executing Firestore query...");
      const issuesSnapshot = await query.get();
      console.log(`Retrieved ${issuesSnapshot.docs.length} documents from Firestore`);
      
      // Map the data to ensure consistent structure with client expectations
      const issues = issuesSnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Convert any Firebase Timestamps to Date objects
        const createdAt = data.createdAt ? 
          (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : null;
        const updatedAt = data.updatedAt ? 
          (data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt) : null;
        
        // Convert string ID to number if needed (to match client-side typing)
        let id = doc.id;
        if (typeof id === 'string' && !isNaN(Number(id))) {
          id = Number(id);
        }
        
        // Ensure that the issue status is one of the expected values
        const status = data.status || 'open';
        
        // Return structured issue data
        return {
          id,
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          status,
          priority: data.priority || 'medium',
          userId: data.userId || 0,
          organizationName: data.organizationName || null,
          createdAt,
          updatedAt
        };
      });

      console.log(`Returning ${issues.length} issues to client`);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      // Better error response
      res.status(500).json({ 
        error: "Failed to fetch issues", 
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/issues/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const issueDoc = await firestore.collection("issues").doc(req.params.id).get();
      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json({ id: issueDoc.id, ...issueDoc.data() });
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  app.post("/api/issues", verifyToken, async (req: AuthRequest, res) => {
    try {
      console.log("POST /api/issues received:", {
        body: req.body,
        user: req.firebaseUser,
        headers: req.headers.authorization ? "Has auth header" : "No auth header",
      });
      
      const { title, description, location, priority, issueType, organizationName, imageUrl } = req.body;
      
      // In development mode, use mock user ID if not provided
      const uid = req.firebaseUser?.uid || (process.env.NODE_ENV === 'development' ? 'dev-user-id' : undefined);
      
      if (!uid) {
        console.error("No user ID available");
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate required fields
      if (!title || !description || !location) {
        console.error("Missing required fields:", { title, description, location });
        return res.status(400).json({ error: "Title, description, and location are required" });
      }

      // Skip organization validation in development mode
      if (organizationName && process.env.NODE_ENV !== 'development') {
        const organization = ORGANIZATIONS.find(org => org.name === organizationName);
        if (!organization) {
          console.error("Invalid organization name:", organizationName);
          return res.status(400).json({ error: "Invalid organization name" });
        }
        
        if (issueType && !organization.issueTypes.includes(issueType)) {
          console.error("Organization doesn't handle issue type:", { organization: organizationName, issueType });
          return res.status(400).json({ 
            error: `The selected organization does not handle ${issueType} issues` 
          });
        }
      }

      // Create the base issue data object
      const issueData: any = {
        title,
        description,
        location,
        priority: priority || "medium",
        issueType,
        status: "open",
        userId: uid,
        organizationName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log("Prepared issue data:", issueData);

      // Add image URL if provided
      if (imageUrl) {
        issueData.imageUrl = imageUrl;
      }

      // Add the issue to Firestore
      try {
        const docRef = await firestore.collection("issues").add(issueData);
        console.log("Issue created with ID:", docRef.id);
        
        // Return the created issue data with ID
        res.status(201).json({ id: docRef.id, ...issueData });
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        throw firestoreError;
      }
    } catch (error) {
      console.error("Error creating issue:", error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  app.patch("/api/issues/:id/status", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      const issueRef = firestore.collection("issues").doc(req.params.id);
      const issueDoc = await issueRef.get();

      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }

      const issueData = issueDoc.data()!;
      if (issueData.userId !== req.firebaseUser!.uid && !req.firebaseUser!.isOrganization) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await issueRef.update({
        status,
        updatedAt: new Date()
      });

      res.json({ id: issueDoc.id, ...issueData, status });
    } catch (error) {
      console.error("Error updating issue status:", error);
      res.status(500).json({ error: "Failed to update issue status" });
    }
  });

  app.patch("/api/issues/:id/priority", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { priority } = req.body;
      const issueRef = firestore.collection("issues").doc(req.params.id);
      const issueDoc = await issueRef.get();

      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }

      const issueData = issueDoc.data()!;
      if (issueData.userId !== req.firebaseUser!.uid && !req.firebaseUser!.isOrganization) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await issueRef.update({
        priority,
        updatedAt: new Date()
      });

      res.json({ id: issueDoc.id, ...issueData, priority });
    } catch (error) {
      console.error("Error updating issue priority:", error);
      res.status(500).json({ error: "Failed to update issue priority" });
    }
  });

  app.patch("/api/issues/:id/assign", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { organizationName } = req.body;
      const issueRef = firestore.collection("issues").doc(req.params.id);
      const issueDoc = await issueRef.get();

      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }

      const issueData = issueDoc.data()!;
      if (!req.firebaseUser!.isOrganization) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await issueRef.update({
        organizationName,
        updatedAt: new Date()
      });

      res.json({ id: issueDoc.id, ...issueData, organizationName });
    } catch (error) {
      console.error("Error assigning issue:", error);
      res.status(500).json({ error: "Failed to assign issue" });
    }
  });

  // Comment routes
  app.get("/api/issues/:id/comments", verifyToken, async (req: AuthRequest, res) => {
    try {
      const commentsSnapshot = await firestore
        .collection("comments")
        .where("issueId", "==", req.params.id)
        .orderBy("createdAt", "desc")
        .get();

      const comments = commentsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/issues/:id/comments", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { content } = req.body;
      const { uid } = req.firebaseUser!;

      const commentData = {
        content,
        userId: uid,
        issueId: req.params.id,
        createdAt: new Date()
      };

      const docRef = await firestore.collection("comments").add(commentData);
      res.json({ id: docRef.id, ...commentData });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Special debug endpoint that doesn't require authentication
  app.post("/api/debug/issues", async (req, res) => {
    try {
      console.log("DEBUG issue creation received:", req.body);
      
      const { title, description, location, issueType } = req.body;
      
      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }
      
      // Create a minimal issue with required fields
      const issueData = {
        title: title || "Debug Issue",
        description: description || "This is a test issue",
        location: location || "Test Location",
        issueType: issueType || "Garbage Overflow",
        status: "open",
        userId: "debug-user",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Debug issue data prepared:", issueData);
      
      // Generate a mock ID for testing
      const mockId = Math.random().toString(36).substring(2, 15);
      
      // Always return a successful mock response
      return res.status(201).json({
        id: mockId,
        ...issueData,
        debug: true,
        mock: true,
        message: "This is a test response - no actual database write occurred"
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      // Even in case of error, return a success response for debugging
      const mockId = "error-" + Math.random().toString(36).substring(2, 10);
      return res.status(201).json({ 
        id: mockId, 
        title: "Mock Issue (Error Recovery)",
        description: "This issue was created after an error occurred",
        status: "open",
        debug: true,
        mock: true,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Simple debug GET endpoint
  app.get("/api/debug/test", (req, res) => {
    console.log("Debug test endpoint accessed");
    res.status(200).json({
      success: true,
      message: "Server is working correctly",
      timestamp: new Date().toISOString()
    });
  });

  return app;
};
