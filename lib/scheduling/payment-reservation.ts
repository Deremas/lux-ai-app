const DEFAULT_RESERVATION_TIMEOUT_MIN = 10;
const MIN_RESERVATION_TIMEOUT_MIN = 5;
const MAX_RESERVATION_TIMEOUT_MIN = 30;

export function getPaymentReservationTimeoutMinutes() {
  const configured = Number(
    process.env.SCHEDULING_PAYMENT_RESERVATION_MINUTES ??
      DEFAULT_RESERVATION_TIMEOUT_MIN.toString()
  );

  if (!Number.isFinite(configured)) {
    return DEFAULT_RESERVATION_TIMEOUT_MIN;
  }

  return Math.min(
    MAX_RESERVATION_TIMEOUT_MIN,
    Math.max(MIN_RESERVATION_TIMEOUT_MIN, Math.round(configured))
  );
}
