import express from "express";
import { db, auth } from "./firebase";
import { verifyToken, AuthRequest } from "./middleware/auth";
import admin from "firebase-admin";

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

  // Handle user/organization profile updates after registration
  app.post("/api/auth/update-profile", async (req, res) => {
    try {
      const { uid, email, isOrganization, organizationName, organizationId, department_type, role } = req.body;
      
      console.log("📝 Profile update request:", { uid, email, isOrganization, organizationName, organizationId, department_type, role });
      
      if (!uid || !email) {
        console.error("❌ Missing required fields:", { uid, email });
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Validate that the user exists in Firebase Auth
      try {
        await admin.auth().getUser(uid);
        console.log("✓ User verified in Firebase Auth:", uid);
      } catch (authError) {
        console.error("❌ User not found in Firebase Auth:", uid, authError);
        return res.status(404).json({ error: "User not found in Firebase Auth" });
      }
      
      if (isOrganization) {
        console.log("🏢 Creating organization profile for:", uid);
        
        if (!organizationName) {
          return res.status(400).json({ error: "Organization name is required" });
        }
        
        // Create organization profile
        const orgData = {
          name: organizationName,
          email,
          uid,
          role: "organization",
          department_type: department_type || "General",
          assigned_issues: [],
          location: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // First, check if the organization already exists
        const existingOrg = await db.collection("organizations").doc(uid).get();
        if (existingOrg.exists) {
          console.log("⚠️ Organization already exists:", uid);
          
          // Ensure the custom claims are set properly
          await admin.auth().setCustomUserClaims(uid, { 
            role: "organization",
            isOrganization: true
          });
          
          return res.json({ 
            message: "Organization profile already exists",
            profile: existingOrg.data()
          });
        }
        
        // Create the organization
        await db.collection("organizations").doc(uid).set(orgData);
        
        // Set custom claims for organization
        console.log("🔑 Setting organization custom claims for:", uid);
        await admin.auth().setCustomUserClaims(uid, { 
          role: "organization",
          isOrganization: true 
        });
        
        console.log("✅ Organization profile created successfully:", uid);
        return res.json({ 
          message: "Organization profile created successfully",
          profile: orgData 
        });
      } else {
        console.log("👤 Creating user profile for:", uid);
        
        // Create regular user profile
        const userData = {
          email,
          uid,
          name: email.split('@')[0], // Default name from email
          role: "user",
          phoneNumber: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // First, check if the user already exists
        const existingUser = await db.collection("users").doc(uid).get();
        if (existingUser.exists) {
          console.log("⚠️ User already exists:", uid);
          
          // Ensure the custom claims are set properly
          await admin.auth().setCustomUserClaims(uid, { 
            role: "user",
            isOrganization: false
          });
          
          return res.json({ 
            message: "User profile already exists",
            profile: existingUser.data()
          });
        }
        
        // Create the user
        await db.collection("users").doc(uid).set(userData);
        
        // Set custom claims for regular user
        console.log("🔑 Setting user custom claims for:", uid);
        await admin.auth().setCustomUserClaims(uid, { 
          role: "user",
          isOrganization: false
        });
        
        console.log("✅ User profile created successfully:", uid);
        return res.json({ 
          message: "User profile created successfully",
          profile: userData 
        });
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile", details: (error as Error).message });
    }
  });

  // User routes
  app.post("/api/users", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { name, email, phoneNumber } = req.body;
      const { uid } = req.firebaseUser!;

      // Prevent creation of user if the user is already an organization
      const orgDoc = await db.collection("organizations").doc(uid).get();
      if (orgDoc.exists) {
        return res.status(400).json({ 
          error: "Cannot create user profile: account already exists as an organization" 
        });
      }

      const userData = {
        name,
        email,
        uid,
        phoneNumber: phoneNumber || null,
        role: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(uid).set(userData);
      res.json({ id: uid, ...userData });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Organization routes
  app.post("/api/organizations", verifyToken, async (req: AuthRequest, res) => {
    try {
      const { name, department_type, location, email } = req.body;
      const { uid } = req.firebaseUser!;

      // Prevent creation of organization if the user already exists
      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        return res.status(400).json({ 
          error: "Cannot create organization profile: account already exists as a user" 
        });
      }

      const orgData = {
        name,
        uid,
        department_type,
        email,
        assigned_issues: [],
        role: "organization",
        location: location || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("organizations").doc(uid).set(orgData);
      res.json({ id: uid, ...orgData });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Add an explicit endpoint to get current user information
  app.get("/api/auth/me", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = req.firebaseUser.uid;
      
      // First check if user is an organization
      const orgDoc = await db.collection("organizations").doc(userId).get();
      if (orgDoc.exists) {
        const orgData = orgDoc.data() || {};
        // Force set the isOrganization flag to true
        return res.json({
          ...orgData,
          uid: userId,
          id: userId,
          isOrganization: true,
          role: "organization",
          redirectPath: "/organization/dashboard",
        });
      }
      
      // Otherwise check regular user collection
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        // Explicitly include the isOrganization flag (defaulting to false for users)
        return res.json({
          ...userData,
          uid: userId,
          id: userId,
          isOrganization: userData.isOrganization === true || userData.role === "organization",
          role: userData.role || "user",
          redirectPath: userData.isOrganization ? "/organization/dashboard" : "/user/dashboard",
        });
      }
      
      // No user found in either collection, return the basic Firebase user
      return res.json({
        uid: userId,
        id: userId,
        email: req.firebaseUser.email,
        isOrganization: req.firebaseUser.isOrganization === true || req.firebaseUser.role === "organization",
        role: req.firebaseUser.role || "user",
        redirectPath: req.firebaseUser.isOrganization ? "/organization/dashboard" : "/user/dashboard",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Issue routes
  
  // POST /report-issue - Create a new issue
  app.post("/api/report-issue", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { title, description, imageURL, location, severity, assignedTo } = req.body;
      
      if (!title || !description || !location) {
        return res.status(400).json({ error: "Title, description, and location are required" });
      }

      // Using userId instead of reportedBy to match security rules
      const newIssue = {
        title,
        description,
        imageURL: imageURL || null,
        location,
        userId: req.firebaseUser.uid,   // Important: Changed from reportedBy to userId for rule compatibility
        assignedTo: assignedTo || null,
        status: "open",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        severity: severity || "medium",
        comments: []
      };

      const issueRef = await db.collection("issues").add(newIssue);
      
      // If the issue is assigned to an organization, update the organization's assigned_issues array
      if (assignedTo) {
        const orgRef = db.collection("organizations").doc(assignedTo);
        await orgRef.update({
          assigned_issues: admin.firestore.FieldValue.arrayUnion(issueRef.id)
        });
      }

      res.status(201).json({ 
        id: issueRef.id,
        ...newIssue 
      });
    } catch (error) {
      console.error("Error creating issue:", error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  // GET /issues/:id - Get issue details
  app.get("/api/issues/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      const issueId = req.params.id;
      
      const issueDoc = await db.collection("issues").doc(issueId).get();
      
      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      const issueData = issueDoc.data();
      
      // Fetch reporter details - use userId field instead of reportedBy
      let reporterData = null;
      if (issueData?.userId) {
        const reporterDoc = await db.collection("users").doc(issueData.userId).get();
        if (reporterDoc.exists) {
          reporterData = {
            uid: reporterDoc.id,
            name: reporterDoc.data()?.name,
            email: reporterDoc.data()?.email
          };
        }
      }
      
      // Fetch organization details if assigned
      let assignedOrgData = null;
      if (issueData?.assignedTo) {
        const orgDoc = await db.collection("organizations").doc(issueData.assignedTo).get();
        if (orgDoc.exists) {
          assignedOrgData = {
            uid: orgDoc.id,
            name: orgDoc.data()?.name,
            department_type: orgDoc.data()?.department_type
          };
        }
      }
      
      res.json({
        id: issueDoc.id,
        ...issueData,
        reporter: reporterData,
        assignedOrganization: assignedOrgData
      });
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  // GET /issues - Get all issues (with optional filtering)
  app.get("/api/issues", async (req: AuthRequest, res) => {
    // Check for authorization
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    } else if (req.cookies?.token) {
      // Also check for token in cookies
      token = req.cookies.token;
    }
    
    if (!token) {
      console.log("Issues endpoint: No authorization token provided");
      return res.status(401).json({ 
        message: "Unauthorized - Please provide a valid authentication token",
        status: 401
      });
    }
    
    try {
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      
      // Log request details
      console.log(`Issues API called for UID: ${userId}`);
      console.log(`User data:`, JSON.stringify({
        email: decodedToken.email,
        role: decodedToken.role || "user",
        isOrganization: decodedToken.isOrganization
      }, null, 2));
      
      try {
        const { status, severity } = req.query;
        
        let query = db.collection("issues");
        
        // Apply filters if provided
        if (status) {
          console.log(`Applying status filter: ${status}`);
          query = query.where("status", "==", status.toString());
        }
        
        if (severity) {
          console.log(`Applying severity filter: ${severity}`);
          query = query.where("severity", "==", severity.toString());
        }
        
        // Sort by creation date (newest first)
        query = query.orderBy("createdAt", "desc");
        
        // Log query details for debugging
        const queryDescription = `db.collection("issues")${status ? `.where("status", "==", "${status}")` : ""}${severity ? `.where("severity", "==", "${severity}")` : ""}.orderBy("createdAt", "desc")`;
        console.log(`Executing Firestore query: ${queryDescription}`);
        
        const issuesSnapshot = await query.get();
        
        const issues = issuesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Found ${issues.length} issues matching criteria`);
        return res.json({
          issues,
          count: issues.length,
          status: 200,
          filters: { status, severity }
        });
      } catch (queryError) {
        // Handle errors related to the Firestore query
        console.error("Error executing Firestore query:", queryError);
        console.error("Stack trace:", queryError instanceof Error ? queryError.stack : "No stack trace available");
        return res.status(500).json({ 
          message: "Server error fetching issues", 
          status: 500 
        });
      }
    } catch (authError) {
      // Handle token verification errors
      console.error("Authentication error:", authError);
      console.error("Stack trace:", authError instanceof Error ? authError.stack : "No stack trace available");
      return res.status(401).json({ 
        message: "Invalid or expired authentication token", 
        status: 401 
      });
    }
  });

  // POST /issues - Create a new issue
  app.post("/api/issues", async (req: AuthRequest, res) => {
    // Check for authorization
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    } else if (req.cookies?.token) {
      // Also check for token in cookies
      token = req.cookies.token;
    }
    
    if (!token) {
      console.log("Create issue endpoint: No authorization token provided");
      return res.status(401).json({ 
        message: "Unauthorized - Please provide a valid authentication token",
        status: 401
      });
    }
    
    try {
      // Log incoming request data
      console.log("POST /api/issues - Request body:", JSON.stringify(req.body, null, 2));
      
      // Extract required fields from request body
      const { title, description, category, location, imageUrl } = req.body;
      
      // Validate required fields
      if (!title || !description || !category) {
        console.log("Missing required fields:", { title, description, category });
        return res.status(400).json({
          message: "Missing required fields: title, description, and category are required",
          status: 400
        });
      }
      
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      
      // Log token info
      console.log(`Create issue API called by UID: ${userId}`);
      console.log(`User data:`, JSON.stringify({
        email: decodedToken.email,
        role: decodedToken.role || "user",
        isOrganization: decodedToken.isOrganization
      }, null, 2));
      
      try {
        // Find organizations that handle this category of issue
        let assignedTo = null;
        try {
          const organizationsQuery = await db.collection("organizations")
            .where("department_type", "==", category)
            .limit(1)
            .get();
          
          if (!organizationsQuery.empty) {
            // Assign to the first matching organization
            assignedTo = organizationsQuery.docs[0].id;
            console.log(`Assigning issue to organization: ${assignedTo}`);
          } else {
            console.log(`No organization found that handles category: ${category}`);
          }
        } catch (orgError) {
          console.error("Error finding organizations for category:", orgError);
          // Continue without assigning if there's an error
        }
        
        // Create the issue object
        const issueData = {
          title,
          description,
          category,
          location: location || "Unknown location",
          imageUrl: imageUrl || null,
          status: "open",
          severity: "medium", // Default severity
          userId,
          assignedTo, // This will be null if no matching organization was found
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Log the issue data being saved
        console.log("Creating new issue with data:", JSON.stringify(issueData, null, 2));
        
        // Add the issue to Firestore
        const issueRef = await db.collection("issues").add(issueData);
        
        // If the issue is assigned to an organization, update the organization's assigned_issues array
        if (assignedTo) {
          try {
            const orgRef = db.collection("organizations").doc(assignedTo);
            await orgRef.update({
              assigned_issues: admin.firestore.FieldValue.arrayUnion(issueRef.id)
            });
            console.log(`Updated organization ${assignedTo} with new issue ${issueRef.id}`);
          } catch (updateError) {
            console.error("Error updating organization's assigned issues:", updateError);
            // Continue even if this fails, as the issue is already created
          }
        }
        
        // Get the created issue with ID
        const createdIssue = {
          id: issueRef.id,
          ...issueData,
          // Convert server timestamps to regular dates for the response
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log(`Issue created successfully with ID: ${issueRef.id}`);
        
        // Return success response with the created issue
        return res.status(201).json({
          message: "Issue created successfully",
          issue: createdIssue,
          status: 201
        });
      } catch (dbError) {
        // Handle database errors
        console.error("Error creating issue in Firestore:", dbError);
        console.error("Stack trace:", dbError instanceof Error ? dbError.stack : "No stack trace available");
        
        return res.status(500).json({
          message: "Server error creating issue",
          error: dbError instanceof Error ? dbError.message : "Unknown database error",
          status: 500
        });
      }
    } catch (authError) {
      // Handle token verification errors
      console.error("Authentication error:", authError);
      console.error("Stack trace:", authError instanceof Error ? authError.stack : "No stack trace available");
      
      return res.status(401).json({
        message: "Invalid or expired authentication token",
        status: 401
      });
    }
  });

  // GET /organization/issues - Get issues assigned to the requesting organization
  app.get("/api/organization/issues", async (req: AuthRequest, res) => {
    // Check for authorization
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    } else if (req.cookies?.token) {
      // Also check for token in cookies
      token = req.cookies.token;
    }
    
    if (!token) {
      console.log("Organization issues endpoint: No authorization token provided");
      return res.status(401).json({ 
        message: "Unauthorized - Please provide a valid authentication token",
        status: 401
      });
    }
    
    try {
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      const orgId = decodedToken.uid;
      
      // Log request details
      console.log(`Organization issues API called for UID: ${orgId}`);
      console.log(`User data:`, JSON.stringify({
        email: decodedToken.email,
        role: decodedToken.role || "user",
        isOrganization: decodedToken.isOrganization
      }, null, 2));
      
      try {
        // Verify this is an organization account
        const orgDoc = await db.collection("organizations").doc(orgId).get();
        
        if (!orgDoc.exists) {
          console.log(`Organization document not found for UID: ${orgId}`);
          return res.status(403).json({ 
            message: "Access restricted to organization accounts", 
            status: 403 
          });
        }
        
        try {
          // Find all issues assigned to this organization
          const queryRef = db.collection("issues")
            .where("assignedTo", "==", orgId)
            .orderBy("createdAt", "desc");
          
          // Log the query being executed
          console.log(`Executing Firestore query: db.collection("issues").where("assignedTo", "==", "${orgId}").orderBy("createdAt", "desc")`);
          
          const issuesSnapshot = await queryRef.get();
          
          const issues = issuesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`Found ${issues.length} issues for organization ${orgId}`);
          return res.json({ 
            issues,
            count: issues.length,
            status: 200
          });
        } catch (queryError) {
          // Handle errors related to the Firestore query
          console.error("Error executing Firestore query:", queryError);
          console.error("Stack trace:", queryError instanceof Error ? queryError.stack : "No stack trace available");
          return res.status(500).json({ 
            message: "Server error fetching organization issues", 
            status: 500 
          });
        }
      } catch (orgError) {
        // Handle errors related to retrieving the organization document
        console.error("Error verifying organization:", orgError);
        console.error("Stack trace:", orgError instanceof Error ? orgError.stack : "No stack trace available");
        return res.status(500).json({ 
          message: "Server error verifying organization account", 
          status: 500 
        });
      }
    } catch (authError) {
      // Handle token verification errors
      console.error("Authentication error:", authError);
      console.error("Stack trace:", authError instanceof Error ? authError.stack : "No stack trace available");
      return res.status(401).json({ 
        message: "Invalid or expired authentication token", 
        status: 401 
      });
    }
  });

  // GET /user/issues - Get issues reported by the requesting user
  app.get("/api/user/issues", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = req.firebaseUser.uid;
      
      // Verify this is a user account
      const userDoc = await db.collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(403).json({ error: "Access restricted to user accounts" });
      }
      
      // Find all issues reported by this user - use userId field instead of reportedBy
      const query = db.collection("issues")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc");
      
      const issuesSnapshot = await query.get();
      
      const issues = issuesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(issues);
    } catch (error) {
      console.error("Error fetching user issues:", error);
      res.status(500).json({ error: "Failed to fetch user issues" });
    }
  });

  // PUT /issues/:id - Update an issue
  app.put("/api/issues/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const issueId = req.params.id;
      const { status, assignedTo, description, severity } = req.body;
      
      const issueRef = db.collection("issues").doc(issueId);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      const issueData = issueDoc.data()!;
      
      // Check permissions: user must be either the reporter (userId) or an organization
      const isReporter = issueData.userId === req.firebaseUser.uid;
      const isOrganization = req.firebaseUser.role === "organization";
      
      if (!isReporter && !isOrganization) {
        return res.status(403).json({ 
          error: "Permission denied: Only the issue reporter or an organization can update issues" 
        });
      }
      
      const updateData: any = {};
      
      if (status) updateData.status = status;
      if (description) updateData.description = description;
      if (severity) updateData.severity = severity;
      
      // If assignedTo is changing, we need to update organization assignments
      if (assignedTo !== undefined && assignedTo !== issueData.assignedTo) {
        updateData.assignedTo = assignedTo;
        
        // Remove from previous organization if it was assigned
        if (issueData.assignedTo) {
          const prevOrgRef = db.collection("organizations").doc(issueData.assignedTo);
          await prevOrgRef.update({
            assigned_issues: admin.firestore.FieldValue.arrayRemove(issueId)
          });
        }
        
        // Add to new organization if assigned
        if (assignedTo) {
          const newOrgRef = db.collection("organizations").doc(assignedTo);
          await newOrgRef.update({
            assigned_issues: admin.firestore.FieldValue.arrayUnion(issueId)
          });
        }
      }
      
      await issueRef.update(updateData);
      
      const updatedDoc = await issueRef.get();
      
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error("Error updating issue:", error);
      res.status(500).json({ error: "Failed to update issue" });
    }
  });

  // POST /issues/:id/comments - Add a comment to an issue
  app.post("/api/issues/:id/comments", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const issueId = req.params.id;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      // Create a new comment in the comments collection instead of nested in issues
      const newComment = {
        content,
        userId: req.firebaseUser.uid,  // Using userId to match security rules
        issueId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const commentRef = await db.collection("comments").add(newComment);
      
      res.status(201).json({
        id: commentRef.id,
        ...newComment
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // GET /issues/:id/comments - Get comments for an issue
  app.get("/api/issues/:id/comments", verifyToken, async (req: AuthRequest, res) => {
    try {
      const issueId = req.params.id;
      
      // Fetch comments from separate collection
      const commentsQuery = db.collection("comments")
        .where("issueId", "==", issueId)
        .orderBy("createdAt", "desc");
      
      const commentsSnapshot = await commentsQuery.get();
      
      const comments = commentsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // DELETE /issues/:issueId - Delete an issue (only by creator)
  app.delete("/api/issues/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
      if (!req.firebaseUser || !req.firebaseUser.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const issueId = req.params.id;
      const issueRef = db.collection("issues").doc(issueId);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      // Check if the requesting user is the creator
      if (issueDoc.data()?.userId !== req.firebaseUser.uid) {
        return res.status(403).json({ error: "Only the issue creator can delete this issue" });
      }
      
      // Remove issue from any assigned organization
      if (issueDoc.data()?.assignedTo) {
        const orgRef = db.collection("organizations").doc(issueDoc.data()!.assignedTo);
        await orgRef.update({
          assigned_issues: admin.firestore.FieldValue.arrayRemove(issueId)
        });
      }
      
      // Delete all related comments
      const commentsQuery = db.collection("comments").where("issueId", "==", issueId);
      const commentsSnapshot = await commentsQuery.get();
      
      const batch = db.batch();
      commentsSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        batch.delete(doc.ref);
      });
      
      // Delete the issue itself
      batch.delete(issueRef);
      
      await batch.commit();
      
      res.json({ message: "Issue and related comments deleted successfully" });
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ error: "Failed to delete issue" });
    }
  });
};
