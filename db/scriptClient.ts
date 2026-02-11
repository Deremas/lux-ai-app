// db/scriptClient.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const connectionString =
  process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_POOL_URL or DATABASE_URL in .env");
}

const sql = postgres(connectionString, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
});

export const db = drizzle(sql);
