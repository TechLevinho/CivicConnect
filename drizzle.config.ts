import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "ep-aged-leaf-a8u33h3h-pooler.eastus2.azure.neon.tech",
    user: "neondb_owner",
    password: "npg_Mg4LCfaV8Nsw",
    database: "neondb",
    ssl: "require",
  },
  verbose: true,
  strict: true,
} satisfies Config;
