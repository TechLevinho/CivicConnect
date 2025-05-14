import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { DatabaseAdapter, Issue, User, Comment, Organization } from "./types";

export class FirebaseAdapter implements DatabaseAdapter {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    this.db = getFirestore(app);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.db.collection("users").doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data() as Omit<User, "id">;
    return { id: doc.id, ...data };
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const docRef = this.db.collection("users").doc(user.uid);
    const now = new Date();
    const userData = {
      ...user,
      createdAt: now,
    };
    await docRef.set(userData);
    return { id: docRef.id, ...userData };
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const doc = await this.db.collection("organizations").doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data() as Omit<Organization, "id">;
    return { id: doc.id, ...data };
  }

  async createOrganization(org: Omit<Organization, "id" | "createdAt" | "assigned_issues">): Promise<Organization> {
    const docRef = this.db.collection("organizations").doc(org.uid);
    const now = new Date();
    const orgData = {
      ...org,
      assigned_issues: [],
      createdAt: now,
    };
    await docRef.set(orgData);
    return { id: docRef.id, ...orgData };
  }

  async assignIssueToOrg(orgId: string, issueId: string): Promise<void> {
    const orgRef = this.db.collection("organizations").doc(orgId);
    await orgRef.update({
      assigned_issues: FieldValue.arrayUnion(issueId)
    });
  }

  async removeIssueFromOrg(orgId: string, issueId: string): Promise<void> {
    const orgRef = this.db.collection("organizations").doc(orgId);
    await orgRef.update({
      assigned_issues: FieldValue.arrayRemove(issueId)
    });
  }

  // Issue operations
  async getIssue(id: string): Promise<Issue | undefined> {
    const doc = await this.db.collection("issues").doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data() as Omit<Issue, "id">;
    return { id: doc.id, ...data };
  }

  async getIssues(): Promise<Issue[]> {
    const snapshot = await this.db.collection("issues")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async getIssuesByUser(userId: string): Promise<Issue[]> {
    const snapshot = await this.db
      .collection("issues")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async getIssuesByOrg(orgId: string): Promise<Issue[]> {
    const snapshot = await this.db
      .collection("issues")
      .where("assignedTo", "==", orgId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async createIssue(issue: Omit<Issue, "id" | "createdAt">): Promise<Issue> {
    const docRef = this.db.collection("issues").doc();
    const now = new Date();
    const issueData = {
      ...issue,
      createdAt: now
    };
    await docRef.set(issueData);
    return { id: docRef.id, ...issueData };
  }

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue> {
    const docRef = this.db.collection("issues").doc(id);
    await docRef.update(data);
    const doc = await docRef.get();
    return { id: doc.id, ...(doc.data() as Omit<Issue, "id">) };
  }

  async deleteIssue(id: string): Promise<void> {
    const docRef = this.db.collection("issues").doc(id);
    await docRef.delete();
  }

  // Comment operations
  async getComments(issueId: string): Promise<Comment[]> {
    const snapshot = await this.db
      .collection("comments")
      .where("issueId", "==", issueId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Comment, "id">),
    }));
  }

  async createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    const docRef = this.db.collection("comments").doc();
    const now = new Date();
    const commentData = {
      content: comment.content,
      userId: comment.userId,
      issueId: comment.issueId,
      createdAt: now
    };
    
    await docRef.set(commentData);
    return { id: docRef.id, ...commentData };
  }

  async deleteComment(id: string): Promise<void> {
    const docRef = this.db.collection("comments").doc(id);
    await docRef.delete();
  }
} 