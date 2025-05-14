// Interface definitions for Firestore collections
export interface User {
  id?: string;
  uid: string;
  name: string;
  email: string;
  isOrganization: boolean;
  phoneNumber?: string | null;
  createdAt: Date | null;
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
  createdAt: Date | null;
}

export interface Issue {
  id?: string;
  title: string;
  description: string;
  imageURL?: string | null;
  location: any; // String or GeoPoint
  userId: string; // User uid (creator)
  assignedTo?: string | null; // Organization uid
  status: string;
  severity: string;
  createdAt: Date | null;
}

export interface Comment {
  id?: string;
  content: string;
  userId: string; // User uid
  issueId: string; // Issue id
  createdAt: Date | null;
}

// Create/update interfaces
export interface CreateUserInput {
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface CreateOrganizationInput {
  name: string;
  department_type: string;
  email: string;
  location?: any;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  location: string;
  imageURL?: string;
  severity?: string;
  assignedTo?: string;
}

export interface CreateCommentInput {
  content: string;
  issueId: string;
} 