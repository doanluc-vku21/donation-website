# Single-Campaign Donation Website Design

Date: 2026-09-14
Status: Awaiting written-spec review

## 1. Objective

Build an English-only, modern, mobile-friendly donation website for one campaign. The experience takes inspiration from the conversion-focused split layout of the supplied DonorSupport campaign page, while using original branding, copy, imagery, styling, and source code.

The first release runs exclusively with Stripe's sandbox/test environment. It must not accept live payments.

## 2. Confirmed Scope

### Included

- One public campaign
- Campaign title, organization identity, hero image, story, goal, raised amount, progress, donor count, and recent donations
- One-time and monthly donations
- Suggested amounts of USD 25, 50, 100, and 250
- Custom USD amount
- Impact text for suggested amounts
- Optional estimated transaction-fee contribution
- Donor first name, last name, email, optional phone number, and public-name consent
- Stripe-hosted Checkout in sandbox/test mode
- Card, Apple Pay, Google Pay, and Link when enabled and available for the Stripe test account and donor device
- Stripe Adaptive Pricing when supported by the account and Checkout configuration
- Stripe webhook verification and idempotent donation recording
- Thank-you page with verified donation status
- Campaign sharing, including native share where supported
- About, Contact, Privacy Policy, Terms and Conditions, and Donation/Refund Policy pages
- Social metadata and an OG image
- Supabase PostgreSQL and Supabase Storage
- Local Git repository, followed later by a private GitHub repository and Vercel connection

### Excluded from the first release

- Multiple campaigns
- Admin dashboard or CMS
- Supabase Auth for content editors
- Live Stripe payments
- A custom payment form or embedded Stripe Elements
- A website-maintained foreign-exchange-rate service
- Editable legal pages
- GA4 unless requested later

Campaign content is updated in project seed/configuration files and redeployed by the developer.

## 3. Reference and Originality Boundary

The supplied reference establishes only the broad interaction model:

- campaign content and progress on the left on desktop
- a sticky donation panel on the right
- a single-column mobile layout
- clear suggested donation amounts and a prominent CTA

The implementation must not reuse the reference's logo, organization name, campaign title, body copy, metrics, images, color palette, downloaded assets, or source code. Sample content and assets must be newly created or properly licensed. The captured reference screenshot is analysis evidence only and must not ship with the application.

## 4. Experience Design

### Desktop

Use a centered two-column page. The campaign column occupies approximately 60 percent and contains:

1. organization logo and Share action
2. campaign title
3. progress bar, raised amount, USD goal, and unique donor count
4. original campaign hero media
5. campaign story and impact content
6. recent donations
7. trust and organization information

The donation column occupies approximately 40 percent and contains a sticky card with:

1. Secure donation heading
2. One-time and Monthly selector
3. four suggested amount cards with impact descriptions
4. custom amount input
5. donor-information step
6. public-name consent, unchecked by default
7. estimated fee-contribution option
8. donation, estimated fee, and total summary
9. Donate CTA

The visual system is light, warm, calm, and trust-led, with original typography, spacing, palette, and components.

### Mobile

- Use one column.
- Show campaign identity, progress, and hero before the donation form.
- Place the complete donation form immediately after the hero.
- Show a bottom Donate Now action while the form is outside the viewport.
- Use touch targets of at least 44 CSS pixels.
- Place the story and recent donations after the form.
- Respect reduced-motion preferences and avoid motion that blocks checkout.

### Supporting pages

- `/thank-you`
- `/about`
- `/contact`
- `/privacy-policy`
- `/terms`
- `/donation-refund-policy`

Sample legal copy must be visibly identified in the source content as requiring client/legal review before live launch. It must not claim legal compliance or tax deductibility without client-provided evidence.

## 5. Application Architecture

- Next.js App Router with TypeScript
- Tailwind CSS for styling
- Server Components for public campaign reads where practical
- Client Components only for interactive donation controls, sharing, and status polling
- Next.js Route Handlers for Checkout creation, verified donation status, and Stripe webhooks
- Supabase PostgreSQL for campaign and donation data
- Supabase Storage bucket `campaign-assets` for logo, hero, and OG media
- Stripe Checkout Sessions for one-time payments and subscriptions
- Vercel for application hosting, server routes, previews, and environment management

The browser never receives the Supabase service-role key or Stripe secret key.

## 6. Supabase Data Model

### `campaigns`

- `id` UUID primary key
- `slug` unique text
- `title` text
- `organization_name` text
- `organization_logo_path` text
- `hero_media_path` text
- `og_image_path` text
- `summary` text
- `story` text
- `goal_amount_usd` bigint in cents
- `status` constrained to draft or published
- timestamps

### `donation_options`

- `id` UUID primary key
- `campaign_id` foreign key
- `amount_usd` bigint in cents
- `impact_text` text
- `is_default` boolean
- `sort_order` integer
- timestamps

The seed contains USD 25, 50, 100, and 250, with USD 50 as the sample default.

### `donors`

- `id` UUID primary key
- normalized email
- first name
- last name
- optional phone
- `display_name_publicly` boolean, default false
- optional Stripe Customer ID
- timestamps

The normalized email is unique for donor-count purposes. Public responses never expose email, phone, or Stripe identifiers.

### `subscriptions`

- `id` UUID primary key
- campaign and donor foreign keys
- unique Stripe Subscription ID
- status
- base donation amount and fee contribution in USD cents
- timestamps

### `donations`

Each successful recurring invoice is its own donation transaction.

- `id` UUID primary key
- campaign and donor foreign keys
- optional subscription foreign key
- type constrained to one-time or monthly
- `donation_amount_usd` bigint in cents
- `fee_amount_usd` bigint in cents
- `total_amount_usd` bigint in cents
- optional presentment amount and currency reported by Stripe
- unique Stripe Checkout Session, PaymentIntent, and/or Invoice identifiers where applicable
- status constrained to pending, succeeded, failed, refunded, or partially_refunded
- timestamps

### `stripe_webhook_events`

- Stripe event ID as the unique key
- event type
- processing status
- processed timestamp

This table makes repeated webhook delivery safe.

### Public read model

Expose only sanitized campaign statistics and recent-donation fields through controlled views or server queries. Recent donations return either the approved display name or `Anonymous`.

Enable RLS on application tables. Anonymous clients receive no direct read access to donor or raw payment records. Privileged writes occur only on the server.

## 7. Statistics Rules

- Amount Raised is the sum of `donation_amount_usd` for succeeded donations.
- Estimated fee contributions are excluded from Amount Raised.
- Failed, pending, refunded, or duplicate transactions do not inflate the total.
- A later full refund removes that donation from the succeeded total by changing its status to refunded.
- Donor Count is the number of unique donor records with at least one succeeded donation.
- Multiple monthly invoices from the same donor increase Amount Raised but not Donor Count.
- Recent Donations use succeeded transactions ordered by confirmation time.
- A donor's name is public only when `display_name_publicly` is true; the default is false.

## 8. Checkout Flow

1. Load the published campaign and options from Supabase.
2. Donor chooses one-time or monthly and a suggested or custom USD amount.
3. Donor enters identity fields and public-name consent.
4. The UI optionally estimates the fee contribution using the sandbox formula `2.9% + USD 0.30` and labels it as an estimate.
5. The browser submits intent and donor information, not a trusted final charge.
6. The server reloads campaign data, validates limits and fields, recalculates the fee, and derives the total in integer cents.
7. The server upserts the donor, creates a pending donation/subscription intent, and creates a Stripe Checkout Session with internal IDs in metadata.
8. The browser redirects to the Stripe-hosted Checkout URL.
9. Stripe redirects to `/thank-you?session_id={CHECKOUT_SESSION_ID}` after completion or back to the campaign after cancellation.
10. The Thank You page resolves the session ID on the server and shows verified database state. It never trusts amount or status from query parameters.

The amount policy, minimum custom amount, maximum custom amount, fee percentage, and fee fixed component are centralized in server-readable configuration. The sandbox seed uses a minimum of USD 1 and a maximum of USD 100,000 per Checkout Session.

## 9. Stripe Events

The webhook route verifies the raw request body with `STRIPE_WEBHOOK_SECRET` before processing.

- One-time payments are marked succeeded only from a successful Stripe payment event associated with the known pending donation.
- Checkout completion for a subscription creates or links the subscription record but does not double-count the first charge.
- Successful subscription invoices create one donation transaction per unique Stripe Invoice ID, including the initial paid invoice.
- Failed invoice events update subscription/payment state without increasing Amount Raised.
- Refund events update the matching donation status and displayed totals.
- Unknown metadata or mismatched amounts are rejected from business-state updates and recorded for diagnosis without exposing donor data.

Webhook processing is transactional and idempotent. A repeat delivery returns success after confirming the existing event record.

## 10. Currency Policy

- USD is the campaign, goal, suggested amount, custom amount, fee, accounting, and progress currency.
- Use `Intl.NumberFormat` for all displayed monetary values.
- Enable Stripe Adaptive Pricing in sandbox when supported.
- Stripe may localize the amount and payment methods on hosted Checkout.
- Store Stripe-reported presentment amount and currency for reconciliation when available.
- Campaign statistics continue to use the USD integration amount.
- If Adaptive Pricing is unavailable for the eventual account or a given Checkout configuration, Checkout remains in USD.
- The application does not calculate its own FX rates.

This first-release interpretation satisfies localization through Stripe-hosted Checkout. A separate on-site manual currency selector would require manual currency prices or an FX-rate source and is intentionally excluded to avoid inaccurate conversion.

## 11. Thank-You and Sharing

The Thank You page supports these states:

- confirming: webhook has not completed yet; poll a bounded status endpoint
- succeeded: show verified donation amount, receipt guidance, Share Campaign, and Donate Again
- failed or canceled: show a safe retry path
- unavailable: show support/contact guidance without leaking record existence

Sharing supports Facebook, WhatsApp, X, email, copy link, `navigator.share` on compatible devices, and a QR code generated at runtime from the canonical campaign URL. Campaign metadata includes original title, description, canonical URL, and OG image.

## 12. Error Handling and Privacy

- Validate all request bodies on the server.
- Use integer minor units for money.
- Prevent negative, malformed, below-minimum, and above-maximum amounts.
- Rate-limit or otherwise protect the Checkout-creation endpoint before public launch.
- Return generic client errors and keep sensitive details in server logs.
- Do not log full donor payloads, Stripe secrets, or webhook bodies containing personal data.
- Collect only the requested donor fields.
- Do not publicly expose donor email, phone, or payment identifiers.
- Provide accessible form errors, focus management, keyboard navigation, and status announcements.

## 13. Sandbox Safety

- The initial application accepts Stripe test/sandbox credentials only.
- Payment code fails closed if a live Stripe secret is supplied while sandbox-only mode is enabled.
- Display a visible Test Mode indicator in non-live releases.
- Use separate Stripe webhook secrets for local development and Vercel.
- Never commit `.env` files or credentials.
- Moving to live payments is a separate, explicitly approved release after account-country, legal, fee, domain, and organization details are confirmed.

## 14. Testing Strategy

### Unit tests

- fee calculation and rounding
- amount bounds and integer conversion
- campaign progress calculations
- public-name rules
- money formatting

### Integration tests

- server-side Checkout request validation
- trusted recalculation instead of browser totals
- Stripe metadata linkage
- webhook signature rejection
- webhook idempotency
- one-time success
- initial and recurring monthly invoices
- payment failure and refunds
- sanitized public recent-donation output

### End-to-end tests

- desktop and mobile donation paths
- suggested and custom amounts
- one-time and monthly sandbox Checkout
- cancel and retry
- confirming and successful Thank You states
- anonymous and public-name recent donations
- keyboard navigation and critical accessibility checks

Tests that require external credentials run only when the corresponding sandbox environment variables are present. The normal local suite remains deterministic with test doubles.

## 15. Git and Deployment

1. Initialize a local Git repository on `main`.
2. Scaffold and test the application locally.
3. Create a private GitHub repository under the correct owner.
4. Push `main` to GitHub.
5. Connect the GitHub repository to the customer's Vercel Pro project.
6. Add Supabase and Stripe sandbox variables through Vercel environment settings.
7. Use Preview Deployments for review.
8. Keep the first Production deployment in Test Mode until a separately approved live-payment release.

## 16. Sample Content Policy

The seed provides a fictional organization and campaign with original English sample copy, sample contact information, a USD goal, four donation options, and clearly non-production legal content. The UI must not present sample registration numbers, tax status, beneficiary claims, donation-allocation claims, or real donor identities as facts.

Before live launch, the developer replaces all sample branding, imagery, campaign claims, contact information, and legal content with client-approved materials.

## 17. Completion Criteria

The implementation is ready for sandbox review when:

- the responsive campaign page matches the approved split-layout behavior without copying reference identity or assets
- public data is loaded from Supabase
- one-time and monthly test payments reach Stripe-hosted Checkout
- verified webhook events update Supabase exactly once
- progress, donor count, and recent donations reflect the approved rules
- the Thank You page shows only server-verified state
- no secret appears in browser output, source control, or logs
- automated tests and production build pass
- local Git history is clean and ready for a private GitHub remote
