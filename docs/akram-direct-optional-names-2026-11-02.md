# Optional donor names on the Akram direct page — 2026-11-02

The user requested optional first and last names on `/akram-shake-1`.

The monthly donation form and Hosted Checkout validation now accept either or
both names as empty or omitted. Email remains required and must be valid. A shared
page/frequency policy keeps browser and server validation aligned. The form's
required indicators and five-language hint explain the distinction.

Supplied names are still trimmed and preserved in metadata. Missing names remain
empty rather than being replaced with invented personal details. Existing public
display-name fallbacks, anonymity controls, donation-attempt tracking, Stripe
monthly subscriptions, charged amounts, fees, and return paths are retained.

Other campaigns retain their name requirements. The existing child-health
optional-information behavior is unchanged. No database, CMS, environment, Stripe
account setting, webhook, or email-sending behavior is modified.

Regression checks exercise blank/partial/omitted names, valid-email enforcement,
server metadata, the full browser transition from amount to donor information and
the Hosted Checkout request, and unchanged validation on other hosted pages.
External calls are mocked; testing does not make a charge or send a donor email.

All 85 focused tests, ESLint with zero warnings, type checking, and the production
build pass with isolated placeholder configuration. The full suite has 219
passing tests and the same eight unrelated failures as the preceding baseline.

Release uses the existing authorized `origin/main` workflow for Vercel project
`darklife / donation-website`. Rollback is the preceding production deployment for
`fd33537`; no data migration is required.
