import type {
  InsertLocation,
  InsertService,
  InsertFrame,
  InsertBlogPost,
  InsertTestimonial,
  InsertAppointmentSlot,
} from "@shared/schema";

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

export const locationsSeed: InsertLocation[] = [
  {
    name: "Irapuato Centro",
    address: "Av. Revolución 123, Centro",
    city: "Irapuato",
    phone: "(462) 123-4567",
    email: "irapuato@opticascardani.com",
    openingHours: "Lun - Vie: 9:00 - 19:00, Sáb: 9:00 - 14:00",
  },
  {
    name: "Abasolo",
    address: "Calle Hidalgo 456, Centro",
    city: "Abasolo",
    phone: "(429) 987-6543",
    email: "abasolo@opticascardani.com",
    openingHours: "Lun - Vie: 9:00 - 18:00, Sáb: 9:00 - 14:00",
  },
];

export const servicesSeed: InsertService[] = [
  {
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

export const testimonialsSeed: (InsertTestimonial & { isApproved: boolean })[] = [
  {
    name: "Laura Méndez",
    commentEn: "The service was excellent, they attended me very quickly and the doctor was very professional. The frames are of very good quality.",
    commentEs: "El servicio fue excelente, me atendieron muy rápido y el doctor fue muy profesional. Los armazones son de muy buena calidad.",
    rating: 5,
    imageUrl: null,
    isApproved: true,
  },
  {
    name: "Carlos Rodríguez",
    commentEn: "The virtual try-on helped me choose the perfect frame before going to the store. The process was very easy and fun.",
    commentEs: "La prueba virtual me ayudó a elegir el armazón perfecto antes de ir a la tienda. El proceso fue muy fácil y divertido.",
    rating: 4,
    imageUrl: null,
    isApproved: true,
  },
  {
    name: "Elena Gutiérrez",
    commentEn: "I've been a customer of Ópticas Cardani for years and I always find what I'm looking for. Their attention and professionalism make me come back.",
    commentEs: "Llevo años siendo cliente de Ópticas Cardani y siempre encuentro lo que busco. Su atención y profesionalismo me hacen regresar.",
    rating: 5,
    imageUrl: null,
    isApproved: true,
  },
];

const SLOT_TEMPLATE = [
  { start: "09:00", end: "09:45" },
  { start: "10:00", end: "10:45" },
  { start: "11:00", end: "11:45" },
  { start: "12:00", end: "12:45" },
  { start: "13:00", end: "13:45" },
  { start: "16:00", end: "16:45" },
  { start: "17:00", end: "17:45" },
];

/**
 * Slots for the rolling booking window: Mon-Fri full day, Saturday mornings,
 * Sundays closed. Deterministic, so it can be re-run safely (the DB has a
 * unique index on location/date/start time).
 */
export const generateSlots = (locationIds: number[]): InsertAppointmentSlot[] => {
  const slots: InsertAppointmentSlot[] = [];
  for (let offset = 0; offset <= BOOKING_WINDOW_DAYS; offset++) {
    const date = businessDate(offset);
    // Noon UTC avoids any DST edge when reading the weekday back.
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday === 0) continue;
    for (const locationId of locationIds) {
      for (const slot of SLOT_TEMPLATE) {
        if (weekday === 6 && parseInt(slot.start, 10) >= 14) continue;
        slots.push({ locationId, date, startTime: slot.start, endTime: slot.end, isAvailable: true });
      }
    }
  }
  return slots;
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
