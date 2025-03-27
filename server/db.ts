import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Configure NeonDB to use WebSockets
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to create the .env file?");
}

// Create a connection pool with SSL enabled
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Required for NeonDB
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });
