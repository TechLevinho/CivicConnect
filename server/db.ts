import dotenv from "dotenv";
import { getDatabase } from "./db/index";

// Load environment variables from .env
dotenv.config();

// Export the database adapter
export const db = getDatabase();
