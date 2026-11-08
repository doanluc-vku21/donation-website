# Monthly minimum of $20 — 2026-11-08

The user explicitly changed the requested monthly minimum to $20. On
`/akram-shake-2` and `/help-mango-seller`, new monthly donation selections now
require at least 2,000 USD cents, converted to the selected currency. The
one-time minimum remains 2,500 USD cents. Other campaign entry policies are
unchanged.

The shared page policy supplies the displayed minimum, custom input validation,
monthly upsell floor, card and wallet Session creation checks, and signed/legacy
wallet amount update checks. A $25 one-time selection therefore offers at least
$20 monthly instead of the former $10 recommendation. Fee contributions cannot
satisfy the donation minimum. Translated prompts use the existing dynamic amount
formatting in all supported languages.

No existing Stripe payment or subscription amount, database record, campaign
total, email configuration or production credential is changed.

## Validation

- The revised boundary checks fail in 22 cases against the old $10 rule, then
  all 149 focused tests pass with the new rule. Coverage includes both entry
  pages, rejected former ten-dollar gifts, below-minimum gifts with fees, valid
  $20 gifts, one-time minimums, USD/GBP conversion, monthly recommendations and
  signed/legacy wallet updates.
- ESLint with zero warnings, TypeScript checking and diff checks pass.
- A fresh full-suite baseline has 323 passes and 8 failures. After the change,
  the full suite has the same counts and exactly the same failing test names
  and first error lines; no new full-suite failure is introduced.
- External payment and database services are mocked. Validation does not make
  real charges or send donor emails.

Release uses the existing `origin/main` workflow for `darklife / donation-website`.
Production build status and live form behavior are checked after pushing, with
payment API requests intercepted during browser verification. Rollback is the
preceding release, `58cfd61`; no data migration is needed.
