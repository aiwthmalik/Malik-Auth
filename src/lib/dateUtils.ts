/**
 * Centralized Timezone Utility for GMT+5 (Islamabad / Karachi - Pakistan Standard Time)
 * Formats all dates, expiry durations, timestamps, and logs across MalikAuth in GMT+5 (PKT).
 */

export const TIMEZONE_LABEL = 'PKT (GMT+5 Islamabad / Karachi)';

/**
 * Returns a Date object adjusted to Asia/Karachi (GMT+5)
 */
export function getPKTDate(d: Date = new Date()): Date {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(d);

  const getPart = (type: string) => {
    const p = parts.find((pt) => pt.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  return new Date(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    getPart('hour'),
    getPart('minute'),
    getPart('second')
  );
}

/**
 * Formats expiry string explicitly as DD/MM/YYYY hh:mm am/pm (e.g. 30/07/2026 11:33 pm)
 */
export function formatCustomExpiryDate(d: Date = new Date()): string {
  try {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const pktDate = getPKTDate(d);

    const day = pad(pktDate.getDate());
    const month = pad(pktDate.getMonth() + 1);
    const year = pktDate.getFullYear();

    let hours = pktDate.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = pad(pktDate.getMinutes());

    return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
  } catch (err) {
    return d.toISOString();
  }
}

/**
 * Formats any ISO string, timestamp, or Date into exact DD/MM/YYYY hh:mm am/pm format without extra timezone tags
 */
export function formatPKTDateTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return 'N/A';
  if (typeof dateInput === 'string' && (dateInput.toLowerCase().includes('lifetime') || dateInput.toLowerCase().includes('never'))) {
    return dateInput;
  }

  try {
    const parsedDate = parseExpiryToDate(dateInput as string);
    const d = parsedDate || (typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput);
    
    if (isNaN(d.getTime())) {
      return String(dateInput);
    }

    return formatCustomExpiryDate(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns current timestamp in DD/MM/YYYY hh:mm am/pm format
 */
export function getPKTTimestamp(): string {
  return formatCustomExpiryDate(new Date());
}

/**
 * Checks if an expiry string is past the current date/time
 */
export function isExpired(expiryStr?: string | null): boolean {
  if (!expiryStr) return false;
  const d = parseExpiryToDate(expiryStr);
  if (!d) return false;
  return d.getTime() <= Date.now();
}

/**
 * Parses expiry strings (including DD/MM/YYYY hh:mm am/pm, legacy [DD/MM/YYYY][HH:MM:SS AM/PM PKT], ISO strings, etc.)
 * into a valid JavaScript Date object for accurate comparison and countdown calculation.
 */
export function parseExpiryToDate(expiryStr?: string | null): Date | null {
  if (!expiryStr) return null;
  if (typeof expiryStr !== 'string') return null;
  const lower = expiryStr.toLowerCase().trim();
  if (lower.includes('lifetime') || lower.includes('never')) return null;

  // Pattern 1: DD/MM/YYYY hh:mm am/pm or DD/MM/YYYY hh:mm:ss am/pm
  const cleanMatch = lower.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
  if (cleanMatch) {
    const day = parseInt(cleanMatch[1], 10);
    const month = parseInt(cleanMatch[2], 10) - 1;
    const year = parseInt(cleanMatch[3], 10);
    let hours = parseInt(cleanMatch[4], 10);
    const minutes = parseInt(cleanMatch[5], 10);
    const seconds = cleanMatch[6] ? parseInt(cleanMatch[6], 10) : 0;
    const ampm = (cleanMatch[7] || '').toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 2: Legacy [DD/MM/YYYY][HH:MM:SS AM/PM PKT]
  const pktMatch = expiryStr.match(/\[(\d{1,2})\/(\d{1,2})\/(\d{4})\]\s*\[(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)?\s*PKT\]/i);
  if (pktMatch) {
    const day = parseInt(pktMatch[1], 10);
    const month = parseInt(pktMatch[2], 10) - 1;
    const year = parseInt(pktMatch[3], 10);
    let hours = parseInt(pktMatch[4], 10);
    const minutes = parseInt(pktMatch[5], 10);
    const seconds = parseInt(pktMatch[6], 10);
    const ampm = (pktMatch[7] || '').toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const utcDate = new Date(Date.UTC(year, month, day, hours - 5, minutes, seconds));
    if (!isNaN(utcDate.getTime())) return utcDate;
  }

  // Pattern 3: Standard Date or ISO string
  const stdDate = new Date(expiryStr);
  if (!isNaN(stdDate.getTime())) {
    return stdDate;
  }

  return null;
}

