import { 
  Location, InsertLocation, 
  Service, InsertService, 
  AppointmentSlot, InsertAppointmentSlot, 
  Appointment, InsertAppointment, 
  CatalogFrame,
  BlogPost, InsertBlogPost, 
  Testimonial, InsertTestimonial, 
  Subscription, InsertSubscription, 
  ContactMessage, InsertContactMessage 
} from "@shared/schema";
import {
  locationsSeed,
  servicesSeed,
  framesSeed,
  blogPostsSeed,
  testimonialsSeed,
  generateSlots,
} from "./seed-data";
import { DbStorage } from "./db-storage";

// Storage interface for the application
export interface IStorage {
  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;

  // Appointment slots
  getAppointmentSlots(locationId?: number, date?: string): Promise<AppointmentSlot[]>;
  getAppointmentSlot(id: number): Promise<AppointmentSlot | undefined>;
  createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot>;
  updateAppointmentSlotAvailability(id: number, isAvailable: boolean): Promise<AppointmentSlot | undefined>;

  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  /**
   * Books the slot and stores the appointment atomically.
   * Returns null when the slot was taken in the meantime.
   */
  createAppointment(appointment: InsertAppointment): Promise<Appointment | null>;

  // Frames
  getFrames(filters?: { style?: string; material?: string; color?: string }): Promise<CatalogFrame[]>;
  getFrame(id: number): Promise<CatalogFrame | undefined>;

  // Blog posts
  getBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;

  // Testimonials
  getTestimonials(approved?: boolean): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;

  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;

  // Contact messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private locations: Map<number, Location>;
  private services: Map<number, Service>;
  private appointmentSlots: Map<number, AppointmentSlot>;
  private appointments: Map<number, Appointment>;
  private frames: Map<number, CatalogFrame>;
  private blogPosts: Map<number, BlogPost>;
  private testimonials: Map<number, Testimonial>;
  private subscriptions: Map<number, Subscription>;
  private contactMessages: Map<number, ContactMessage>;
  private currentIds: {
    location: number;
    service: number;
    appointmentSlot: number;
    appointment: number;
    frame: number;
    blogPost: number;
    testimonial: number;
    subscription: number;
    contactMessage: number;
  };

  constructor() {
    this.locations = new Map();
    this.services = new Map();
    this.appointmentSlots = new Map();
    this.appointments = new Map();
    this.frames = new Map();
    this.blogPosts = new Map();
    this.testimonials = new Map();
    this.subscriptions = new Map();
    this.contactMessages = new Map();

    this.currentIds = {
      location: 1,
      service: 1,
      appointmentSlot: 1,
      appointment: 1,
      frame: 1,
      blogPost: 1,
      testimonial: 1,
      subscription: 1,
      contactMessage: 1,
    };

    // Initialize with sample data
    this.initSampleData();
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  // Appointment slots
  async getAppointmentSlots(locationId?: number, date?: string): Promise<AppointmentSlot[]> {
    const slots = Array.from(this.appointmentSlots.values());
    
    if (locationId && date) {
      return slots.filter(slot => 
        slot.locationId === locationId && 
        slot.date === date
      );
    } else if (locationId) {
      return slots.filter(slot => slot.locationId === locationId);
    } else if (date) {
      return slots.filter(slot => slot.date === date);
    }
    
    return slots;
  }

  async getAppointmentSlot(id: number): Promise<AppointmentSlot | undefined> {
    return this.appointmentSlots.get(id);
  }

  async createAppointmentSlot(slot: InsertAppointmentSlot): Promise<AppointmentSlot> {
    const id = this.currentIds.appointmentSlot++;
    const newSlot: AppointmentSlot = { ...slot, isAvailable: slot.isAvailable ?? true, id };
    this.appointmentSlots.set(id, newSlot);
    return newSlot;
  }

  async updateAppointmentSlotAvailability(id: number, isAvailable: boolean): Promise<AppointmentSlot | undefined> {
    const slot = this.appointmentSlots.get(id);
    if (!slot) return undefined;
    
    const updatedSlot = { ...slot, isAvailable };
    this.appointmentSlots.set(id, updatedSlot);
    return updatedSlot;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment | null> {
    const slot = this.appointmentSlots.get(appointment.slotId);
    if (!slot || !slot.isAvailable) return null;

    const id = this.currentIds.appointment++;
    const createdAt = new Date();
    const newAppointment: Appointment = {
      ...appointment,
      comments: appointment.comments ?? null,
      wantsReminders: appointment.wantsReminders ?? false,
      isFirstVisit: appointment.isFirstVisit ?? true,
      id,
      createdAt,
    };
    this.appointments.set(id, newAppointment);
    
    // Mark the appointment slot as unavailable
    await this.updateAppointmentSlotAvailability(appointment.slotId, false);
    
    return newAppointment;
  }

  // Frames
  async getFrames(filters?: { style?: string; material?: string; color?: string }): Promise<CatalogFrame[]> {
    let frames = Array.from(this.frames.values());
    
    if (filters) {
      if (filters.style && filters.style !== 'all') {
        frames = frames.filter(frame => frame.style === filters.style);
      }
      if (filters.material && filters.material !== 'all') {
        frames = frames.filter(frame => frame.material === filters.material);
      }
      if (filters.color && filters.color !== 'all') {
        frames = frames.filter(frame => frame.color === filters.color);
      }
    }
    
    return frames;
  }

  async getFrame(id: number): Promise<CatalogFrame | undefined> {
    return this.frames.get(id);
  }

  // Blog posts
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    const posts = Array.from(this.blogPosts.values());
    
    if (published !== undefined) {
      return posts.filter(post => post.isPublished === published);
    }
    
    return posts;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  // Testimonials
  async getTestimonials(approved?: boolean): Promise<Testimonial[]> {
    const testimonials = Array.from(this.testimonials.values());
    
    if (approved !== undefined) {
      return testimonials.filter(testimonial => testimonial.isApproved === approved);
    }
    
    return testimonials;
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.currentIds.testimonial++;
    const newTestimonial: Testimonial = {
      ...testimonial,
      imageUrl: testimonial.imageUrl ?? null,
      id,
      isApproved: false,
    };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    // Check if email already exists
    const existingEmail = Array.from(this.subscriptions.values())
      .find(sub => sub.email === subscription.email);
    
    if (existingEmail) {
      return existingEmail;
    }
    
    const id = this.currentIds.subscription++;
    const createdAt = new Date();
    const newSubscription: Subscription = { ...subscription, id, createdAt };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  // Contact messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = this.currentIds.contactMessage++;
    const createdAt = new Date();
    const newMessage: ContactMessage = {
      ...message,
      locationId: message.locationId ?? null,
      wantsNewsletter: message.wantsNewsletter ?? false,
      id,
      createdAt,
    };
    this.contactMessages.set(id, newMessage);
    
    // If the user wants to subscribe to the newsletter, create a subscription
    if (message.wantsNewsletter) {
      await this.createSubscription({ email: message.email });
    }
    
    return newMessage;
  }

  // Sample data initialization (same catalog the Postgres seed script uses)
  private initSampleData() {
    const withId = <T,>(items: T[], key: keyof MemStorage["currentIds"]) =>
      items.map((item) => ({ ...item, id: this.currentIds[key]++ }));

    withId(locationsSeed, "location").forEach((l) => this.locations.set(l.id, l as Location));
    withId(servicesSeed, "service").forEach((s) =>
      this.services.set(s.id, { price: null, isActive: true, ...s } as Service),
    );
    withId(
      generateSlots(Array.from(this.locations.keys())),
      "appointmentSlot",
    ).forEach((slot) => this.appointmentSlots.set(slot.id, slot as AppointmentSlot));
    withId(framesSeed, "frame").forEach((f) =>
      this.frames.set(f.id, { price: null, isAvailable: true, ...f } as CatalogFrame),
    );
    withId(blogPostsSeed(), "blogPost").forEach((p) =>
      this.blogPosts.set(p.id, { isPublished: true, ...p } as BlogPost),
    );
    withId(testimonialsSeed, "testimonial").forEach((t) =>
      this.testimonials.set(t.id, { imageUrl: null, ...t } as Testimonial),
    );
  }
}

/**
 * Production (Vercel) uses Postgres; serverless functions don't share memory,
 * so the in-memory store would lose bookings between requests.
 * Without DATABASE_URL (local dev) the in-memory store keeps working as before.
 */
export const storage: IStorage = process.env.DATABASE_URL
  ? new DbStorage(process.env.DATABASE_URL)
  : new MemStorage();
