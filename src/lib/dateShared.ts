/**
 * Shared date utilities for both frontend and backend.
 * Canonical implementations for expiry parsing, checking, and formatting.
 */

/**
 * Parses expiry strings (DD/MM/YYYY hh:mm am/pm, legacy [DD/MM/YYYY][HH:MM:SS AM/PM PKT], ISO strings)
 * into a valid JavaScript Date object. Uses local time for Pattern 1 (DD/MM/YYYY hh:mm am/pm).
 */
export function parseExpiryToDate(expiryStr?: string | null): Date | null {
  if (!expiryStr) return null;
  if (typeof expiryStr !== 'string') return null;
  const lower = expiryStr.toLowerCase().trim();
  if (lower.includes('lifetime') || lower.includes('never')) return null;

  // Pattern 1: DD/MM/YYYY hh:mm am/pm or DD/MM/YYYY hh:mm:ss am/pm
  const cleanMatch = lower.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i
  );
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
  const pktMatch = expiryStr.match(
    /\[(\d{1,2})\/(\d{1,2})\/(\d{4})\]\s*\[(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)?\s*PKT\]/i
  );
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

/**
 * Checks if an expiry string is past the current date/time.
 */
export function checkIsExpired(expiryStr?: string | null): boolean {
  if (!expiryStr) return false;
  const d = parseExpiryToDate(expiryStr);
  if (!d) return false;
  return d.getTime() <= Date.now();
}

/**
 * Formats a Date into DD/MM/YYYY hh:mm am/pm for storage.
 */
export function formatExpiryForStorage(d: Date): string {
  try {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = pad(d.getMinutes());

    return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
  } catch {
    return d.toISOString();
  }
}
