export interface Issue {
  id?: string;
  title: string;
  description: string;
  imageURL?: string | null;
  location: any; // GeoPoint or string
  userId: string; // Changed from reportedBy to userId for rule consistency
  assignedTo?: string | null; // Organization uid
  status: string;
  severity: string;
  createdAt: Date;
}

export interface User {
  id?: string;
  uid: string;
  name: string;
  email: string;
  isOrganization: boolean;
  phoneNumber?: string | null;
  createdAt: Date;
}

export interface Comment {
  id?: string;
  content: string;
  userId: string;   // Changed from authorId to userId for consistency
  issueId: string;  // Added issueId to link to the parent issue
  createdAt: Date;
}

export interface Organization {
  id?: string;
  uid: string;
  name: string;
  department_type: string;
  email: string;
  isOrganization: boolean;
  assigned_issues: string[];
  location?: any; // GeoPoint or string
  createdAt: Date;
}

export interface DatabaseAdapter {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: Omit<Organization, "id" | "createdAt" | "assigned_issues">): Promise<Organization>;
  assignIssueToOrg(orgId: string, issueId: string): Promise<void>;
  removeIssueFromOrg(orgId: string, issueId: string): Promise<void>;

  // Issue operations
  getIssue(id: string): Promise<Issue | undefined>;
  getIssues(): Promise<Issue[]>;
  getIssuesByUser(userId: string): Promise<Issue[]>;
  getIssuesByOrg(orgId: string): Promise<Issue[]>;
  createIssue(issue: Omit<Issue, "id" | "createdAt">): Promise<Issue>;
  updateIssue(id: string, data: Partial<Issue>): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;
  
  // Comment operations
  getComments(issueId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
} 