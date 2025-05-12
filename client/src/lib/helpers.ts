import { CURRENCY_FORMAT_OPTIONS, DAYS_OF_WEEK, MONTHS } from './constants';

/**
 * Format a number as MXN currency
 * @param amount - Amount in cents (e.g. 199900 for $1,999)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  const amountInPesos = amount / 100;
  return new Intl.NumberFormat('es-MX', CURRENCY_FORMAT_OPTIONS).format(amountInPesos);
};

/**
 * Format a date as a localized string
 * @param dateString - Date string in YYYY-MM-DD format
 * @param locale - Locale to use ('es' or 'en')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale: string = 'es'): string => {
  const date = new Date(dateString);
  
  if (locale === 'en') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Spanish formatting
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a time string (HH:MM) to a more readable format
 * @param timeString - Time string in HH:MM format
 * @param locale - Locale to use ('es' or 'en')
 * @returns Formatted time string
 */
export const formatTime = (timeString: string, locale: string = 'es'): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  
  return date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get the day name for a given date
 * @param date - Date object
 * @param locale - Locale to use ('es' or 'en')
 * @returns Day name
 */
export const getDayName = (date: Date, locale: string = 'es'): string => {
  const dayIndex = date.getDay();
  return DAYS_OF_WEEK[locale as 'es' | 'en'][dayIndex];
};

/**
 * Get the month name for a given date
 * @param date - Date object
 * @param locale - Locale to use ('es' or 'en')
 * @returns Month name
 */
export const getMonthName = (date: Date, locale: string = 'es'): string => {
  const monthIndex = date.getMonth();
  return MONTHS[locale as 'es' | 'en'][monthIndex];
};

/**
 * Get days in a month
 * @param year - Year
 * @param month - Month (0-based, January is 0)
 * @returns Number of days in the month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Generate an array of dates for a month
 * @param year - Year
 * @param month - Month (0-based, January is 0)
 * @returns Array of date objects for the month
 */
export const generateMonthDates = (year: number, month: number): Date[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const dates = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }
  
  return dates;
};

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Validate an email address
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a phone number (Mexican format)
 * @param phone - Phone number to validate
 * @returns True if phone is valid
 */
export const isValidPhone = (phone: string): boolean => {
  // Allow formats like (123) 456-7890, 123-456-7890, or 1234567890
  const phoneRegex = /^(\+?52)?[ -]?(\d{3})[ -]?(\d{3})[ -]?(\d{4})$/;
  return phoneRegex.test(phone);
};

/**
 * Creates a download URL for a calendar event
 * @param appointmentDetails - Appointment details
 * @returns URL for downloading .ics file
 */
export const createCalendarEvent = (appointmentDetails: {
  title: string;
  location: string;
  startDate: string;
  startTime: string;
  endTime: string;
  description: string;
}): string => {
  const { title, location, startDate, startTime, endTime, description } = appointmentDetails;
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Create date objects
  const startDateTime = new Date(startDate);
  startDateTime.setHours(startHour, startMinute, 0);
  
  const endDateTime = new Date(startDate);
  endDateTime.setHours(endHour, endMinute, 0);
  
  // Format dates for ics
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
};
