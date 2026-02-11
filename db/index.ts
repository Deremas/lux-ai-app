// db/index.ts
import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL");

const rawDb = drizzle(neon(url));
const rawSelect = rawDb.select.bind(rawDb);

export const db = Object.assign(rawDb, {
  select: (fields?: Parameters<typeof rawSelect>[0]) => {
    if (!fields && process.env.NODE_ENV !== "production") {
      // Helps locate lingering db.select() calls without fields in dev.
      console.error("db.select called without fields", new Error().stack);
    }
    return rawSelect(fields as Parameters<typeof rawSelect>[0]);
  },
});
