/**
 * Centralized Timezone Utility for GMT+5 (Islamabad / Karachi - Pakistan Standard Time)
 * Formats all dates, expiry durations, timestamps, and logs across MalikAuth in GMT+5 (PKT).
 */

export { parseExpiryToDate, checkIsExpired, formatExpiryForStorage } from './dateShared';
import { parseExpiryToDate } from './dateShared';

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
 * Backward-compatible alias for checkIsExpired from dateShared
 */
export function isExpired(expiryStr?: string | null): boolean {
  if (!expiryStr) return false;
  const d = parseExpiryToDate(expiryStr);
  if (!d) return false;
  return d.getTime() <= Date.now();
}
