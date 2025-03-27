import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isOrganization: boolean("is_organization").notNull().default(false),
  organizationName: text("organization_name"),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>(),
  category: text("category").notNull(),
  status: text("status").notNull().default("reported"),
  priority: text("priority").notNull().default("medium"),
  userId: integer("user_id").notNull(),
  assignedOrgId: integer("assigned_org_id"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  issueId: integer("issue_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isOrganization: true,
  organizationName: true,
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  title: true,
  description: true,
  location: true,
  coordinates: true,
  category: true,
  userId: true,
  imageUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  issueId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type User = typeof users.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type Comment = typeof comments.$inferSelect;