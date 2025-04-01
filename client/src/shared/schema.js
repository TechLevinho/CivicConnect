// Mock schema file to work around the import issue
// Import types from internal types folder

import {
  User,
  Issue,
  Comment,
  InsertUser,
  InsertIssue,
  InsertComment
} from "../types/schema";

// Re-export all types
export {
  User,
  Issue,
  Comment,
  InsertUser,
  InsertIssue,
  InsertComment
};

// Mock the schema functions
export const insertUserSchema = {
  parse: (data) => data,
  safeParse: (data) => ({ success: true, data }),
};

export const insertIssueSchema = {
  parse: (data) => data,
  safeParse: (data) => ({ success: true, data }),
};

export const insertCommentSchema = {
  parse: (data) => data,
  safeParse: (data) => ({ success: true, data }),
}; 