# Currency symbols and in-modal currency switching — 2026-11-14

## Reported issues

Donor-facing report on the `/help-gaza` donation modal (`donate.mealsupport.org`):

1. A custom amount below the page minimum made the amount disappear entirely
   (typed `2499` BDT and nothing was shown).
2. Amounts rendered as `BDT 3,124` instead of a symbol.
3. The currency could not be changed from inside the modal.
4. The currency list should look better than the OS-rendered native select.

Root cause of (1): the "Total per month" summary was rendered only when
`hasValidAmount` was true, so a below-minimum custom amount hid the total and
the warning was the only feedback.

## Change

- `components/donation/donation-flow.tsx`: the summary now renders whenever
  `amount > 0` (`displayTotal`), the minimum warning offers a one-tap
  `Use <minimum>` action, and a new `changeCurrency` keeps the donor's USD
  value, resets the Stripe/Express sessions and re-anchors the amount.
- `components/donation/currency-picker-sheet.tsx`: portal sheet with search,
  quick picks (USD, BDT, PKR, INR, EUR, GBP, AED, SAR), symbol badges, active
  checkmark, Escape and RTL support. `CurrencyChipButton` opens it from the
  "Choose your gift" heading and replaces the previous `BDT` input suffix.
- `app/api/currency/rate/route.ts`: `GET /api/currency/rate?currency=XXX`
  returns `{ currency, rate }` from the existing server-only exchange-rate
  helper, `400` for unsupported codes and `502` when the rate cannot load.
- `lib/money.ts`: `formatMoney` accepts `currencyDisplay`, so the amount step
  uses `narrowSymbol`. Default formatting on other surfaces is unchanged.
- `lib/ui-translations.ts`: new copy in all five locales.

## Validation

- ESLint with zero warnings: passed. Type checking: passed.
- `tests/unit/money-symbol-format.test.ts` (3) and
  `tests/unit/donation-currency-switch.test.tsx` (5) cover symbol formatting,
  the visible below-minimum amount, the quick-fill action, the in-modal switch
  and a failed rate response.
- `tests/unit/express-checkout-loading.test.tsx` minimum-amount assertions
  moved from `USD 20` to `$20`.
- Suite results: the jsdom suites do not start on the local Node 20 runtime
  because the installed `undici` requires Node >= 22.19
  (`webidl.util.markAsUncloneable`). Running them with a temporary
  `worker_threads` preload passed every payment, wallet and Meta suite,
  including `express-checkout-loading` (43), `donation-card-checkout` (23),
  `monthly-campaign-checkout` (75) and `akram-monthly-campaign` (8). The five
  failures in `campaign-page`, `campaign-story` and `donation-panel` reproduce
  identically on an unmodified checkout of `58232c3`.
- `npm run build` compiles and type-checks, then stops at
  `Missing STRIPE_SECRET_KEY` while collecting `/api/stripe/express-checkout`
  because this workspace has no environment file. The cloud build succeeded.

## Release

- Commit `e395609` on `main`, pushed to `origin`.
- Vercel production deployment `2gC6AvrT8z4DKhEiLzwLUWPrSDiJ`
  (`darklife/donation-website`) reported READY.
- `https://donate.mealsupport.org/api/currency/rate?currency=BDT` returns
  `200 {"currency":"BDT","rate":124.95}`, `?currency=USD` returns `1`, and an
  unsupported code returns `400`.
- The served client chunk `/_next/static/immutable/chunks/1oo_bb9vj97ce.js`
  contains `Change currency`, `Choose currency`, `Search currency` and
  `api/currency/rate`, confirming the new UI is live.

## Follow-up fixes after the first deploy

The first release surfaced two device bugs on the live site.

1. The currency chip did nothing. The sheet was a body portal at `z-[95]`
   while the donation modal overlay sits at `z-[300]`, so the sheet opened
   underneath the modal. The overlay is now `z-[400]`, and taps that reach the
   freshly mounted backdrop within 350 ms of opening are ignored so the opening
   tap cannot close it again.
2. The custom amount field accepted only one digit. On the upsell pages the
   field mirrored the selected preset (`6247.5`), so typed digits appended to
   that value and read as `6247.5455`. The field now mirrors the preset only
   while it is unfocused and starts empty as soon as the donor focuses it.
3. Presets showed fractional local amounts such as `৳3,123.75` because the
   provider rate is 124.95. `lib/money.ts` gained
   `convertUsdToWholeCurrencyMinor`, which rounds a converted preset to whole
   major units, and the preset label, the selected amount and the Stripe
   amount all use it, so the grid, the total and the charge agree:
   `৳3,124 / ৳6,248 / ৳9,371`.

Regression coverage lives in `tests/unit/donation-currency-switch.test.tsx`
(fresh typing after a preset, whole-unit presets, sheet stacking) and
`tests/unit/money-symbol-format.test.ts` (whole-unit conversion).

## Known behavior and rollback

Switching currency writes the `site_currency` cookie but does not call
`router.refresh()`: the modal keys `DonationFlow` on the currency, so a refresh
would remount and discard the typed amount. The switch holds inside the open
modal and on the next page load; reopening the same modal without a navigation
shows the previous currency.

To roll back, promote the previous production deployment `58232c3` in the
Vercel project; no database, CMS or configuration change is involved. No real
donor charge, email or payment Session was created during validation.
