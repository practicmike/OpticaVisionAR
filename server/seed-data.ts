import type {
  InsertLocation,
  InsertService,
  InsertFrame,
  InsertBlogPost,
  InsertTestimonial,
  InsertAppointmentSlot,
} from "@shared/schema";
import { BUSINESS, OPENING_HOURS, WEEK_ORDER, formatHour12, slotTemplateFor } from "@shared/business";

const DAY_ABBR_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const OPENING_HOURS_TEXT = WEEK_ORDER.map((d) => {
  const h = OPENING_HOURS[d];
  return `${DAY_ABBR_ES[d]}: ${h ? `${formatHour12(h.open)} – ${formatHour12(h.close)}` : "Cerrado"}`;
}).join(", ");

/**
 * Seed/catalog data shared by the in-memory store (local dev) and the
 * Postgres seed script (production). Ids are assigned by each store.
 */

// All business dates are computed in the stores' timezone, not the server's
// (Vercel functions run in UTC, which would shift "today" after 6 pm).
export const BUSINESS_TIMEZONE = "America/Mexico_City";
export const BOOKING_WINDOW_DAYS = 14;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for "today + offset days" in the business timezone. */
export const businessDate = (offsetDays = 0): string => {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return dateFormatter.format(now);
};

const daysAgo = (days: number): string => businessDate(-days);

// Real data lives in shared/business.ts; the single branch is Abasolo.
export const locationsSeed: InsertLocation[] = [
  {
    name: "Abasolo",
    address: BUSINESS.address,
    city: BUSINESS.city,
    phone: BUSINESS.phoneDisplay,
    email: BUSINESS.email,
    openingHours: OPENING_HOURS_TEXT,
    isActive: true,
  },
];

// The four services the clinic offers. Prices aren't published (null).
export const servicesSeed: InsertService[] = [
  {
    nameEn: "Full Eye Exam (Adults)",
    nameEs: "Examen Visual Completo (Adultos)",
    descriptionEn: "A full visual health assessment for adults, including detection of refractive errors (myopia, hyperopia, astigmatism) and personalized recommendations.",
    descriptionEs: "Evaluación integral de la salud visual, detección de problemas refractivos (miopía, hipermetropía, astigmatismo) y recomendaciones personalizadas.",
    icon: "eye",
    price: null,
    durationMinutes: 45,
    isActive: true,
    requiresAppointment: true,
  },
  {
    nameEn: "Full Eye Exam (Children under 10)",
    nameEs: "Examen Visual Completo (niños menores de 10 años)",
    descriptionEn: "A specialized exam for children under 10 to assess visual development, eye coordination, and detect early warning signs.",
    descriptionEs: "Examen especializado para niños pequeños que evalúa su desarrollo visual, coordinación ocular y posibles señales de alerta temprana.",
    icon: "child",
    price: null,
    durationMinutes: 45,
    isActive: true,
    requiresAppointment: true,
  },
  {
    nameEn: "Contact Lens Fitting",
    nameEs: "Adaptación de Lentes de Contacto",
    descriptionEn: "Includes corneal evaluation, lens testing, and follow-up to ensure comfort and proper vision using contact lenses.",
    descriptionEs: "Incluye evaluación de la córnea, prueba de lentes y seguimiento para asegurar la comodidad y buena visión con lentes de contacto.",
    icon: "contact",
    price: null,
    durationMinutes: 45,
    isActive: true,
    requiresAppointment: true,
  },
  {
    nameEn: "Frame Adjustments",
    nameEs: "Ajuste de Armazones",
    descriptionEn: "Free walk-in service. Visit us during business hours for expert frame adjustments.",
    descriptionEs: "Servicio gratuito sin necesidad de cita. Visítanos en horario abierto para ajustes profesionales de tus armazones.",
    icon: "glasses",
    price: 0,
    durationMinutes: 15,
    isActive: true,
    requiresAppointment: false,
  },
];

/**
 * Placeholder data from the first version of the site, still present in the
 * production database. Rows are corrected only while they keep the old
 * placeholder values, so later manual edits are never overwritten.
 */
export const legacyBusinessFixes = {
  // Fake Irapuato branch -> hidden; fake Abasolo address -> real data.
  hideLocationsWithAddress: ["Av. Revolución 123, Centro"],
  realLocationWhereAddress: "Calle Hidalgo 456, Centro",
  // Old service (matched by Spanish name + old description) -> real service.
  services: [
    { oldNameEs: "Examen Visual Completo", oldDescriptionEs: "Evaluación completa de su salud visual con equipos de última generación.", newNameEs: "Examen Visual Completo (Adultos)" },
    { oldNameEs: "Ajuste de Armazones", oldDescriptionEs: "Servicio de ajuste para sus lentes para una comodidad óptima.", newNameEs: "Ajuste de Armazones" },
    { oldNameEs: "Adaptación de Lentes de Contacto", oldDescriptionEs: "Adaptación profesional de lentes de contacto con seguimiento.", newNameEs: "Adaptación de Lentes de Contacto" },
  ],
  // Not offered by the clinic -> hidden (kept for past appointments).
  hideServicesNamedEs: ["Prueba de Presión Ocular"],
  // Invented testimonials from the template -> unpublished.
  unpublishTestimonials: [
    { name: "Laura Méndez", startsWith: "El servicio fue excelente" },
    { name: "Carlos Rodríguez", startsWith: "La prueba virtual me ayudó" },
    { name: "Elena Gutiérrez", startsWith: "Llevo años siendo cliente" },
  ],
};

/**
 * Try-on catalog: only frames with a real 3D model. Photos are renders of
 * the same model (client/public/frames/thumbs), so the card shows exactly
 * what the customer will try on. Each frame is identified by its modelUrl.
 * Prices are in cents (MXN).
 */
export const framesSeed: InsertFrame[] = [
  {
    nameEn: "Black Half-Rim",
    nameEs: "Media Montura Negro",
    style: "Rectangle",
    material: "Metal",
    color: "Black",
    imageUrl: "/frames/thumbs/0_00741558210359.jpg",
    modelUrl: "/frames/models/0_00741558210359.glb",
    modelRotationY: null,
    price: 239900,
    isAvailable: true,
  },
  {
    nameEn: "Classic Gray Sun",
    nameEs: "Solar Clásico Gris",
    style: "Sunglasses",
    material: "Acetate",
    color: "Brown",
    imageUrl: "/frames/thumbs/1_sun_glasses.jpg",
    modelUrl: "/frames/models/1_sun_glasses.glb",
    modelRotationY: null,
    price: 229900,
    isAvailable: true,
  },
  {
    nameEn: "Black Executive",
    nameEs: "Ejecutivo Negro",
    style: "Rectangle",
    material: "Acetate",
    color: "Black",
    imageUrl: "/frames/thumbs/2_glasses.jpg",
    modelUrl: "/frames/models/2_glasses.glb",
    modelRotationY: -Math.PI / 2,
    price: 249900,
    isAvailable: true,
  },
  {
    nameEn: "Black Wayfarer Sun",
    nameEs: "Wayfarer Solar Negro",
    style: "Wayfarer",
    material: "Acetate",
    color: "Black",
    imageUrl: "/frames/thumbs/wayfarer_negro_humo.jpg",
    modelUrl: "/frames/models/wayfarer_negro_humo.glb",
    modelRotationY: null,
    price: 219900,
    isAvailable: true,
  },
  {
    nameEn: "Tortoise Wayfarer Sun",
    nameEs: "Wayfarer Solar Carey",
    style: "Wayfarer",
    material: "Acetate",
    color: "Tortoise",
    imageUrl: "/frames/thumbs/wayfarer_carey_cafe.jpg",
    modelUrl: "/frames/models/wayfarer_carey_cafe.glb",
    modelRotationY: null,
    price: 229900,
    isAvailable: true,
  },
  {
    nameEn: "Wine Wayfarer Sun",
    nameEs: "Wayfarer Solar Vino",
    style: "Wayfarer",
    material: "Acetate",
    color: "Red",
    imageUrl: "/frames/thumbs/wayfarer_vino_verde.jpg",
    modelUrl: "/frames/models/wayfarer_vino_verde.glb",
    modelRotationY: null,
    price: 219900,
    isAvailable: true,
  },
  {
    nameEn: "Navy Wayfarer",
    nameEs: "Wayfarer Azul Marino",
    style: "Wayfarer",
    material: "Acetate",
    color: "Blue",
    imageUrl: "/frames/thumbs/wayfarer_azul_marino_cristal.jpg",
    modelUrl: "/frames/models/wayfarer_azul_marino_cristal.glb",
    modelRotationY: null,
    price: 219900,
    isAvailable: true,
  },
];

/**
 * Rows that already exist in production with placeholder names and stock
 * photos of other frames. They are corrected only while the row still has
 * the old photo, so any later manual edit in the database is respected.
 */
export const legacyFrameFixes: { modelUrl: string; legacyImageUrl: string }[] = [
  { modelUrl: "/frames/models/0_00741558210359.glb", legacyImageUrl: "/frames/black-titanium-front.jpg" },
  { modelUrl: "/frames/models/1_sun_glasses.glb", legacyImageUrl: "/frames/photo-1473496169904-658ba7c44d8a.jpg" },
  { modelUrl: "/frames/models/2_glasses.glb", legacyImageUrl: "/frames/photo-1574258495973-f010dfbb5371.jpg" },
];

export const blogPostsSeed = (): InsertBlogPost[] => [
  {
    titleEn: "Warning signs that indicate vision problems",
    titleEs: "Signos de alerta que indican problemas de visión",
    contentEn: "Learn to identify early signs that may indicate you need ophthalmological attention and how to act on time.",
    contentEs: "Aprenda a identificar las señales tempranas que pueden indicar que necesita atención oftalmológica y cómo actuar a tiempo.",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144",
    categoryEn: "Health",
    categoryEs: "Salud",
    publishDate: daysAgo(3),
    isPublished: true,
  },
  {
    titleEn: "Frame trends for this season",
    titleEs: "Tendencias en armazones para esta temporada",
    contentEn: "Discover the styles, colors, and designs that are trending this year in the world of optics.",
    contentEs: "Descubra los estilos, colores y diseños que están marcando tendencia este año en el mundo de la óptica.",
    imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371",
    categoryEn: "Trends",
    categoryEs: "Tendencias",
    publishDate: daysAgo(10),
    isPublished: true,
  },
  {
    titleEn: "How to protect your eyes from blue light",
    titleEs: "Cómo proteger sus ojos de la luz azul",
    contentEn: "Practical tips to reduce visual fatigue caused by prolonged use of electronic devices in the digital era.",
    contentEs: "Tips prácticos para reducir la fatiga visual causada por el uso prolongado de dispositivos electrónicos en la era digital.",
    imageUrl: "https://images.unsplash.com/photo-1585909695284-32d2985ac9c0",
    categoryEn: "Tips",
    categoryEs: "Consejos",
    publishDate: daysAgo(17),
    isPublished: true,
  },
];

/**
 * No testimonials are seeded: reviews shown on the site must come from real
 * customers (approved in the database). The section hides itself when empty.
 */
export const testimonialsSeed: (InsertTestimonial & { isApproved: boolean })[] = [];

/**
 * Slots for the rolling booking window, following the real opening hours
 * (shared/business.ts). Deterministic, so it can be re-run safely (the DB
 * has a unique index on location/date/start time).
 */
export const generateSlots = (locationIds: number[]): InsertAppointmentSlot[] => {
  const slots: InsertAppointmentSlot[] = [];
  for (let offset = 0; offset <= BOOKING_WINDOW_DAYS; offset++) {
    const date = businessDate(offset);
    // Noon UTC avoids any DST edge when reading the weekday back.
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    for (const locationId of locationIds) {
      for (const slot of slotTemplateFor(weekday)) {
        slots.push({ locationId, date, startTime: slot.start, endTime: slot.end, isAvailable: true });
      }
    }
  }
  return slots;
};

/** True when a slot's start time is part of the real schedule for its day. */
export const slotMatchesSchedule = (slot: { date: string; startTime: string }) => {
  const weekday = new Date(`${slot.date}T12:00:00Z`).getUTCDay();
  return slotTemplateFor(weekday).some((s) => s.start === slot.startTime.slice(0, 5));
};

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** True when the slot start is already in the past (business timezone). */
export const isSlotInPast = (slot: { date: string; startTime: string }): boolean => {
  const today = businessDate(0);
  if (slot.date !== today) return slot.date < today;
  return slot.startTime.slice(0, 5) <= timeFormatter.format(new Date());
};
