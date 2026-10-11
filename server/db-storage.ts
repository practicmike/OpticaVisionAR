import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import {
  locations,
  services,
  appointmentSlots,
  appointments,
  frames,
  blogPosts,
  testimonials,
  subscriptions,
  contactMessages,
  type Location,
  type Service,
  type AppointmentSlot,
  type InsertAppointmentSlot,
  type Appointment,
  type InsertAppointment,
  type CatalogFrame,
  type BlogPost,
  type Testimonial,
  type InsertTestimonial,
  type Subscription,
  type InsertSubscription,
  type ContactMessage,
  type InsertContactMessage,
} from "@shared/schema";
import type { IStorage } from "./storage";
import { BOOKING_WINDOW_DAYS, businessDate, generateSlots } from "./seed-data";

// Postgres returns TIME as "09:00:00"; the client and in-memory store use "09:00".
const hhmm = (value: string) => value.slice(0, 5);
const normalizeSlot = (slot: AppointmentSlot): AppointmentSlot => ({
  ...slot,
  startTime: hhmm(slot.startTime),
  endTime: hhmm(slot.endTime),
});

const ensureCheckIntervalMs = 10 * 60 * 1000;

export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  // Per warm instance; avoids re-checking the slot window on every request.
  private slotsEnsuredAt = 0;

  // Accepts a connection string (production) or a ready Drizzle instance
  // (tests / other Postgres drivers using the same query builder).
  constructor(databaseUrlOrDb: string | ReturnType<typeof drizzle>) {
    this.db = typeof databaseUrlOrDb === "string" ? drizzle(neon(databaseUrlOrDb)) : databaseUrlOrDb;
  }

  // The booking window rolls forward every day. Instead of a cron job, the
  // next 14 days of slots are created on demand; the unique index on
  // (location, date, start) makes this idempotent and safe under concurrency.
  private async ensureSlotWindow() {
    if (Date.now() - this.slotsEnsuredAt < ensureCheckIntervalMs) return;
    const locationIds = (await this.db.select({ id: locations.id }).from(locations)).map((l) => l.id);
    const slots = generateSlots(locationIds);
    if (slots.length > 0) {
      await this.db.insert(appointmentSlots).values(slots).onConflictDoNothing();
    }
    this.slotsEnsuredAt = Date.now();
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return this.db.select().from(locations).orderBy(asc(locations.id));
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [row] = await this.db.select().from(locations).where(eq(locations.id, id));
    return row;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.db.select().from(services).orderBy(asc(services.id));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [row] = await this.db.select().from(services).where(eq(services.id, id));
    return row;
  }

  // Appointment slots (only the current booking window is exposed)
  async getAppointmentSlots(locationId?: number, date?: string): Promise<AppointmentSlot[]> {
    await this.ensureSlotWindow();
    const conditions = [
      gte(appointmentSlots.date, businessDate(0)),
      lte(appointmentSlots.date, businessDate(BOOKING_WINDOW_DAYS)),
    ];
    if (locationId) conditions.push(eq(appointmentSlots.locationId, locationId));
    if (date) conditions.push(eq(appointmentSlots.date, date));

    const rows = await this.db
      .select()
      .from(appointmentSlots)
      .where(and(...conditions))
      .orderBy(asc(appointmentSlots.date), asc(appointmentSlots.startTime));
    return rows.map(normalizeSlot);
  }

  async getAppointmentSlot(id: number): Promise<AppointmentSlot | undefined> {
    const [row] = await this.db.select().from(appointmentSlots).where(eq(appointmentSlots.id, id));
    return row ? normalizeSlot(row) : undefined;
  }

  async createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot> {
    const [row] = await this.db.insert(appointmentSlots).values(slot).returning();
    return normalizeSlot(row);
  }

  async updateAppointmentSlotAvailability(id: number, isAvailable: boolean): Promise<AppointmentSlot | undefined> {
    const [row] = await this.db
      .update(appointmentSlots)
      .set({ isAvailable })
      .where(eq(appointmentSlots.id, id))
      .returning();
    return row ? normalizeSlot(row) : undefined;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return this.db.select().from(appointments).orderBy(asc(appointments.id));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [row] = await this.db.select().from(appointments).where(eq(appointments.id, id));
    return row;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment | null> {
    // Claim the slot with a conditional update: of two simultaneous requests
    // for the same slot, only one gets a row back. (The HTTP driver has no
    // interactive transactions, so this compare-and-set is the lock.)
    const [claimed] = await this.db
      .update(appointmentSlots)
      .set({ isAvailable: false })
      .where(and(eq(appointmentSlots.id, appointment.slotId), eq(appointmentSlots.isAvailable, true)))
      .returning({ id: appointmentSlots.id });
    if (!claimed) return null;

    try {
      const [row] = await this.db.insert(appointments).values(appointment).returning();
      return row;
    } catch (error) {
      // Release the slot so it isn't lost if the insert fails.
      await this.updateAppointmentSlotAvailability(appointment.slotId, true);
      throw error;
    }
  }

  // Frames
  async getFrames(filters?: { style?: string; material?: string; color?: string }): Promise<CatalogFrame[]> {
    const conditions = [eq(frames.isAvailable, true)];
    if (filters?.style && filters.style !== "all") conditions.push(eq(frames.style, filters.style));
    if (filters?.material && filters.material !== "all") conditions.push(eq(frames.material, filters.material));
    if (filters?.color && filters.color !== "all") conditions.push(eq(frames.color, filters.color));
    return this.db
      .select()
      .from(frames)
      .where(and(...conditions))
      .orderBy(asc(frames.id));
  }

  async getFrame(id: number): Promise<CatalogFrame | undefined> {
    const [row] = await this.db.select().from(frames).where(eq(frames.id, id));
    return row;
  }

  // Blog posts
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    return this.db
      .select()
      .from(blogPosts)
      .where(published === undefined ? undefined : eq(blogPosts.isPublished, published))
      .orderBy(asc(blogPosts.id));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [row] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return row;
  }

  // Testimonials
  async getTestimonials(approved?: boolean): Promise<Testimonial[]> {
    return this.db
      .select()
      .from(testimonials)
      .where(approved === undefined ? undefined : eq(testimonials.isApproved, approved))
      .orderBy(asc(testimonials.id));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [row] = await this.db
      .insert(testimonials)
      .values({ ...testimonial, isApproved: false })
      .returning();
    return row;
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [inserted] = await this.db
      .insert(subscriptions)
      .values(subscription)
      .onConflictDoNothing({ target: subscriptions.email })
      .returning();
    if (inserted) return inserted;
    const [existing] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, subscription.email));
    return existing;
  }

  // Contact messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [row] = await this.db.insert(contactMessages).values(message).returning();
    if (message.wantsNewsletter) {
      await this.createSubscription({ email: message.email });
    }
    return row;
  }
}
