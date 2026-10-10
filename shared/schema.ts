import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  openingHours: text("opening_hours").notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionEs: text("description_es").notNull(),
  icon: text("icon").notNull(),
  price: integer("price"),
  durationMinutes: integer("duration_minutes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

// Appointment slots
export const appointmentSlots = pgTable("appointment_slots", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).omit({
  id: true,
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  locationId: integer("location_id").notNull(),
  serviceId: integer("service_id").notNull(),
  slotId: integer("slot_id").notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  comments: text("comments"),
  wantsReminders: boolean("wants_reminders").default(false),
  isFirstVisit: boolean("is_first_visit").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

// Frames for virtual try-on
export const frames = pgTable("frames", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  style: text("style").notNull(),
  material: text("material").notNull(),
  color: text("color").notNull(),
  imageUrl: text("image_url").notNull(),
  price: integer("price"),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertFrameSchema = createInsertSchema(frames).omit({
  id: true,
});

// Blog posts
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es").notNull(),
  contentEn: text("content_en").notNull(),
  contentEs: text("content_es").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryEn: text("category_en").notNull(),
  categoryEs: text("category_es").notNull(),
  publishDate: date("publish_date").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
});

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  commentEn: text("comment_en").notNull(),
  commentEs: text("comment_es").notNull(),
  rating: integer("rating").notNull(),
  imageUrl: text("image_url"),
  isApproved: boolean("is_approved").notNull().default(false),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

// Subscriptions for newsletter
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

// Contact form messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  locationId: integer("location_id"),
  message: text("message").notNull(),
  wantsNewsletter: boolean("wants_newsletter").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

// Types for selection
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Frame = typeof frames.$inferSelect;
export type CatalogFrame = Frame & {
  modelUrl?: string;
  modelRotationY?: number;
};
export type InsertFrame = z.infer<typeof insertFrameSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
