/**
 * All scheduling / timer logic uses America/Los_Angeles (Pacific Time).
 * This module provides helpers so admin inputs and schedule comparisons
 * are always interpreted in Pacific regardless of the browser's local TZ.
 */

const TZ = "America/Los_Angeles";

/** Format a Date (or ISO string) as a datetime-local value in Pacific time */
export function isoToPacificLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // sv-SE locale gives YYYY-MM-DD HH:MM:SS — perfect for datetime-local after replacing space
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return formatted.replace(" ", "T");
}

/**
 * Convert a datetime-local string (entered by admin, interpreted as Pacific)
 * to an ISO/UTC string for database storage.
 */
export function pacificLocalToISO(dtLocal: string): string {
  if (!dtLocal) return "";
  // Treat the input as UTC momentarily to compute the Pacific offset at that instant
  const asUTC = new Date(dtLocal + "Z");
  // Get what Pacific time reads when it's that UTC instant
  const pacificStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(asUTC);
  const pacificAsUTC = new Date(pacificStr.replace(" ", "T") + "Z");
  // offsetMs = how many ms Pacific is behind UTC
  const offsetMs = asUTC.getTime() - pacificAsUTC.getTime();
  // The admin typed dtLocal meaning Pacific, so UTC = dtLocal + offset
  const result = new Date(asUTC.getTime() + offsetMs);
  return result.toISOString();
}

/** Current time as ISO string — just uses Date (always UTC, fine for comparisons with stored UTC values) */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Append the correct Pacific offset (-07:00 PDT / -08:00 PST) to a datetime-local string.
 * Useful for drop_date fields stored with offset.
 */
export function pacificLocalWithOffset(dtLocal: string): string {
  if (!dtLocal) return "";
  const iso = pacificLocalToISO(dtLocal);
  const asUTC = new Date(dtLocal + "Z");
  const utc = new Date(iso);
  const offsetHours = Math.round((utc.getTime() - asUTC.getTime()) / 3600000);
  const sign = offsetHours <= 0 ? "-" : "+";
  const abs = Math.abs(offsetHours);
  return `${dtLocal}:00${sign}${String(abs).padStart(2, "0")}:00`;
}
