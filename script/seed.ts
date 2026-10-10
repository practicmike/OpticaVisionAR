// Loads the catalog into Postgres. Safe to re-run: tables that already have
// rows are skipped, and slots use ON CONFLICT DO NOTHING.
// Usage: DATABASE_URL=... npm run db:seed   (after npm run db:push)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import {
  locations,
  services,
  frames,
  blogPosts,
  testimonials,
  appointmentSlots,
} from "../shared/schema";
import {
  locationsSeed,
  servicesSeed,
  framesSeed,
  blogPostsSeed,
  testimonialsSeed,
  generateSlots,
} from "../server/seed-data";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const db = drizzle(neon(url));

async function seedIfEmpty(name: string, table: any, rows: any[]) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  if (count > 0) {
    console.log(`- ${name}: ${count} rows already, skipped`);
    return;
  }
  await db.insert(table).values(rows);
  console.log(`- ${name}: inserted ${rows.length}`);
}

await seedIfEmpty("locations", locations, locationsSeed);
await seedIfEmpty("services", services, servicesSeed);
await seedIfEmpty("frames", frames, framesSeed);
await seedIfEmpty("blog_posts", blogPosts, blogPostsSeed());
await seedIfEmpty("testimonials", testimonials, testimonialsSeed);

const locationIds = (await db.select({ id: locations.id }).from(locations)).map((l) => l.id);
const slots = generateSlots(locationIds);
await db.insert(appointmentSlots).values(slots).onConflictDoNothing();
console.log(`- appointment_slots: ensured ${slots.length} for the next 14 days`);
console.log("Seed complete.");
