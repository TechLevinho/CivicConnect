import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const issueCategories = pgTable("issue_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
});
export const predefinedOrganizations = pgTable("predefined_organizations", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    categoryId: integer("category_id").notNull().references(() => issueCategories.id),
    description: text("description"),
});
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    organizationName: text("organization_name").references(() => predefinedOrganizations.name),
    isOrganization: boolean("is_organization").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
export const issues = pgTable("issues", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    latitude: text("latitude"),
    longitude: text("longitude"),
    status: text("status").default("open"),
    priority: text("priority").default("medium"),
    userId: integer("user_id").notNull().references(() => users.id),
    organizationName: text("organization_name").references(() => predefinedOrganizations.name),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    userId: integer("user_id").notNull().references(() => users.id),
    issueId: integer("issue_id").notNull().references(() => issues.id),
    createdAt: timestamp("created_at").defaultNow(),
});
export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    email: true,
    isOrganization: true,
    organizationName: true,
}).refine((data) => {
    if (data.isOrganization) {
        return !!data.organizationName;
    }
    return true;
}, {
    message: "Organization name is required when registering as an organization",
    path: ["organizationName"],
});
export const insertIssueSchema = createInsertSchema(issues).pick({
    title: true,
    description: true,
    location: true,
    latitude: true,
    longitude: true,
    priority: true,
    userId: true,
    organizationName: true,
});
export const insertCommentSchema = createInsertSchema(comments).pick({
    content: true,
    userId: true,
    issueId: true,
});
