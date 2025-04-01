export interface Issue {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
  priority: string;
  userId: string;
  organizationName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  organizationName: string | null;
  isOrganization: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  issueId: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  categoryId: number;
  description: string | null;
}

export interface DatabaseAdapter {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  // Issue operations
  getIssue(id: string): Promise<Issue | undefined>;
  getIssues(): Promise<Issue[]>;
  getIssuesByUser(userId: string): Promise<Issue[]>;
  getIssuesByOrg(orgName: string): Promise<Issue[]>;
  createIssue(issue: Omit<Issue, "id" | "createdAt" | "updatedAt">): Promise<Issue>;
  updateIssueStatus(id: string, status: string): Promise<Issue>;
  updateIssuePriority(id: string, priority: string): Promise<Issue>;
  assignIssue(id: string, orgName: string): Promise<Issue>;

  // Comment operations
  getComments(issueId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;

  // Organization operations
  getPredefinedOrganizations(): Promise<Organization[]>;
} 