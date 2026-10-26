// Numbers and dates in the language of the page. The dictionaries use these too.
// Hours always run 00–23, as on the clocks of the data (UTC).

let locale = 'en-GB';
export function setLocale(l: string) { locale = l; }

export const num = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d, minimumFractionDigits: d });

/** A day ("2026-10-25") is read at noon UTC, so it never slips into the day before. */
const dateOf = (iso: string | number | Date) => (typeof iso === 'string' && iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso));
const fmt = (iso: string | number | Date, o: Intl.DateTimeFormatOptions) => dateOf(iso).toLocaleString(locale, { timeZone: 'UTC', ...o });

/** 25 October */
export const dayMonth = (iso: string | number | Date) => fmt(iso, { day: 'numeric', month: 'long' });
/** 25 Oct 2026 */
export const dayShort = (iso: string | number | Date) => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
/** 25 Oct */
export const dayMonthShort = (iso: string | number | Date) => fmt(iso, { day: 'numeric', month: 'short' });
/** October */
export const month = (iso: string | number | Date) => fmt(iso, { month: 'long' });
/** October 2026 */
export const monthYear = (iso: string | number | Date) => fmt(iso, { month: 'long', year: 'numeric' });
/** 25 October, 06:00 (UTC) */
export const dayMonthTime = (iso: string | number | Date) => fmt(iso, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** 06:00 (UTC) */
export const timeUtc = (iso: string | number | Date) => fmt(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** 08:00 where the viewer is. */
export const timeLocal = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
