import { type User, type InsertUser, type Issue, type InsertIssue, type Comment, type InsertComment } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private issues: Map<number, Issue>;
  private comments: Map<number, Comment>;
  private currentUserId: number;
  private currentIssueId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.issues = new Map();
    this.comments = new Map();
    this.currentUserId = 1;
    this.currentIssueId = 1;
    this.currentCommentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Issue operations
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }

  async getIssues(): Promise<Issue[]> {
    return Array.from(this.issues.values());
  }

  async getIssuesByUser(userId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.userId === userId,
    );
  }

  async getIssuesByOrg(orgId: number): Promise<Issue[]> {
    return Array.from(this.issues.values()).filter(
      (issue) => issue.assignedOrgId === orgId,
    );
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.currentIssueId++;
    const issue: Issue = { ...insertIssue, id, status: "reported", priority: "medium", assignedOrgId: null };
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssueStatus(id: number, status: string): Promise<Issue> {
    const issue = this.issues.get(id);
    if (!issue) throw new Error("Issue not found");
    const updated = { ...issue, status };
    this.issues.set(id, updated);
    return updated;
  }

  async updateIssuePriority(id: number, priority: string): Promise<Issue> {
    const issue = this.issues.get(id);
    if (!issue) throw new Error("Issue not found");
    const updated = { ...issue, priority };
    this.issues.set(id, updated);
    return updated;
  }

  async assignIssue(id: number, orgId: number): Promise<Issue> {
    const issue = this.issues.get(id);
    if (!issue) throw new Error("Issue not found");
    const updated = { ...issue, assignedOrgId: orgId };
    this.issues.set(id, updated);
    return updated;
  }

  // Comment operations
  async getComments(issueId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.issueId === issueId,
    );
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = { ...insertComment, id };
    this.comments.set(id, comment);
    return comment;
  }
}

export const storage = new MemStorage();
