type AppointmentPaymentInput = {
  paymentPolicy?: string | null;
  paymentStatus?: string | null;
  requiresPayment?: boolean | null;
  priceCents?: number | null;
  currency?: string | null;
};

export function normalizeAppointmentPayment<T extends AppointmentPaymentInput>(
  input: T
) {
  const paymentRequired =
    input.paymentPolicy === "FREE"
      ? false
      : input.paymentPolicy === "PAID"
        ? true
        : Boolean(input.requiresPayment);

  return {
    paymentPolicy: paymentRequired ? "PAID" : "FREE",
    paymentStatus: paymentRequired
      ? (input.paymentStatus ?? "unpaid")
      : "not_required",
    requiresPayment: paymentRequired,
    priceCents: paymentRequired ? (input.priceCents ?? null) : null,
    currency: paymentRequired ? (input.currency ?? null) : null,
  };
}
