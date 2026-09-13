const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;

/** "1911-03-20" -> "20 Mar 1911". Free text like "c.1830" passes through. */
export function formatDate(date?: string): string {
  if (!date) return '';
  const day = ISO_DAY.exec(date);
  if (day) return `${Number(day[3])} ${MONTHS[Number(day[2]) - 1]} ${day[1]}`;
  const month = ISO_MONTH.exec(date);
  if (month) return `${MONTHS[Number(month[2]) - 1]} ${month[1]}`;
  return date;
}

const EXACT = /^\d{4}(-\d{2}){0,2}$/;

/**
 * First four-digit run in a date string, kept together with the qualifier the
 * original carried. "c.1830–33" is not the same claim as "1830", and
 * "after 1 Apr 1864" is not a death year at all.
 */
export function yearOf(date?: string): string {
  if (!date) return '';
  const match = /\d{4}/.exec(date);
  if (!match) return '';
  const year = match[0];

  if (EXACT.test(date.trim())) return year;
  if (/^(after|aft\.?)\b/i.test(date)) return `aft.${year}`;
  if (/^(before|bef\.?)\b/i.test(date)) return `bef.${year}`;
  return `c.${year}`;
}

/** One end of a life span, kept separate so each end can be drawn on its own. */
export interface SpanPart {
  kind: 'birth' | 'death';
  text: string;
}

/**
 * The life span broken into its two ends. The chart marks an unverified birth
 * or death date individually, so it cannot use a single pre-joined string.
 */
export function lifespanParts(birth?: string, death?: string): {
  parts: SpanPart[];
  separator: string;
} {
  const b = yearOf(birth);
  const d = yearOf(death);
  if (b && d) {
    return { parts: [{ kind: 'birth', text: b }, { kind: 'death', text: d }], separator: '–' };
  }
  if (b) return { parts: [{ kind: 'birth', text: `b. ${b}` }], separator: '' };
  if (d) return { parts: [{ kind: 'death', text: `d. ${d}` }], separator: '' };
  return { parts: [], separator: '' };
}

/** Compact life span for the chart box: "1885–1955", "b. 1911", "d. 1944". */
export function lifespan(birth?: string, death?: string): string {
  const { parts, separator } = lifespanParts(birth, death);
  return parts.map((p) => p.text).join(separator);
}
