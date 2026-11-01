# Hosted Checkout opening delay and recovery — 2026-11-02

## Evidence and limits

The user reports that `/akram-shake-1` sometimes remains on “Opening checkout…”.
The screenshot alone does not establish the elapsed time or which service was
pending. Vercel runtime logs were not connected during this investigation; the
available Vercel integration was suggested for installation/connection.

Code inspection identified two sequential browser requests: save a donation
attempt, then request a Hosted Checkout Session. The first request validates the
campaign, looks up a reusable pending attempt, and inserts or updates it. Neither
browser request had a deadline. Stripe's installed SDK also has an 80-second
default request timeout; its presence does not prove Stripe caused this incident.

The screenshot uses USD, for which the exchange-rate helper returns 1 without an
external request. Read-only invalid-email probes, which stop before database or
Stripe access, took approximately 1.5 seconds on the first call to each endpoint
and 0.4 seconds on repeat calls from the investigation machine. These are network
and application-startup observations, not an iPhone or complete-checkout benchmark.

## Changes

- This page now makes one browser request. The Hosted Checkout handler reuses
  the original attempt validation, reuse and persistence logic in a server-only
  helper before creating a Stripe Session. Campaign validation and recoverable
  persistence failures remain blocking; tracking/reminders are not skipped.
- Exchange-rate lookup can overlap attempt persistence. USD still requires no
  external rate request. The attempt ID is present in initial Checkout and
  subscription metadata as before.
- A 30-second browser deadline covers both receiving the response and reading
  its JSON body. It aborts the request and restores a localized retryable form;
  late responses cannot override the already-rejected operation.
- The form retains its request identity after uncertain network/timeout failures.
  Identical resolved Stripe parameters and request identity produce the same
  hashed idempotency key; changed payment parameters use a different key.
  A returned HTTP error clears the form's request identity for a new attempt.
- Responses and server logs include numeric `exchange_rate`, `donation_attempt`,
  `stripe_session` and `total` durations. Timing diagnostics contain no email,
  donor names, Session URL, token or donation-attempt identifier.

The existing donation-attempt POST endpoint delegates to the same helper for
other callers. Its validation and persistence behavior is retained, and the PATCH
handler was verified unchanged. Other hosted entry pages keep their existing
browser sequence and do not receive the new deadline. No hidden Session is
created while viewing the campaign or entering donor information.

## Validation and release

91 focused tests pass, covering a fetch that never settles, a stalled response
body, timer cleanup, a 30-second UI recovery, retained identity on timeout retry,
one browser request, attempt failure/reuse, initial metadata, idempotency-key
separation, and unchanged payment amounts and other entry pages. ESLint with zero
warnings, type checking, and a complete production build pass with isolated
placeholder configuration. The full suite has 237 passing tests and the same
eight unrelated failures as the previous baseline.

No real charge, donor email, production test attempt, or CMS/database maintenance
write was used for validation. Real-device end-to-end latency remains to be
measured on a genuine user-initiated retry; this change does not establish a
specific speedup or identify the slow service in the original incident.

Release uses the authorized `darklife / donation-website` workflow. Rollback is
the preceding production deployment for `c06796b`; no data migration is needed.
