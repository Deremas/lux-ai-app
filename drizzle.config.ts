// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env.local" });

const url =
  process.env.DATABASE_MIGRATE_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!url) throw new Error("Missing DATABASE_MIGRATE_URL or DATABASE_URL");

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
