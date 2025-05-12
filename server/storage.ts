import { 
  Location, InsertLocation, 
  Service, InsertService, 
  AppointmentSlot, InsertAppointmentSlot, 
  Appointment, InsertAppointment, 
  Frame, InsertFrame, 
  BlogPost, InsertBlogPost, 
  Testimonial, InsertTestimonial, 
  Subscription, InsertSubscription, 
  ContactMessage, InsertContactMessage 
} from "@shared/schema";

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
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;

  // Frames
  getFrames(filters?: { style?: string; material?: string; color?: string }): Promise<Frame[]>;
  getFrame(id: number): Promise<Frame | undefined>;

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
  private frames: Map<number, Frame>;
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
    const newSlot: AppointmentSlot = { ...slot, id };
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

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointment++;
    const createdAt = new Date();
    const newAppointment: Appointment = { ...appointment, id, createdAt };
    this.appointments.set(id, newAppointment);
    
    // Mark the appointment slot as unavailable
    await this.updateAppointmentSlotAvailability(appointment.slotId, false);
    
    return newAppointment;
  }

  // Frames
  async getFrames(filters?: { style?: string; material?: string; color?: string }): Promise<Frame[]> {
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

  async getFrame(id: number): Promise<Frame | undefined> {
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
    const newTestimonial: Testimonial = { ...testimonial, id };
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
    const newMessage: ContactMessage = { ...message, id, createdAt };
    this.contactMessages.set(id, newMessage);
    
    // If the user wants to subscribe to the newsletter, create a subscription
    if (message.wantsNewsletter) {
      await this.createSubscription({ email: message.email });
    }
    
    return newMessage;
  }

  // Sample data initialization
  private initSampleData() {
    // Locations
    const locations: Location[] = [
      {
        id: this.currentIds.location++,
        name: "Irapuato Centro",
        address: "Av. Revolución 123, Centro",
        city: "Irapuato",
        phone: "(462) 123-4567",
        email: "irapuato@opticascardani.com",
        openingHours: "Lun - Vie: 9:00 - 19:00, Sáb: 9:00 - 14:00",
      },
      {
        id: this.currentIds.location++,
        name: "Abasolo",
        address: "Calle Hidalgo 456, Centro",
        city: "Abasolo",
        phone: "(429) 987-6543",
        email: "abasolo@opticascardani.com",
        openingHours: "Lun - Vie: 9:00 - 18:00, Sáb: 9:00 - 14:00",
      },
    ];
    
    locations.forEach(location => this.locations.set(location.id, location));

    // Services
    const services: Service[] = [
      {
        id: this.currentIds.service++,
        nameEn: "Comprehensive Eye Exam",
        nameEs: "Examen Visual Completo",
        descriptionEn: "Complete evaluation of your visual health with latest generation equipment.",
        descriptionEs: "Evaluación completa de su salud visual con equipos de última generación.",
        icon: "eye",
        price: 45000,
        durationMinutes: 45,
        isActive: true,
      },
      {
        id: this.currentIds.service++,
        nameEn: "Frame Adjustment",
        nameEs: "Ajuste de Armazones",
        descriptionEn: "Adjustment service for your glasses for optimal comfort.",
        descriptionEs: "Servicio de ajuste para sus lentes para una comodidad óptima.",
        icon: "glasses",
        price: 0,
        durationMinutes: 15,
        isActive: true,
      },
      {
        id: this.currentIds.service++,
        nameEn: "Contact Lens Fitting",
        nameEs: "Adaptación de Lentes de Contacto",
        descriptionEn: "Professional fitting of contact lenses with follow-up care.",
        descriptionEs: "Adaptación profesional de lentes de contacto con seguimiento.",
        icon: "eye",
        price: 35000,
        durationMinutes: 30,
        isActive: true,
      },
      {
        id: this.currentIds.service++,
        nameEn: "Eye Pressure Test",
        nameEs: "Prueba de Presión Ocular",
        descriptionEn: "Test to measure intraocular pressure to detect glaucoma.",
        descriptionEs: "Prueba para medir la presión intraocular para detectar glaucoma.",
        icon: "user-md",
        price: 25000,
        durationMinutes: 20,
        isActive: true,
      },
    ];
    
    services.forEach(service => this.services.set(service.id, service));

    // Generate appointment slots for the next 14 days
    this.generateAppointmentSlots();
    
    // Frames
    const frames: Frame[] = [
      {
        id: this.currentIds.frame++,
        nameEn: "Urban Model",
        nameEs: "Modelo Urbano",
        style: "Rectangle",
        material: "Acetate",
        color: "Black",
        imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371",
        price: 189900,
        isAvailable: true,
      },
      {
        id: this.currentIds.frame++,
        nameEn: "Carey Model",
        nameEs: "Modelo Carey",
        style: "Oval",
        material: "Acetate",
        color: "Brown",
        imageUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67",
        price: 199900,
        isAvailable: true,
      },
      {
        id: this.currentIds.frame++,
        nameEn: "Eco Model",
        nameEs: "Modelo Eco",
        style: "Rectangle",
        material: "Metal",
        color: "Gold",
        imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666",
        price: 169900,
        isAvailable: true,
      },
      {
        id: this.currentIds.frame++,
        nameEn: "Vintage Model",
        nameEs: "Modelo Vintage",
        style: "Round",
        material: "Metal",
        color: "Blue",
        imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a",
        price: 219900,
        isAvailable: true,
      },
      {
        id: this.currentIds.frame++,
        nameEn: "Crystal Model",
        nameEs: "Modelo Crystal",
        style: "Rectangle",
        material: "Acetate",
        color: "Transparent",
        imageUrl: "https://pixabay.com/get/g4a8cb69353c1e3f706088544b4693dfee68de21385c0ad7b4586b533b4aa2d340339df76b64fe090079d702baacb9146796a04c20fcc12d021c0ca6a579fc85d_1280.png",
        price: 179900,
        isAvailable: true,
      },
      {
        id: this.currentIds.frame++,
        nameEn: "Feline Model",
        nameEs: "Modelo Felino",
        style: "Cat-eye",
        material: "Acetate",
        color: "Red",
        imageUrl: "https://images.unsplash.com/photo-1586942593568-29361efcd571",
        price: 229900,
        isAvailable: true,
      },
    ];
    
    frames.forEach(frame => this.frames.set(frame.id, frame));

    // Blog posts
    const currentDate = new Date();
    const blogPosts: BlogPost[] = [
      {
        id: this.currentIds.blogPost++,
        titleEn: "Warning signs that indicate vision problems",
        titleEs: "Signos de alerta que indican problemas de visión",
        contentEn: "Learn to identify early signs that may indicate you need ophthalmological attention and how to act on time.",
        contentEs: "Aprenda a identificar las señales tempranas que pueden indicar que necesita atención oftalmológica y cómo actuar a tiempo.",
        imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144",
        categoryEn: "Health",
        categoryEs: "Salud",
        publishDate: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        isPublished: true,
      },
      {
        id: this.currentIds.blogPost++,
        titleEn: "Frame trends for this season",
        titleEs: "Tendencias en armazones para esta temporada",
        contentEn: "Discover the styles, colors, and designs that are trending this year in the world of optics.",
        contentEs: "Descubra los estilos, colores y diseños que están marcando tendencia este año en el mundo de la óptica.",
        imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371",
        categoryEn: "Trends",
        categoryEs: "Tendencias",
        publishDate: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        isPublished: true,
      },
      {
        id: this.currentIds.blogPost++,
        titleEn: "How to protect your eyes from blue light",
        titleEs: "Cómo proteger sus ojos de la luz azul",
        contentEn: "Practical tips to reduce visual fatigue caused by prolonged use of electronic devices in the digital era.",
        contentEs: "Tips prácticos para reducir la fatiga visual causada por el uso prolongado de dispositivos electrónicos en la era digital.",
        imageUrl: "https://images.unsplash.com/photo-1585909695284-32d2985ac9c0",
        categoryEn: "Tips",
        categoryEs: "Consejos",
        publishDate: new Date(currentDate.getTime() - 17 * 24 * 60 * 60 * 1000),
        isPublished: true,
      },
    ];
    
    blogPosts.forEach(post => this.blogPosts.set(post.id, post));

    // Testimonials
    const testimonials: Testimonial[] = [
      {
        id: this.currentIds.testimonial++,
        name: "Laura Méndez",
        commentEn: "The service was excellent, they attended me very quickly and the doctor was very professional. The frames are of very good quality.",
        commentEs: "El servicio fue excelente, me atendieron muy rápido y el doctor fue muy profesional. Los armazones son de muy buena calidad.",
        rating: 5,
        imageUrl: undefined,
        isApproved: true,
      },
      {
        id: this.currentIds.testimonial++,
        name: "Carlos Rodríguez",
        commentEn: "The virtual try-on helped me choose the perfect frame before going to the store. The process was very easy and fun.",
        commentEs: "La prueba virtual me ayudó a elegir el armazón perfecto antes de ir a la tienda. El proceso fue muy fácil y divertido.",
        rating: 4,
        imageUrl: undefined,
        isApproved: true,
      },
      {
        id: this.currentIds.testimonial++,
        name: "Elena Gutiérrez",
        commentEn: "I've been a customer of Ópticas Cardani for years and I always find what I'm looking for. Their attention and professionalism make me come back.",
        commentEs: "Llevo años siendo cliente de Ópticas Cardani y siempre encuentro lo que busco. Su atención y profesionalismo me hacen regresar.",
        rating: 5,
        imageUrl: undefined,
        isApproved: true,
      },
    ];
    
    testimonials.forEach(testimonial => this.testimonials.set(testimonial.id, testimonial));
  }

  // Helper to generate appointment slots
  private generateAppointmentSlots() {
    const locationIds = [1, 2]; // Irapuato and Abasolo
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // Generate slots for next 14 days
    
    const timeSlots = [
      { start: "09:00", end: "09:45" },
      { start: "10:00", end: "10:45" },
      { start: "11:00", end: "11:45" },
      { start: "12:00", end: "12:45" },
      { start: "13:00", end: "13:45" },
      { start: "16:00", end: "16:45" },
      { start: "17:00", end: "17:45" },
    ];
    
    // Loop through each location
    for (const locationId of locationIds) {
      // Loop through each day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip Sundays
        if (d.getDay() === 0) continue;
        
        // Skip Saturday afternoons
        const isSaturday = d.getDay() === 6;
        
        // Create slots for this day
        for (const timeSlot of timeSlots) {
          // Skip afternoon slots on Saturdays
          if (isSaturday && parseInt(timeSlot.start.split(':')[0]) >= 14) continue;
          
          const dateStr = this.formatDate(d);
          const slot: AppointmentSlot = {
            id: this.currentIds.appointmentSlot++,
            locationId,
            date: dateStr,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            isAvailable: true,
          };
          
          this.appointmentSlots.set(slot.id, slot);
        }
      }
    }
  }

  // Helper to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const storage = new MemStorage();
