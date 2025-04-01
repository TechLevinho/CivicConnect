import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    const data = doc.data() as Omit<User, "id">;
    return { id: doc.id, ...data };
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const docRef = this.db.collection("users").doc();
    const now = new Date();
    const userData = {
      ...user,
      createdAt: now,
    };
    await docRef.set(userData);
    return { id: docRef.id, ...userData };
  }

  // Issue operations
  async getIssue(id: string): Promise<Issue | undefined> {
    const doc = await this.db.collection("issues").doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data() as Omit<Issue, "id">;
    return { id: doc.id, ...data };
  }

  async getIssues(): Promise<Issue[]> {
    const snapshot = await this.db.collection("issues").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async getIssuesByUser(userId: string): Promise<Issue[]> {
    const snapshot = await this.db
      .collection("issues")
      .where("userId", "==", userId)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async getIssuesByOrg(orgName: string): Promise<Issue[]> {
    const snapshot = await this.db
      .collection("issues")
      .where("organizationName", "==", orgName)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Issue, "id">),
    }));
  }

  async createIssue(issue: Omit<Issue, "id" | "createdAt" | "updatedAt">): Promise<Issue> {
    const docRef = this.db.collection("issues").doc();
    const now = new Date();
    const issueData = {
      ...issue,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(issueData);
    return { id: docRef.id, ...issueData };
  }

  async updateIssueStatus(id: string, status: string): Promise<Issue> {
    const docRef = this.db.collection("issues").doc(id);
    const now = new Date();
    await docRef.update({
      status,
      updatedAt: now,
    });
    const doc = await docRef.get();
    const data = doc.data() as Omit<Issue, "id">;
    return { id: doc.id, ...data };
  }

  async updateIssuePriority(id: string, priority: string): Promise<Issue> {
    const docRef = this.db.collection("issues").doc(id);
    const now = new Date();
    await docRef.update({
      priority,
      updatedAt: now,
    });
    const doc = await docRef.get();
    const data = doc.data() as Omit<Issue, "id">;
    return { id: doc.id, ...data };
  }

  async assignIssue(id: string, orgName: string): Promise<Issue> {
    const docRef = this.db.collection("issues").doc(id);
    const now = new Date();
    await docRef.update({
      organizationName: orgName,
      updatedAt: now,
    });
    const doc = await docRef.get();
    const data = doc.data() as Omit<Issue, "id">;
    return { id: doc.id, ...data };
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
      ...comment,
      createdAt: now,
    };
    await docRef.set(commentData);
    return { id: docRef.id, ...commentData };
  }

  // Organization operations
  async getPredefinedOrganizations(): Promise<Organization[]> {
    const snapshot = await this.db.collection("organizations").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Organization, "id">),
    }));
  }
} 