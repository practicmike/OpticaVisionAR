// Creates/updates the tables and loads the catalog into Postgres.
// Runs automatically in every Vercel build (script/build-vercel.mjs) when
// DATABASE_URL is available. Safe to re-run: nothing is dropped or duplicated.
// Manual use: DATABASE_URL=... npm run db:setup
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate, seed } from "../server/db-setup";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle(neon(url));
await migrate(db);
await seed(db);
console.log("Database ready.");
