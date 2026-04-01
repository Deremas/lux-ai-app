# Scheduling Staging Verification - 2026-03-31

## Status

Staging database remediation is complete. The database is now ready for the next phase of paid-booking operational verification.

## What Was Done

- Exported overlap diagnostics and cleanup planning.
- Identified 72 active overlap conflict pairs in staging.
- Generated a deterministic cleanup plan covering 55 bad appointment rows.
- Applied the cleanup plan to staging.
- Verified overlap count returned to zero.
- Marked the failed March 31 migration as rolled back.
- Re-ran Prisma deployment successfully.
- Re-ran direct live DB inspection after migration.

## Data Cleanup Result

- Exact duplicate slot clusters found: 38
- Residual non-exact overlap cases found after duplicate grouping: 1
- Appointment rows removed from staging: 55
- Remaining active overlap conflict pairs: 0

Audit artifacts:

- `docs/staging-overlap-remediation-2026-03-31.md`
- `docs/staging-overlap-remediation-2026-03-31.json`
- `docs/staging-overlap-cleanup-plan-2026-03-31.md`
- `docs/staging-overlap-cleanup-plan-2026-03-31.json`

## Migration Result

Applied successfully:

- `20260331120000_add_booking_attempts_and_stripe_events`
- `20260331143000_add_slot_reservations_and_attempt_expiry`

`npx prisma migrate status` now reports:

- Database schema is up to date

## Live Staging DB Result

Confirmed present:

- `booking_attempt`
- `payment`
- `stripe_event`
- `slot_reservation`

Confirmed columns:

- `booking_attempt.reserved_until`
- `booking_attempt.failure_reason`
- `stripe_event.status`
- `stripe_event.last_error`

Confirmed unique indexes:

- `payment_booking_attempt_id_unique`
- `payment_stripe_payment_intent_id_unique`
- `payment_stripe_checkout_session_id_unique`
- `stripe_event_event_id_unique`
- `appointment_booking_attempt_id_unique`
- `slot_reservation_booking_attempt_id_unique`

Confirmed exclusion constraints:

- `appointment_no_overlap_staff`
- `appointment_no_overlap_org_default`
- `slot_reservation_no_overlap_staff`
- `slot_reservation_no_overlap_org_default`

## Open Operational Gaps

The database blocker is resolved, but staging is not fully production-proven yet. These still need real environment verification:

- Stripe test-mode end-to-end payment flow
- duplicate webhook replay behavior
- reconnect before expiry
- reconnect after expiry
- reconcile route trigger
- scheduler / cron execution
- host-level secret presence for:
  - `SCHEDULING_RECONCILE_SECRET`
  - `CRON_SECRET`
  - `STRIPE_WEBHOOK_SECRET`

## Current Runtime Findings

Probe target:

- `https://luxaiautomation.com`

Observed route behavior:

- `GET /` returns `200`
- `POST /api/scheduling/payment/checkout` returns `401 Unauthenticated`
- `POST /api/scheduling/webhooks/stripe/{orgId}` returns `400 Missing Stripe signature`
- `GET /api/scheduling/payment/status` returns `404`
- `POST /api/scheduling/payment/resume` returns `404`
- `POST /api/scheduling/internal/reconcile` returns `404`

Interpretation:

- The reachable public deployment is serving the older checkout and webhook routes.
- The newer status, resume, and reconcile routes from the current paid-flow hardening work are not deployed on that host.
- Because of that deployment/runtime mismatch, full operational verification cannot be completed yet on the reachable public host.

Stripe account finding from the locally available test secret:

- webhook endpoint count: `0`

Interpretation:

- The Stripe test account available in local `.env` does not currently have any webhook endpoint configured.
- That is not enough to prove real staging webhook delivery from this workspace.

## Next Actions

1. Deploy the current code to the reachable host so `payment/status`, `payment/resume`, and `internal/reconcile` exist.
2. Confirm the host environment has real values for `STRIPE_WEBHOOK_SECRET`, `SCHEDULING_RECONCILE_SECRET`, and `CRON_SECRET`, or verify the org-level Stripe secrets are configured.
3. Configure a Stripe test webhook endpoint for the deployed host if one is not already present.
4. Run Stripe test-mode paid booking success.
5. Replay a duplicate webhook event and confirm dedupe.
6. Test reconnect before and after reservation expiry.
7. Trigger the reconcile endpoint with the real staging secret.
8. Confirm the scheduler exists and hits the reconcile route on schedule.
