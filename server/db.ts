import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// NEON_DATABASE_URL takes priority — Replit overrides DATABASE_URL in production
// with its own managed database. We use NEON_DATABASE_URL to connect to our own DB.
const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "NEON_DATABASE_URL (or DATABASE_URL) must be set.",
  );
}

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle({ client: pool, schema });
