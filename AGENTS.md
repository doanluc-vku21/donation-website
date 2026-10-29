# Repository Guidelines

These instructions apply to all coding agents across this repository. Explicit instructions from the current user take precedence. Check for more specific `AGENTS.md` files before editing a subdirectory. Keep this file focused on reusable guidance; put execution logs and dated results in `docs/`.

## Project and Directory Map

This donation website supports multiple languages and currencies, with one-time and monthly donations. It uses Next.js App Router, React, strict TypeScript, and Tailwind CSS. Stripe handles payments, Sanity manages campaign content, Supabase stores donation data, Resend sends email, and Meta Pixel/CAPI handles attribution.

| Path | Purpose |
| --- | --- |
| `app/` | Campaign pages, legal pages, thank-you page, and API routes; `app/studio/` hosts Sanity Studio |
| `components/campaign/` | Campaign stories, progress, and donation lists |
| `components/donation/` | Donation modals, forms, payments, and wallet components |
| `components/analytics/`, `lib/meta/` | Browser attribution, Pixel, and server CAPI |
| `lib/stripe/` | Stripe clients, amount calculations, and wallet updates |
| `lib/supabase/`, `lib/queries/` | Data access and campaign queries |
| `sanity/` | Content schemas, types, GROQ queries, and clients |
| `lib/i18n*`, `lib/*translations.ts`, `lib/localize-campaign.ts` | Language and content localization |
| `lib/currency*`, `lib/money.ts`, `lib/exchange-rate.ts` | Currencies, money formatting, and exchange rates |
| `tests/unit/` | Vitest and React Testing Library tests |
| `docs/`, `scripts/` | Designs, investigation notes, and explicitly invoked maintenance scripts |

## Communication and Code Conventions

- Choose the response language from the current user's message. Do not infer it from previous participants, repository content, account settings, or location. Honor an explicit language request; for mixed-language messages, use the language of the actual request. This applies to progress updates and final responses. Keep shared repository guidance in English for the international team.
- Before editing, inspect `git status --short` and read the relevant implementation, tests, and documentation. Preserve existing user changes.
- Stay within the requested scope and reuse existing components and helpers. Avoid unrelated reformatting, dependency upgrades, or refactoring.
- Use the `@/` root alias, explicit TypeScript types, and the surrounding code style. Preserve server/client boundaries. Use `"use client"` only where interaction requires it; server credentials and admin clients must never enter client dependency chains.
- For UI changes, consider mobile layouts, keyboard access, loading/error states, and Arabic RTL. Use the existing translation mechanism for new copy and cover supported languages. The current language and currency definitions live in `lib/i18n.ts` and `lib/currency.ts`.
- When changing Sanity content structures, review schemas, query projections, types, and rendering together. Confirm the target dataset and write scope before running scripts such as `scripts/migrate-campaign-i18n.ts`.
- Do not edit or commit `node_modules/`, `.next/`, `.local/`, `.worktrees/`, `.vercel/`, or build caches as application source.

## Installation and Validation

Use npm and the committed `package-lock.json`. Follow the `packageManager` version in `package.json` (currently npm 12.2.1). Use `npm ci` for clean installations; do not introduce lockfiles from other package managers.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run lint -- --max-warnings 0` | ESLint checks |
| `npm run typecheck` | TypeScript checks |
| `npm test -- tests/unit/<name>.test.tsx` | Targeted tests; use `.test.ts` for non-JSX tests |
| `npm test` | Full unit test suite |
| `npm run build` | Production build |

- For application changes, run lint, type checking, and relevant tests. Expand coverage for changes spanning payment methods, webhooks, or shared state; run the full suite and build when warranted. For documentation-only changes, check content, links, and the diff.
- Add meaningful regression tests for payment amounts, asynchronous races, idempotency, and failure recovery. Mock external services by default. Do not make real charges or send real donor emails for validation.
- Builds and tests may require environment variables during module initialization or page-data collection. Configure an isolated environment using `.env.example`. Report missing credentials as a specific blocker; do not conceal it with production keys or fabricated results.
- The toolchain intentionally combines the TypeScript 7 compiler (`@typescript/native`) with the ESLint-compatible TypeScript 6 API (`typescript`). Read `docs/lint-compatibility.md` before changing this setup. Do not casually merge these dependencies or disable checks.
- Pass/fail records in `docs/` are dated evidence. Verify current results and call failures pre-existing only when a current baseline or clear evidence supports that conclusion. Partial tests, compilation, and mocks do not establish a complete build, successful deployment, or real-device performance.

## Donations, Stripe, and Email

- Use integer minor currency units for payments and persistence. Distinguish original-currency amounts from normalized USD amounts. Reuse `lib/stripe/donation-amount.ts` and `lib/money.ts` so Session creation, wallet updates, fee selection, and final accounting agree.
- Cover the relevant one-time/monthly, embedded/Hosted Checkout, Express Checkout, custom amount, currency switching, and fee contribution paths. Stripe server-confirmed results determine payment status; frontend redirects and URL parameters alone do not prove payment.
- Preserve webhook signature verification against the raw request body. Handle duplicate deliveries, asynchronous payments, and concurrent Checkout/Invoice events for the first monthly payment safely. Prevent duplicate accounting, receipts, and attribution while retaining retries for recoverable failures.
- Wallet warm-up only initializes payment state; the user must trigger payment confirmation through the normal Stripe flow. Read `docs/apple-pay-wallet-warmup.md` and related Apple Pay notes before changing preloading. Preserve wallet mounting while the modal is closed, instance reuse on opening, no hidden card Session creation, campaign/currency matching, and failure recovery.
- Preserve email and abandoned-donation reminder claiming/deduplication, payment-status rechecks, and send-failure recovery. Do not invoke `/api/test-email` or the abandoned-donation cron to send real emails without authorization. Retain cron authentication.

## Meta Attribution

- Read `docs/meta-emq.md` before making changes and `docs/meta-capi-runbook.md` for configuration, deployment, verification, and rollback. Browser and server Purchase events share `purchase_<Stripe Checkout Session ID>`. Send only for server-confirmed paid Sessions with positive amounts, using the actual charged amount and currency.
- Preserve `meta_purchase_sent_at`, stable event IDs, and retry behavior. An existing donation record must not prevent an incomplete CAPI delivery from being retried.
- Follow the normalization, hashing, and unhashed-parameter rules in `lib/meta/`. Do not invent `fbclid`, `fbc`, IP addresses, international phone prefixes, or user details. Do not substitute the webhook server's IP/UA for the original visitor's. Respect applicable consent controls.
- Configure additional browser Pixels separately from the primary CAPI dataset. Adding a browser Pixel must not automatically reuse a token or enable CAPI. Before production enablement, follow the documented Test Events, deduplication, and overlapping-sender checks.

## Credentials and Production Operations

- Use `.env.example` for variable names and ignored environment files for local runtime configuration. Keep diagnostic materials and isolated credentials in the project's ignored `.local/` directory with restricted access. Example files contain placeholders only.
- Never expose Stripe secrets, webhook secrets, Supabase service-role credentials, Resend keys, Meta tokens, or similar credentials in chat, logs, screenshots, source, commits, or `NEXT_PUBLIC_*` variables. Report configuration presence and redacted results only.
- Proceed with local fixes, mocked tests, and read-only investigation within the requested scope. Production deployments, environment variables, payment settings, database/CMS writes, real emails, and tracking enablement require corresponding authorization. Do not ask again within an explicitly authorized batch.
- Before production writes, confirm the actual project, account, environment, impact, and rollback method; read back the result afterward. If administrator-managed configuration is inaccessible, provide concrete instructions that can be forwarded. Do not ask anyone to send credentials in chat or export an unreadable secret.
- Follow the user's current authorization for commits, pushes, and deployments. At handoff, briefly state what changed, validation results, and remaining blockers.

File convention reference: [OpenAI's official AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Project guidance follows the current repository implementation and the user's explicit instructions.
