import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Vite is conditionally imported based on environment
let vite: any = null;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Simplify the vite setup
    const viteRoot = path.resolve(process.cwd(), '..');
    
    // Skip vite in production
    if (process.env.NODE_ENV === 'production') {
      log('Running in production mode - skipping Vite setup');
      return;
    }
    
    log('Setting up Vite in development mode');
    log(`Vite root: ${viteRoot}`);

    // Simple file serving for frontend assets
    app.use(express.static(path.resolve(viteRoot, 'client')));
    
    // Default route to index.html
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(viteRoot, 'client', 'index.html'));
    });
    
    log('Vite setup complete (simplified mode)');
  } catch (error) {
    console.error("Failed to initialize Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), '..', "dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
