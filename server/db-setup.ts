import { and, eq, isNull, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  locations,
  services,
  frames,
  blogPosts,
  testimonials,
  appointmentSlots,
} from "@shared/schema";
import {
  locationsSeed,
  servicesSeed,
  framesSeed,
  legacyFrameFixes,
  blogPostsSeed,
  testimonialsSeed,
  generateSlots,
} from "./seed-data";

/**
 * Idempotent schema for shared/schema.ts. Safe to run on every deploy:
 * creates what is missing and never drops or rewrites existing data.
 * When you add a column to shared/schema.ts, append an
 * "ALTER TABLE ... ADD COLUMN IF NOT EXISTS ..." line here.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "locations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "address" text NOT NULL,
    "city" text NOT NULL,
    "phone" text NOT NULL,
    "email" text NOT NULL,
    "opening_hours" text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "services" (
    "id" serial PRIMARY KEY NOT NULL,
    "name_en" text NOT NULL,
    "name_es" text NOT NULL,
    "description_en" text NOT NULL,
    "description_es" text NOT NULL,
    "icon" text NOT NULL,
    "price" integer,
    "duration_minutes" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "appointment_slots" (
    "id" serial PRIMARY KEY NOT NULL,
    "location_id" integer NOT NULL,
    "date" date NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "appointment_slots_location_date_start_idx"
    ON "appointment_slots" USING btree ("location_id","date","start_time")`,
  `CREATE TABLE IF NOT EXISTS "appointments" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "location_id" integer NOT NULL,
    "service_id" integer NOT NULL,
    "slot_id" integer NOT NULL,
    "date" date NOT NULL,
    "time" time NOT NULL,
    "comments" text,
    "wants_reminders" boolean DEFAULT false,
    "is_first_visit" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "frames" (
    "id" serial PRIMARY KEY NOT NULL,
    "name_en" text NOT NULL,
    "name_es" text NOT NULL,
    "style" text NOT NULL,
    "material" text NOT NULL,
    "color" text NOT NULL,
    "image_url" text NOT NULL,
    "price" integer,
    "is_available" boolean DEFAULT true NOT NULL
  )`,
  `ALTER TABLE "frames" ADD COLUMN IF NOT EXISTS "model_url" text`,
  `ALTER TABLE "frames" ADD COLUMN IF NOT EXISTS "model_rotation_y" real`,
  `CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" serial PRIMARY KEY NOT NULL,
    "title_en" text NOT NULL,
    "title_es" text NOT NULL,
    "content_en" text NOT NULL,
    "content_es" text NOT NULL,
    "image_url" text NOT NULL,
    "category_en" text NOT NULL,
    "category_es" text NOT NULL,
    "publish_date" date NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "comment_en" text NOT NULL,
    "comment_es" text NOT NULL,
    "rating" integer NOT NULL,
    "image_url" text,
    "is_approved" boolean DEFAULT false NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "subscriptions_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "location_id" integer,
    "message" text NOT NULL,
    "wants_newsletter" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
];

type Db = PgDatabase<any, any, any>;
type Log = (line: string) => void;

export async function migrate(db: Db, log: Log = console.log) {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(sql.raw(statement));
  }
  log(`- schema: ${SCHEMA_STATEMENTS.length} statements applied (idempotent)`);
}

/**
 * Keeps the try-on catalog in line with framesSeed without touching manual
 * edits: frames are identified by their 3D model.
 *  - a seed frame whose model isn't in the table yet is inserted;
 *  - the 3 original 3D frames get their real name/photo only while they still
 *    have the old stock photo;
 *  - frames without a 3D model are hidden (is_available = false, never
 *    deleted): they can't be tried on, so they don't belong in the catalog.
 */
export async function syncFrames(db: Db, log: Log = console.log) {
  const existing = new Set(
    (await db.select({ modelUrl: frames.modelUrl }).from(frames)).map((r) => r.modelUrl),
  );
  const missing = framesSeed.filter((f) => f.modelUrl && !existing.has(f.modelUrl));
  if (missing.length > 0) await db.insert(frames).values(missing);
  log(`- frames: inserted ${missing.length} new 3D frame(s)`);

  let fixed = 0;
  for (const fix of legacyFrameFixes) {
    const target = framesSeed.find((f) => f.modelUrl === fix.modelUrl);
    if (!target) continue;
    const rows = await db
      .update(frames)
      .set({
        nameEn: target.nameEn,
        nameEs: target.nameEs,
        style: target.style,
        material: target.material,
        color: target.color,
        imageUrl: target.imageUrl,
      })
      .where(and(eq(frames.modelUrl, fix.modelUrl), eq(frames.imageUrl, fix.legacyImageUrl)))
      .returning({ id: frames.id });
    fixed += rows.length;
  }
  log(`- frames: corrected ${fixed} legacy 3D frame(s)`);

  const hidden = await db
    .update(frames)
    .set({ isAvailable: false })
    .where(and(isNull(frames.modelUrl), eq(frames.isAvailable, true)))
    .returning({ id: frames.id });
  log(`- frames: hid ${hidden.length} frame(s) without a 3D model`);
}

/**
 * Loads the catalog only into empty tables, so edits made later in the
 * database (prices, new frames) are never overwritten by a redeploy.
 */
export async function seed(db: Db, log: Log = console.log) {
  const seedIfEmpty = async (name: string, table: any, rows: any[]) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
    if (count > 0) {
      log(`- ${name}: ${count} rows already, skipped`);
      return;
    }
    await db.insert(table).values(rows);
    log(`- ${name}: inserted ${rows.length}`);
  };

  await seedIfEmpty("locations", locations, locationsSeed);
  await seedIfEmpty("services", services, servicesSeed);
  await syncFrames(db, log);
  await seedIfEmpty("blog_posts", blogPosts, blogPostsSeed());
  await seedIfEmpty("testimonials", testimonials, testimonialsSeed);

  const locationIds = (await db.select({ id: locations.id }).from(locations)).map((l) => l.id);
  const slots = generateSlots(locationIds);
  if (slots.length > 0) {
    await db.insert(appointmentSlots).values(slots).onConflictDoNothing();
  }
  log(`- appointment_slots: ensured ${slots.length} for the next 14 days`);
}
