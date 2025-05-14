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
        uid: userDoc.data()?.uid || userDoc.id,
        name: userDoc.data()?.name || '',
        email: userDoc.data()?.email || '',
        isOrganization: userDoc.data()?.isOrganization || false,
        phoneNumber: userDoc.data()?.phoneNumber,
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
        uid: userDoc.data()?.uid || userDoc.id,
        name: userDoc.data()?.name || '',
        email: userDoc.data()?.email || '',
        isOrganization: userDoc.data()?.isOrganization || false,
        phoneNumber: userDoc.data()?.phoneNumber,
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
        uid: userDoc.data()?.uid || userDoc.id,
        name: userDoc.data()?.name || '',
        email: userDoc.data()?.email || '',
        isOrganization: userDoc.data()?.isOrganization || false,
        phoneNumber: userDoc.data()?.phoneNumber,
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
      
      // Ensure all required fields have defaults
      const userData = {
        ...user,  // Keep original values first
        // Then provide fallbacks for required fields
        uid: user.uid || id,
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        isOrganization: user.isOrganization === true,
        phoneNumber: user.phoneNumber || null,
        createdAt: new Date()
      };
      
      console.log("Creating user with data:", userData);
      
      await db.collection("users").doc(id).set(userData);
      
      return {
        id,
        ...userData
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
      
      // In development, create a mock user instead of crashing
      if (process.env.NODE_ENV !== 'production') {
        console.warn("DEV MODE: Returning mock user after creation failure");
        return {
          id: uuidv4(),
          uid: user.uid || 'mock-user-id',
          name: user.name || 'Mock User',
          email: user.email || 'mock@example.com',
          isOrganization: user.isOrganization === true,
          phoneNumber: user.phoneNumber || null,
          createdAt: new Date()
        } as User;
      }
      
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
      const existingData = updatedUserDoc.data() as any;
      
      return {
        id: updatedUserDoc.id,
        uid: existingData.uid || updatedUserDoc.id,
        name: existingData.name || '',
        email: existingData.email || '',
        isOrganization: existingData.isOrganization || false,
        phoneNumber: existingData.phoneNumber,
        createdAt: existingData.createdAt?.toDate?.() || existingData.createdAt || new Date()
      } as User;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    try {
      const orgRef = db.collection("organizations").doc(id);
      const orgDoc = await orgRef.get();
      
      if (!orgDoc.exists) {
        return undefined;
      }
      
      return {
        id: orgDoc.id,
        uid: orgDoc.data()?.uid || orgDoc.id,
        name: orgDoc.data()?.name || '',
        department_type: orgDoc.data()?.department_type || 'General',
        email: orgDoc.data()?.email || '',
        isOrganization: true,
        assigned_issues: orgDoc.data()?.assigned_issues || [],
        location: orgDoc.data()?.location || null,
        createdAt: orgDoc.data()?.createdAt?.toDate() || new Date()
      } as Organization;
    } catch (error) {
      console.error("Error fetching organization:", error);
      return undefined;
    }
  }

  async createOrganization(org: Omit<Organization, "id" | "createdAt" | "assigned_issues">): Promise<Organization> {
    try {
      const id = uuidv4();
      const orgData = {
        ...org,
        assigned_issues: [],
        createdAt: new Date()
      };
      
      await db.collection("organizations").doc(id).set(orgData);
      
      return {
        id,
        ...orgData
      } as Organization;
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  }

  async assignIssueToOrg(orgId: string, issueId: string): Promise<void> {
    try {
      const orgRef = db.collection("organizations").doc(orgId);
      
      await orgRef.update({
        assigned_issues: FirebaseFirestore.FieldValue.arrayUnion(issueId)
      });
    } catch (error) {
      console.error("Error assigning issue to organization:", error);
      throw error;
    }
  }

  async removeIssueFromOrg(orgId: string, issueId: string): Promise<void> {
    try {
      const orgRef = db.collection("organizations").doc(orgId);
      
      await orgRef.update({
        assigned_issues: FirebaseFirestore.FieldValue.arrayRemove(issueId)
      });
    } catch (error) {
      console.error("Error removing issue from organization:", error);
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

  async getIssuesByOrg(orgId: string): Promise<Issue[]> {
    try {
      const issuesRef = db.collection("issues");
      const querySnapshot = await issuesRef.where("assignedTo", "==", orgId).get();
      
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

  async createIssue(issue: Omit<Issue, "id" | "createdAt">): Promise<Issue> {
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

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue> {
    try {
      const issueRef = db.collection("issues").doc(id);
      const issueDoc = await issueRef.get();
      
      if (!issueDoc.exists) {
        throw new Error("Issue not found");
      }
      
      const issueData = issueDoc.data() || {};
      const updatedAt = new Date();
      
      const updateData = {
        ...data,
        updatedAt
      };
      
      await issueRef.update(updateData);
      
      const updatedIssueDoc = await issueRef.get();
      
      return {
        id: updatedIssueDoc.id,
        ...updatedIssueDoc.data(),
        createdAt: updatedIssueDoc.data()?.createdAt?.toDate() || new Date(),
        updatedAt: updatedIssueDoc.data()?.updatedAt?.toDate() || new Date()
      } as Issue;
    } catch (error) {
      console.error("Error updating issue:", error);
      throw error;
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      await db.collection("issues").doc(id).delete();
    } catch (error) {
      console.error("Error deleting issue:", error);
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

  async deleteComment(id: string): Promise<void> {
    try {
      await db.collection("comments").doc(id).delete();
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }
} 