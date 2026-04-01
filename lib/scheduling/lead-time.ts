import { DateTime } from "luxon";

export const MIN_BOOKING_LEAD_MINUTES = 180;

export function getMinBookableUtc(now: DateTime = DateTime.utc()) {
  return now.toUTC().plus({ minutes: MIN_BOOKING_LEAD_MINUTES });
}

export function isBookableStartUtc(
  start: DateTime,
  minBookableUtc: DateTime = getMinBookableUtc()
) {
  return start.toUTC() >= minBookableUtc.toUTC();
}
