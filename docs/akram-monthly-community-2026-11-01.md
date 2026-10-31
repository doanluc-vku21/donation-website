# Akram monthly community page — 2026-11-01

## Scope and content

This follow-up applies only to `/akram-shake-3`. The Gaza page and earlier Akram
entry pages retain their existing content and amount-based progress.

- Headline: “❤️ Help More People Like Akram Build a Better Future”.
- Replace the story with the content supplied in the
  [story share](https://chatgpt.com/s/t_6ae6381674d08191bd3cb846f4e85ac2), including
  the monthly-support section and $25/month message.
- Replace the fixed-dollar fund allocations with the supplied
  [fund-use content](https://chatgpt.com/s/t_6ae6383a083881919d927b641b17196a): food
  and daily essentials, medical care and treatment, disability and family support,
  and long-term assistance.
- Replace the monetary progress on desktop, inline mobile, and sticky mobile
  donation summaries with monthly-supporter progress toward a 100-person goal.
- Include all five supported languages and Arabic direction.

The share pages did not expose their response text through the browser's visible
content or web text extraction. Their public HTML contained the complete shared
writing blocks. Only those requested writing blocks were used; follow-up offers
and other assistant commentary were excluded.

## Counting semantics and data boundaries

The screenshot's 74 is a styling example. The original overall donor count is
not reused or relabeled as a monthly-supporter count. The page reads successful
monthly donations for the original Akram campaign and counts unique donor IDs.
Repeated invoices and multiple subscriptions for the same donor count once.
Historical records without a donor ID are resolved through another invoice for
the same subscription where possible, otherwise deduplicated by subscription.
Records without either identifier do not establish an additional supporter.

This is a cumulative count of paid monthly supporters, not a count of currently
active subscriptions. Results are paginated beyond the database's per-request
row limit. A failed query produces an unavailable state instead of zero or an
example count. Donor identifiers remain on the server; only the aggregate is
passed to the client. The existing server-only Supabase admin client performs a
read; no database migration or write is required.

The original campaign ID, currency/fee calculations, monthly payment flow,
wallet initialization, receipts, webhooks, and attribution remain unchanged.
CMS documents, environment variables, and payment settings are unchanged.

## Validation and release

- 87 relevant tests pass across seven files, including counting/deduplication,
  pagination, query failures, page isolation, all three progress surfaces,
  zero/goal/above-goal values, Arabic direction, content, and existing checkout
  and wallet behavior.
- Type checking, ESLint with zero warnings, and a complete Next.js production
  build use isolated placeholder configuration; no production credentials are
  copied into local build configuration.
- The full suite has 188 passing tests and the same eight unrelated failures
  observed before this change (campaign-page router setup, campaign-story card
  expectations, legacy donation-panel expectations, and Meta Pixel setup).
  Native payment authorization and real charges are not part of validation.

Release uses the existing authorized commit/push/deploy workflow for
`darklife / donation-website`, production domain `donate.mealsupport.org`.
Rollback is the preceding Vercel deployment for commit `0a55631`; no database or
CMS changes need reversal.
