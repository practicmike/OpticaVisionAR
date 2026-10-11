/** Weekday (0 = Sunday) in the store's timezone, not the visitor's. */
export const businessWeekday = (date = new Date()) => {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Mexico_City' }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
};

import { OPENING_HOURS, formatHour12 } from '@shared/business';

const nowHHMM = (date = new Date()) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Mexico_City' }).format(date);

/** Open/closed right now, with the next relevant time (store timezone). */
export const storeStatus = (date = new Date()) => {
  const today = businessWeekday(date);
  const now = nowHHMM(date);
  const h = OPENING_HOURS[today];
  if (h && now >= h.open && now < h.close) return { open: true as const, until: formatHour12(h.close) };
  // Next opening: later today, or the next day with hours.
  if (h && now < h.open) return { open: false as const, nextDay: 0, at: formatHour12(h.open) };
  for (let i = 1; i <= 7; i++) {
    const next = OPENING_HOURS[(today + i) % 7];
    if (next) return { open: false as const, nextDay: i, at: formatHour12(next.open) };
  }
  return { open: false as const, nextDay: -1, at: '' };
};
