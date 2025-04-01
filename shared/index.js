// Type definitions without database dependencies
// This file is used by the client to get type information

// Export all types from schema.js
export * from './schema.js';

// User interface
export const User = {};

// Issue interface
export const Issue = {};

// Comment interface
export const Comment = {};

// Schemas with parse and safeParse methods
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