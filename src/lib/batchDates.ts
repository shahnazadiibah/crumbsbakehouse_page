// Business rules for pre-order batch dates.
//
// Crumbs Bakehouse bakes on Saturdays. Orders for a given Saturday close
// at Friday 16:00 local time (WIB / Asia-Jakarta, UTC+7, no DST) — once
// that instant passes, that Saturday drops off the list of orderable
// batch dates and the next Saturday becomes the earliest option.
//
// All comparisons are done against epoch milliseconds (Date.now()), so
// this is correct regardless of the server's own timezone (important for
// Netlify functions, which run in UTC).

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface BatchDateOption {
  /** Batch date in YYYY-MM-DD form, suitable for the `orders.batch_date` column. */
  date: string;
  /** Human-readable label, e.g. "Saturday, 5 Jul 2026". */
  label: string;
  /** The Friday-16:00-WIB instant after which this date is no longer orderable. */
  cutoff: Date;
}

/** "Now", but with UTC-getters returning WIB wall-clock components. */
function shiftedNowForWallClock(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/**
 * Returns the next `count` Saturdays that are still open for ordering
 * (i.e. their Friday-16:00-WIB cutoff has not yet passed), soonest first.
 */
export function getUpcomingBatchDates(count = 4): BatchDateOption[] {
  const wallNow = shiftedNowForWallClock();
  const y = wallNow.getUTCFullYear();
  const m = wallNow.getUTCMonth();
  const d = wallNow.getUTCDate();
  const dayOfWeek = wallNow.getUTCDay(); // 0 = Sun ... 6 = Sat

  // Days from "today" (WIB) to the next Saturday. If today IS Saturday,
  // that batch's cutoff (yesterday 16:00) has necessarily already passed,
  // so jump straight to next week's Saturday.
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7;

  const options: BatchDateOption[] = [];
  const nowMs = Date.now();

  // Walk forward week by week, collecting Saturdays whose cutoff hasn't
  // passed, until we have `count` of them (cap the search to avoid an
  // infinite loop in case of a clock/logic error).
  for (let week = 0, found = 0; week < 26 && found < count; week++) {
    const offsetDays = daysUntilSaturday + week * 7;
    const saturdayUTC = new Date(Date.UTC(y, m, d + offsetDays));
    const sy = saturdayUTC.getUTCFullYear();
    const sm = saturdayUTC.getUTCMonth();
    const sd = saturdayUTC.getUTCDate();

    // Friday 16:00 WIB = Friday 09:00 UTC (WIB is always UTC+7, no DST),
    // and Friday is exactly one calendar day before this Saturday.
    const cutoff = new Date(Date.UTC(sy, sm, sd - 1, 9, 0, 0));

    if (nowMs < cutoff.getTime()) {
      options.push({
        date: toDateString(sy, sm, sd),
        label: saturdayUTC.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
        cutoff,
      });
      found++;
    }
  }

  return options;
}
