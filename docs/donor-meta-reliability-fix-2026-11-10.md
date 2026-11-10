# Donor conflict recovery and safe CAPI diagnostics — 2026-11-10

## Resulting behavior

Concurrent Checkout and first-invoice callbacks can both see no donor before
trying to insert the same normalized email. The shared server-only donor
helper now catches PostgreSQL `23505`, re-reads that email and uses the actual
winning donor record. It applies the existing identity-enrichment behavior
without replacing known fields with empty optional fields. If no matching donor
is found, or lookup/update fails, the webhook remains retryable rather than
returning a made-up donor or swallowing another database failure.

The helper retains case-insensitive legacy email lookup while escaping SQL
LIKE wildcard characters. Errors reaching the webhook logger contain only the
operation and a validated database code; database details and donor email
values are not attached to the exception.

Rejected Meta deliveries still throw and do not acquire a sent marker. The
exception now includes validated numeric `code` / `error_subcode` and an
optional bounded trace identifier. Free-form Meta messages, raw response data,
tokens, PII, credential-like traces and identity hashes are excluded. Malformed
diagnostics fall back to HTTP status only. Event IDs, original payment time,
paid-session gating, sandbox isolation and the acceptance-marker behavior are
unchanged.

This change fixes donor conflict handling and the diagnostic blind spot. It
does not by itself correct a Meta credential, permission or payload rejection,
and it does not establish the cause of an advertising conversion drop.

## Validation

- Targeted four-file suite: **34 tests passed**. Coverage includes simultaneous
  donor creation, incomplete identity preservation, literal `_`/`%` email
  characters, failed conflict recovery, safe error handling, both monthly
  callback paths, duplicate delivery accounting, Meta failure/retry, stable
  event ID/time and adversarial diagnostic values.
- Full suite: **450 passed, 7 failed, 457 total**. Exact failure-name comparison
  with the freshly executed preceding-release report confirmed the same seven
  campaign-page, campaign-story and donation-panel failures. All 17 added cases
  passed. External payment/email/Meta services were mocked.
- ESLint with zero warnings, TypeScript 7 and the build-compatible TypeScript
  6 checks passed using isolated Node 24.22.1 / npm 12.2.1.
- Production-environment cloud candidate build: passed.
- Authenticated candidate street-vendor checks returned 200 in English/USD and
  Arabic/USD, preserving the 18-entry/USD 775 baseline, six requested presets
  and USD 100 recommendation.
- A candidate webhook POST without a Stripe signature returned HTTP 400 and
  the expected missing-signature response before payment processing. No valid
  paid event was fabricated or replayed for this check.

## Release scope and evidence

- Existing project: `darklife/donation-website`,
  `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Environment/domain: Production / `donate.mealsupport.org`.
- Verified preceding production deployment:
  `dpl_rBMKnGXKppiDr6RevUKGNne8FFQg`, source `f0561d7`.
- Staged candidate: `dpl_AXx1PnyqTEmJMX2VJ2YX36y8vHkE`, READY, built without
  assigning production domains.
- Candidate URL: <https://donation-website-rjnybc4hm-darklife.vercel.app>.
- Candidate source manifest SHA-256:
  `91b4d3aa5b38db84ef9616b95ffa224dcfa1ec50f175b17870f7b226bfc57588`.
- Production publication follows the existing authorized push-to-main flow.
  Vercel associates the deployment with the Git commit containing this record;
  the final domain/commit readback is retained in the local release evidence.

Only repair code, regression tests and this technical record belong to the
release commit. Detailed private operational evidence remains under restricted,
ignored `.local/donor-meta-fix-2026-11-10/` and the preceding audit directory.
The separate local investigation document is not included in this commit.

No production variable, database schema, tracking enablement or payment setting
was changed. No charge, donor email, manual historical-event replay or synthetic
Purchase was used for validation. Observe subsequent automatic Stripe retries
for the new sanitized Meta diagnosis; absence of a new retry is not acceptance.

For an authorized rollback, restore preceding Ready production deployment
`dpl_rBMKnGXKppiDr6RevUKGNne8FFQg` in `darklife` and verify the formal domain.
There is no database or environment migration to reverse. Rollback was recorded,
not executed.
