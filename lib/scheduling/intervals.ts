// lib/scheduling/intervals.ts
import { DateTime, Interval } from "luxon";

/**
 * Luxon Interval has start/end possibly null. We only work with valid intervals.
 */
export type SafeInterval = Interval<true>;

function assertSafe(i: Interval): SafeInterval {
  if (!i.isValid || !i.start || !i.end) {
    throw new Error(`Invalid interval: ${i.invalidReason ?? "unknown reason"}`);
  }
  return i as SafeInterval;
}

export function toUtcInterval(startAtUtc: Date, endAtUtc: Date): SafeInterval {
  const i = Interval.fromDateTimes(
    DateTime.fromJSDate(startAtUtc).toUTC(),
    DateTime.fromJSDate(endAtUtc).toUTC()
  );
  return assertSafe(i);
}

export function expandInterval(
  i: SafeInterval,
  bufferMin: number
): SafeInterval {
  if (!bufferMin) return i;
  const expanded = Interval.fromDateTimes(
    i.start.minus({ minutes: bufferMin }),
    i.end.plus({ minutes: bufferMin })
  );
  return assertSafe(expanded);
}

/**
 * Given ISO UTC slots, subtract busy intervals (safe Luxon intervals, UTC).
 */
export function subtractBusySlots<
  T extends { startUtc: string; endUtc: string }
>(slots: T[], busyIntervalsUtc: SafeInterval[]): T[] {
  if (!busyIntervalsUtc.length) return slots;

  return slots.filter((s) => {
    const slot = Interval.fromDateTimes(
      DateTime.fromISO(s.startUtc).toUTC(),
      DateTime.fromISO(s.endUtc).toUTC()
    );

    if (!slot.isValid || !slot.start || !slot.end) return false;
    const safeSlot = slot as SafeInterval;

    return !busyIntervalsUtc.some((b) => b.overlaps(safeSlot));
  });
}

/**
 * Merge overlapping/adjacent intervals to speed up overlap checks.
 */
export function mergeIntervals(intervals: SafeInterval[]): SafeInterval[] {
  if (intervals.length <= 1) return intervals;

  const sorted = [...intervals].sort(
    (a, b) => a.start.toMillis() - b.start.toMillis()
  );

  const out: SafeInterval[] = [];
  let cur = sorted[0];

  for (let idx = 1; idx < sorted.length; idx++) {
    const next = sorted[idx];

    const curEndMs = cur.end.toMillis();
    const nextStartMs = next.start.toMillis();

    // overlap OR touch (adjacent)
    if (cur.overlaps(next) || curEndMs === nextStartMs) {
      const merged = Interval.fromDateTimes(
        cur.start,
        DateTime.fromMillis(Math.max(curEndMs, next.end.toMillis())).toUTC()
      );
      cur = assertSafe(merged);
    } else {
      out.push(cur);
      cur = next;
    }
  }

  out.push(cur);
  return out;
}
