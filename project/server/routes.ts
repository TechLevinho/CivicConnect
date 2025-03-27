import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertIssueSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Issue routes
  app.get("/api/issues", async (req, res) => {
    try {
      const issues = await storage.getIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/issues/user/:userId", async (req, res) => {
    try {
      const issues = await storage.getIssuesByUser(parseInt(req.params.userId));
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/issues/org/:orgId", async (req, res) => {
    try {
      const issues = await storage.getIssuesByOrg(parseInt(req.params.orgId));
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/issues", async (req, res) => {
    try {
      const issueData = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(issueData);
      res.json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.patch("/api/issues/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const issue = await storage.updateIssueStatus(parseInt(req.params.id), status);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/issues/:id/priority", async (req, res) => {
    try {
      const { priority } = req.body;
      const issue = await storage.updateIssuePriority(parseInt(req.params.id), priority);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/issues/:id/assign", async (req, res) => {
    try {
      const { orgId } = req.body;
      const issue = await storage.assignIssue(parseInt(req.params.id), orgId);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Comment routes
  app.get("/api/issues/:issueId/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(parseInt(req.params.issueId));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
