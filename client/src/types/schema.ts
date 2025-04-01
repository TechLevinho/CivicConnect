// Interface definitions for the schema types without drizzle dependencies
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  organizationName?: string | null;
  isOrganization: boolean;
  createdAt: Date | null;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  status: string | null;
  priority: string | null;
  userId: number;
  organizationName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  issueId: number;
  createdAt: Date | null;
}

export interface InsertUser {
  username: string;
  password: string;
  email: string;
  isOrganization?: boolean;
  organizationName?: string;
}

export interface InsertIssue {
  title: string;
  description: string;
  location: string;
  latitude?: string;
  longitude?: string;
  priority?: string;
  userId: number;
  organizationName?: string;
}

export interface InsertComment {
  content: string;
  userId: number;
  issueId: number;
} 