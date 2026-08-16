import {
  parseISO,
  isValid,
  startOfDay,
} from 'date-fns';

/**
 * Parses a YYYY-MM-DD string as UTC midnight Date object to prevent any client timezone offset bugs.
 */
export function parseISODateToUTC(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? startOfDay(parsed) : new Date(NaN);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Converts a Date or ISO string into a strict YYYY-MM-DD string in UTC.
 */
export function toISODateString(date: Date | string): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = parseISODateToUTC(date);
    if (!isValid(parsed)) return '';
    return parsed.toISOString().split('T')[0];
  }
  if (!isValid(date)) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Returns the exact calendar difference in nights between check-in and check-out dates.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const dIn = parseISODateToUTC(checkIn);
  const dOut = parseISODateToUTC(checkOut);
  if (!isValid(dIn) || !isValid(dOut)) return 0;

  // Compute using UTC timestamps
  const diffTime = dOut.getTime() - dIn.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Determines whether a given night is a weekend night.
 * In resort hospitality, Friday (5) and Saturday (6) check-in nights are weekend rates.
 */
export function isWeekendNight(dateStr: string): boolean {
  const date = parseISODateToUTC(dateStr);
  if (!isValid(date)) return false;
  const dayOfWeek = date.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  return dayOfWeek === 5 || dayOfWeek === 6;
}

/**
 * Generates an array of nightly date strings (YYYY-MM-DD) for a stay range [checkIn, checkOut).
 */
export function getNightlyDates(checkIn: string, checkOut: string): string[] {
  const nights = calculateNights(checkIn, checkOut);
  if (nights <= 0) return [];

  const dates: string[] = [];
  const start = parseISODateToUTC(checkIn);

  for (let i = 0; i < nights; i++) {
    const current = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(current.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Checks if two date ranges [startA, endA) and [startB, endB) overlap.
 * Uses half-open interval rule: max(startA, startB) < min(endA, endB)
 */
export function areDateRangesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aIn = parseISODateToUTC(startA).getTime();
  const aOut = parseISODateToUTC(endA).getTime();
  const bIn = parseISODateToUTC(startB).getTime();
  const bOut = parseISODateToUTC(endB).getTime();

  return Math.max(aIn, bIn) < Math.min(aOut, bOut);
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls within [start, end)
 */
export function isDateWithinRange(dateStr: string, start: string, end: string): boolean {
  const target = parseISODateToUTC(dateStr).getTime();
  const rangeStart = parseISODateToUTC(start).getTime();
  const rangeEnd = parseISODateToUTC(end).getTime();

  return target >= rangeStart && target < rangeEnd;
}

/**
 * Validates check-in and check-out dates against business constraints.
 */
export interface DateRangeValidationResult {
  valid: boolean;
  error?: string;
  nights: number;
}

export function validateDateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  minStayNights: number = 1,
  maxStayNights: number = 30
): DateRangeValidationResult {
  if (!checkIn || !checkOut) {
    return { valid: false, error: 'Please select both check-in and check-out dates.', nights: 0 };
  }

  const dIn = parseISODateToUTC(checkIn);
  const dOut = parseISODateToUTC(checkOut);

  if (!isValid(dIn) || !isValid(dOut)) {
    return { valid: false, error: 'Invalid date format.', nights: 0 };
  }

  const nights = calculateNights(checkIn, checkOut);

  if (nights <= 0) {
    return { valid: false, error: 'Check-out date must be strictly after check-in date.', nights: 0 };
  }

  // Check if check-in is in the past (before UTC today)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  if (dIn.getTime() < todayUTC.getTime()) {
    return { valid: false, error: 'Check-in date cannot be in the past.', nights };
  }

  if (nights < minStayNights) {
    return {
      valid: false,
      error: `Minimum stay duration for this luxury suite is ${minStayNights} night${minStayNights > 1 ? 's' : ''}.`,
      nights,
    };
  }

  if (nights > maxStayNights) {
    return {
      valid: false,
      error: `Maximum stay duration is ${maxStayNights} nights. For extended residences, please contact concierge.`,
      nights,
    };
  }

  return { valid: true, nights };
}

/**
 * Formats a YYYY-MM-DD date into luxury editorial display formats.
 */
export function formatDateDisplay(
  dateStr: string,
  formatStyle: 'short' | 'medium' | 'long' | 'weekday' = 'medium'
): string {
  if (!dateStr) return '';
  const date = parseISODateToUTC(dateStr);
  if (!isValid(date)) return dateStr;

  // Use UTC values for display formatting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayOfWeek = weekdays[date.getUTCDay()];
  const fullDayOfWeek = fullWeekdays[date.getUTCDay()];
  const month = months[date.getUTCMonth()];
  const fullMonth = fullMonths[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  switch (formatStyle) {
    case 'short':
      return `${month} ${day}`;
    case 'weekday':
      return `${dayOfWeek}, ${month} ${day}`;
    case 'long':
      return `${fullDayOfWeek}, ${fullMonth} ${day}, ${year}`;
    case 'medium':
    default:
      return `${month} ${day}, ${year}`;
  }
}

/**
 * Formats a stay range like "Oct 12 — Oct 16, 2026 (4 Nights)"
 */
export function formatDateRangeDisplay(checkIn: string, checkOut: string): string {
  if (!checkIn || !checkOut) return 'Select Dates';
  const nights = calculateNights(checkIn, checkOut);
  const formattedIn = formatDateDisplay(checkIn, 'short');
  const formattedOut = formatDateDisplay(checkOut, 'medium');

  return `${formattedIn} — ${formattedOut} (${nights} night${nights !== 1 ? 's' : ''})`;
}

/**
 * Returns today's ISO date string in UTC.
 */
export function getTodayUTC(): string {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return today.toISOString().split('T')[0];
}

/**
 * Adds N calendar days to a YYYY-MM-DD string.
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const date = parseISODateToUTC(dateStr);
  if (!isValid(date)) return '';
  const newDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  return newDate.toISOString().split('T')[0];
}
