// Business rules for pre-order batch dates.
//
// Which calendar dates are open for pre-order is now admin-controlled
// (the open_batch_dates table) rather than hardcoded to Saturdays. The
// one remaining fixed rule is the D-2 cutoff: an order for date D must
// be placed by the end of D-2 (WIB) — so D and D-1 are never orderable,
// regardless of what the admin has opened.
//
// All comparisons are done against epoch milliseconds (Date.now()), so
// this is correct regardless of the server's own timezone (important for
// Netlify functions, which run in UTC).

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_LEAD_DAYS = 2;

export interface BatchDateOption {
  /** Batch date in YYYY-MM-DD form, suitable for the `orders.batch_date` column. */
  date: string;
  /** Human-readable label, e.g. "Saturday, 5 Jul 2026". */
  label: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** Today's calendar date in WIB, as a YYYY-MM-DD string. */
function todayWIB(): string {
  const wallNow = new Date(Date.now() + WIB_OFFSET_MS);
  return toDateString(
    wallNow.getUTCFullYear(),
    wallNow.getUTCMonth(),
    wallNow.getUTCDate()
  );
}

function dateStringToUTCms(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** True if `date` (YYYY-MM-DD) is at least MIN_LEAD_DAYS from today (WIB). */
export function isWithinLeadTime(date: string): boolean {
  const daysAhead =
    (dateStringToUTCms(date) - dateStringToUTCms(todayWIB())) / DAY_MS;
  return daysAhead >= MIN_LEAD_DAYS;
}

function formatLabel(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Given the admin-opened dates (YYYY-MM-DD strings, any order), returns
 * the ones still orderable under the D-2 lead time rule, soonest first.
 */
export function getSelectableBatchDates(
  openDates: string[]
): BatchDateOption[] {
  return openDates
    .filter(isWithinLeadTime)
    .sort()
    .map((date) => ({ date, label: formatLabel(date) }));
}
