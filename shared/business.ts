/**
 * Ópticas Cardani — real business data, single source of truth.
 * Used by the server (appointment slots, seed) and the client (header,
 * footer, contact, location, WhatsApp). Change it here and every page and
 * the booking calendar follow.
 */

export const BUSINESS = {
  name: "Ópticas Cardani",
  taglineEs: "nuestros ojos en ti...",
  taglineEn: "our eyes on you...",
  address: "Lerdo Oriente 157 2C",
  city: "Abasolo, Guanajuato",
  phoneDisplay: "429 488 2131",
  phoneE164: "+524294882131",
  // WhatsApp is a different line from the landline above (mobile, Irapuato area code).
  whatsappDisplay: "462 601 0113",
  // wa.me format, digits only. WhatsApp still keys Mexican mobiles as 521 + 10 digits.
  whatsappNumber: "5214626010113",
  email: "info@opticascardani.com",
  mapsQuery: "Lerdo Oriente 157, Abasolo, Gto., Mexico",
} as const;

export const whatsappUrl = (message?: string) =>
  `https://wa.me/${BUSINESS.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export const mapsEmbedUrl = () =>
  `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapsQuery)}&output=embed`;

export const mapsLinkUrl = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsQuery)}`;

/** Opening hours by weekday (0 = Sunday … 6 = Saturday), 24 h "HH:MM". */
export const OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: "10:00", close: "17:00" }, // domingo
  1: { open: "10:00", close: "20:00" }, // lunes
  2: { open: "10:00", close: "20:00" }, // martes
  3: { open: "10:00", close: "20:00" }, // miércoles
  4: { open: "10:00", close: "17:00" }, // jueves
  5: { open: "10:00", close: "20:00" }, // viernes
  6: { open: "10:00", close: "17:00" }, // sábado
};

/** Monday-first order for displaying the weekly schedule. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const APPOINTMENT_MINUTES = 45;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * Appointment start/end times for a weekday: one slot per hour from
 * opening, as long as the appointment ends by closing time.
 */
export const slotTemplateFor = (weekday: number) => {
  const hours = OPENING_HOURS[weekday];
  if (!hours) return [];
  const slots: { start: string; end: string }[] = [];
  for (let start = toMinutes(hours.open); start + APPOINTMENT_MINUTES <= toMinutes(hours.close); start += 60) {
    slots.push({ start: toHHMM(start), end: toHHMM(start + APPOINTMENT_MINUTES) });
  }
  return slots;
};

/** "10:00" -> "10:00 am", "17:00" -> "5:00 pm" (Mexican convention). */
export const formatHour12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};
