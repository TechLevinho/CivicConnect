import { issues, users, comments, type User, type InsertUser, type Issue, type InsertIssue, type Comment, type InsertComment } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Issue operations
  getIssue(id: number): Promise<Issue | undefined>;
  getIssues(): Promise<Issue[]>;
  getIssuesByUser(userId: number): Promise<Issue[]>;
  getIssuesByOrg(orgId: number): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssueStatus(id: number, status: string): Promise<Issue>;
  updateIssuePriority(id: number, priority: string): Promise<Issue>;
  assignIssue(id: number, orgId: number): Promise<Issue>;

  // Comment operations
  getComments(issueId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Issue operations
  async getIssue(id: number): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async getIssues(): Promise<Issue[]> {
    return db.select().from(issues);
  }

  async getIssuesByUser(userId: number): Promise<Issue[]> {
    return db.select().from(issues).where(eq(issues.userId, userId));
  }

  async getIssuesByOrg(orgId: number): Promise<Issue[]> {
    return db.select().from(issues).where(eq(issues.assignedOrgId, orgId));
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const [issue] = await db.insert(issues).values({
      ...insertIssue,
      status: "reported",
      priority: "medium",
      assignedOrgId: null,
    }).returning();
    return issue;
  }

  async updateIssueStatus(id: number, status: string): Promise<Issue> {
    const [issue] = await db
      .update(issues)
      .set({ status })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  }

  async updateIssuePriority(id: number, priority: string): Promise<Issue> {
    const [issue] = await db
      .update(issues)
      .set({ priority })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  }

  async assignIssue(id: number, orgId: number): Promise<Issue> {
    const [issue] = await db
      .update(issues)
      .set({ assignedOrgId: orgId })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  }

  // Comment operations
  async getComments(issueId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.issueId, issueId));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();