import { DatabaseAdapter, User, Issue, Comment, Organization } from "./types";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import * as FirebaseFirestore from "firebase-admin/firestore";

export class DatabaseStorage implements DatabaseAdapter {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return undefined;
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data()?.createdAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.where("username", "==", username).limit(1).get();
      
      if (querySnapshot.empty) {
        return undefined;
      }
      
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data()?.createdAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.where("email", "==", email).limit(1).get();
      
      if (querySnapshot.empty) {
        return undefined;
      }
      
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data()?.createdAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    try {
      const id = uuidv4();
      const userData = {
        ...user,
        createdAt: new Date()
      };
      
      await db.collection("users").doc(id).set(userData);
      
      return {
        id,
        ...userData
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    try {
      const updatedAt = new Date();
      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`User with ID ${id} not found`);
        return undefined;
      }

      const data = {
        ...userData,
        updatedAt,
      };

      await userRef.update(data);
      
      const updatedUserDoc = await userRef.get();
      
      // Get the full user data and cast to User type
      const existingData = updatedUserDoc.data() as any;
      
      return {
        id: updatedUserDoc.id,
        username: existingData.username,
        email: existingData.email,
        password: existingData.password,
        organizationName: existingData.organizationName,
        isOrganization: existingData.isOrganization,
        createdAt: existingData.createdAt?.toDate?.() || existingData.createdAt,
        updatedAt: existingData.updatedAt?.toDate?.() || updatedAt
      } as User;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Issue operations
  async getIssue(id: string): Promise<Issue | undefined> {
    try {
      const issueRef = db.collection("issues").doc(id);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        return undefined;
      }
      
      return {
        id: issueDoc.id,
        ...issueDoc.data(),
        createdAt: issueDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: issueDoc.data()?.updatedAt?.toDate() || new Date()
      } as Issue;
    } catch (error) {
      console.error("Error fetching issue:", error);
      return undefined;
    }
  }

  async getIssues(): Promise<Issue[]> {
    try {
      const issuesRef = db.collection("issues");
      const querySnapshot = await issuesRef.get();
      
      return querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date()
      })) as Issue[];
    } catch (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
  }

  async getIssuesByUser(userId: string): Promise<Issue[]> {
    try {
      const issuesRef = db.collection("issues");
      const querySnapshot = await issuesRef.where("userId", "==", userId).get();
      
      return querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date()
      })) as Issue[];
    } catch (error) {
      console.error("Error fetching issues by user:", error);
      return [];
    }
  }

  async getIssuesByOrg(orgName: string): Promise<Issue[]> {
    try {
      const issuesRef = db.collection("issues");
      const querySnapshot = await issuesRef.where("organizationName", "==", orgName).get();
      
      return querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date()
      })) as Issue[];
    } catch (error) {
      console.error("Error fetching issues by organization:", error);
      return [];
    }
  }

  async createIssue(issue: Omit<Issue, "id" | "createdAt" | "updatedAt">): Promise<Issue> {
    try {
      const id = uuidv4();
      const issueData = {
        ...issue,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection("issues").doc(id).set(issueData);
      
      return {
        id,
        ...issueData
      } as Issue;
    } catch (error) {
      console.error("Error creating issue:", error);
      throw error;
    }
  }

  async updateIssueStatus(id: string, status: string): Promise<Issue> {
    try {
      const issueRef = db.collection("issues").doc(id);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        throw new Error("Issue not found");
      }
      
      const issueData = issueDoc.data() || {};
      const updatedAt = new Date();
      
      // Create new object with all issue data
      const updatedIssue = {
        id,
        ...issueData,
        status,
        updatedAt,
        // Make sure to include createdAt
        createdAt: issueData.createdAt?.toDate() || new Date()
      } as Issue;
      
      await issueRef.update({
        status,
        updatedAt
      });
      
      return updatedIssue;
    } catch (error) {
      console.error("Error updating issue status:", error);
      throw error;
    }
  }

  async updateIssuePriority(id: string, priority: string): Promise<Issue> {
    try {
      const issueRef = db.collection("issues").doc(id);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        throw new Error("Issue not found");
      }
      
      const issueData = issueDoc.data() || {};
      const updatedAt = new Date();
      
      // Create new object with all issue data
      const updatedIssue = {
        id,
        ...issueData,
        priority,
        updatedAt,
        // Make sure to include createdAt
        createdAt: issueData.createdAt?.toDate() || new Date()
      } as Issue;
      
      await issueRef.update({
        priority,
        updatedAt
      });
      
      return updatedIssue;
    } catch (error) {
      console.error("Error updating issue priority:", error);
      throw error;
    }
  }

  async assignIssue(id: string, orgName: string): Promise<Issue> {
    try {
      const issueRef = db.collection("issues").doc(id);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        throw new Error("Issue not found");
      }
      
      const issueData = issueDoc.data() || {};
      const updatedAt = new Date();
      
      // Create new object with all issue data
      const updatedIssue = {
        id,
        ...issueData,
        organizationName: orgName,
        updatedAt,
        // Make sure to include createdAt
        createdAt: issueData.createdAt?.toDate() || new Date()
      } as Issue;
      
      await issueRef.update({
        organizationName: orgName,
        updatedAt
      });
      
      return updatedIssue;
    } catch (error) {
      console.error("Error assigning issue:", error);
      throw error;
    }
  }

  // Comment operations
  async getComments(issueId: string): Promise<Comment[]> {
    try {
      const commentsRef = db.collection("comments");
      const querySnapshot = await commentsRef.where("issueId", "==", issueId).orderBy("createdAt", "desc").get();
      
      return querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date()
      })) as Comment[];
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  }

  async createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    try {
      const id = uuidv4();
      const commentData = {
        ...comment,
        createdAt: new Date()
      };
      
      await db.collection("comments").doc(id).set(commentData);
      
      return {
        id,
        ...commentData
      } as Comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  // Organization operations
  async getPredefinedOrganizations(): Promise<Organization[]> {
    // We're using hardcoded organizations in this implementation
    // This method now returns an empty array as the organizations are defined in routes.ts
    return [];
  }
} 