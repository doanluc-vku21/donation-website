# Mobile performance investigation — 2026-10-26

## Fresh production baseline

The original screenshot showed Performance 71 / Best Practices 77 without a
report URL. Fresh Google PageSpeed mobile reports for the current production
pages provide reproducible baselines, rather than attributing a changed score
to an unknown historical test:

| Page | Performance | Best Practices | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/akram-shake` | 89 | 77 | 1.5 s | 310 ms | 0 | 5.6 s |
| `/gaza-food` | 85 | 77 | 2.3 s | 440 ms | 0 | 4.3 s |

Both use Lighthouse 13.5.0, the simulated Moto G Power mobile profile and slow
4G throttling. Scores vary with CPU/network and third-party behavior; the old
71 is not a controlled before/after baseline.

Baseline reports:

- [Akram](https://pagespeed.web.dev/analysis/https-donate-mealsupport-org-akram-shake/tv8wdgx4hb?form_factor=mobile)
- [Home campaign](https://pagespeed.web.dev/analysis/https-donate-mealsupport-org-gaza-food/g9qe3whxbk?form_factor=mobile)

## Actual findings

The two failing Best Practices audits identify the same Google Pay resource:
`pay.google.com/gp/p/ui/payframe` sets an `NID` third-party cookie, also reported
in Chrome's Issues panel. This is not a finding about payment success rate,
bank charges or a confirmed application vulnerability. The additional CSP,
COOP, HSTS and Trusted Types entries are advisory checks, not these two failures.

The Akram report also identifies:

- About 101 KiB of estimated image waste: a 1080px campaign photo used in the
  small modal thumbnail and a 1536px logo used at about 34 CSS pixels.
- 371 KiB estimated unused JavaScript, mostly Stripe and Meta scripts; only
  about 49.5 KiB is first-party JavaScript. Total transfer was about 3,506 KiB.
- Stripe cost about 338 ms of main-thread work and Meta about 213 ms. Google Pay
  loaded additional Google resources during initial navigation.
- Card and wallet modules each constructed a separate Stripe instance.

## Changes

1. Match Next Image `sizes` to actual rendering: 32/34px logos, a 58px modal
   thumbnail, a 66px donate-page thumbnail, and shared responsive hero sizes.
   Mobile and desktop hero variants share the same `sizes` expression so hidden
   duplicate layout variants do not request different high-priority resources.
   Hero images/preloads also receive explicit `fetchPriority="high"`.
2. Use a single browser Stripe promise for card and wallet providers. Standard
   Stripe fraud signals remain enabled; no payment method is disabled for a score.
3. At the owner's explicit choice, Google Pay initializes after the donation
   modal is opened. Its generic Checkout Session can still be prefetched, but
   the Google Pay subtree and cookies are not needed during article viewing.
   iPhone/iPad Apple Pay retains its pre-open wallet initialization, including
   the iPad desktop-UA case. The existing custom-amount and confirmation guards
   remain in place.
4. Load the QR-code library when the share dialog opens, reserving its space
   while loading. Sharing links and copy actions remain immediately available.

This intentionally does not globally cache personalized HTML, stale donation
totals or currency selections. Payment amounts, fees, webhooks, Meta reporting
and provider fraud protections are unchanged. Google Pay's own cookie behavior
after a donor opens the payment interface remains controlled by Google.

## Validation

- 54 focused tests pass, including the existing Apple Pay/custom-amount/Meta
  behavior, iPhone/iPad platform selection, Android intent-only wallet mounting,
  one Stripe initialization across card and wallet modules, and sharing.
- TypeScript checking and lint with `--max-warnings 0` pass.
- Baseline diagnostics are retained under Git-ignored `.local/diagnostics/performance`.
  No live card authorization or charge is used for performance measurements.

References: [Next Image](https://nextjs.org/docs/app/api-reference/components/image),
[Lighthouse score variability](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring),
[Stripe Express Checkout](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components).

## Post-release samples for `177fd43`

| Page / run | Performance | Best Practices | LCP | TBT | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home campaign | 98 | 100 | 1.5 s | 90 ms | 4.0 s |
| Akram, first | 86 | 100 | 3.4 s | 200 ms | 4.3 s |
| Akram, repeat | 94 | 100 | 2.1 s | 240 ms | 2.7 s |

All samples are retained, including the first Akram score below its baseline.
Its LCP diagnostic showed 190 ms TTFB, 2,060 ms resource-load delay, 680 ms
resource transfer and 30 ms render delay. The audit specifically recommended
high fetch priority for the hero preload. The follow-up adds that hint; this
is not attributed to image-cache warming without evidence.

- [Home after](https://pagespeed.web.dev/analysis/https-donate-mealsupport-org-gaza-food/h2ik9tybem?form_factor=mobile)
- [Akram first after](https://pagespeed.web.dev/analysis/https-donate-mealsupport-org-akram-shake/n9jme1ktg2?form_factor=mobile)
- [Akram repeated after](https://pagespeed.web.dev/analysis/https-donate-mealsupport-org-akram-shake/abragmg4rm?form_factor=mobile)

Direct WebP resource checks, with the same quality setting, show a logo
reduction from 30,182 to 864 bytes, a modal thumbnail from 73,912 to 3,374 bytes,
and a mobile-sized hero from 73,912 to 45,730 bytes. These are per-resource
comparisons, not an additive page-total saving: different elements can share
a cached source resource.

## Follow-up screenshot: Performance 79 / Best Practices 100

The new screenshot again lacks a full report URL. Current same-release mobile
baselines (`72f4f84`, including both requested Meta Pixels) were measured before
the further changes below:

| Page | Performance | Best Practices | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/akram-shake` | 92 | 100 | 1.1 s | 1.7 s | 300 ms | 0 | 3.6 s |
| `/gaza-food` | 82 | 100 | 0.9 s | 2.0 s | 650 ms | 0 | 3.5 s |

This reproduces a main-thread blocking concern, rather than another Best
Practices failure. Both Meta Pixel configurations contribute script work;
neither tracking destination is removed or delayed in this change.

The prior intent-only wallet mounting still imported `@stripe/stripe-js` and
called `loadStripe` at module scope. The package injects Stripe.js on import,
so even readers who never opened Donate incurred its script cost. The shared
loader now uses the supported `@stripe/stripe-js/pure` entry point and starts
on intent on Android/desktop. Modal opening starts the SDK in parallel with
Session preparation; standalone donation flows do the same on mount. Hosted
checkout entries do not load an unused embedded SDK.

iPhone/iPad explicitly start the same singleton as soon as the existing Apple
Pay prewarm is eligible, before waiting for the prefetched Session. This keeps
SDK and backend preparation parallel for Apple Pay. A failed speculative load
can be retried, and card/wallet providers still share one promise.

The SDK is served directly from Stripe and its default advanced fraud signals
remain enabled. On Android/desktop this does shorten the pre-checkout browsing
observation window compared with loading throughout article reading; payment
integration, fraud settings and risk factors collected by the checkout SDK are
not disabled. Normal iOS prewarming remains in place. This uses the vendor's
[documented pure loader](https://github.com/stripe/stripe-js#importing-loadstripe-without-side-effects).

104 focused tests pass, including signed-context authorization, minor-unit/fee
calculations, monthly accounting, stale-amount and duplicate-confirmation
guards, SDK load retry and iOS-versus-Android startup behavior. Type checking
and lint with zero warnings also pass. Before/after performance artifacts and
recording frames stay under ignored `.local/diagnostics`.

## Follow-up: deferred Pixel SDK and idle Checkout warm-up (2026-11-16)

A fresh mobile Lighthouse run of `/gaza-food` (Moto G Power, slow 4G, simulate)
reproduced the reported shape: FCP 1.07 s, LCP 1.67 s, TBT 211 ms, but Speed
Index 3.44 s. The filmstrip is blank until 1.9 s and then paints the whole first
screen in one frame at 2.25 s; 246 KB of the 522 KB total transfer was the Meta
Pixel SDK (99 KB) plus its remote configuration (147 KB). Blocking
`connect.facebook.net` and `facebook.com/tr` measured −409 ms LCP, −151 ms TBT,
−3.0 s TTI and 276 KB total, while the single-run Speed Index moved the other
way (3.44 s → 4.18 s) because the observed frames came from an unstable
cross-continent link. Speed Index stayed the only red metric in both runs.

Two changes were made:

1. The Pixel queue and the SDK loader are now separate scripts.
   `lib/meta/pixel-bootstrap.ts` keeps only the canonical `fbq` queue, `init`
   and one `PageView` in a `beforeInteractive` inline script, which never
   touches the network. The loader that requests `fbevents.js` uses
   `strategy="lazyOnload"`, so it runs after the window `load` event in an idle
   callback. The rendered page contains no `fbevents.js` script tag: the queue
   is inlined as `self.__next_s` and the loader rides the RSC payload, which
   `next/script` injects client-side. Queued events replay when the SDK
   arrives, event IDs are unchanged, and the `noscript` `<img>` fallback stays.
2. The speculative Express Checkout warm-up no longer posts
   `/api/stripe/express-checkout` 120 ms after mount. `lib/stripe/checkout-warmup.ts`
   skips data-saver and 2G/3G `effectiveType` visitors, and the modal schedules
   the request with `requestIdleCallback` (4 s timeout). Browsers without
   `requestIdleCallback` (Safari) keep the previous 120 ms timing, so the
   existing warm-up timing assertions still describe that path. `openModal()`
   still warms synchronously, so a donor who taps Donate immediately sees no
   change, and the pre-open wallet subtree and its single Stripe instance are
   untouched.

Validation for this change: `npm run typecheck` and `npm run lint --
--max-warnings 0` pass; `tests/unit/meta-pixel-setup.test.tsx` (rewritten for
the two-script bootstrap) and the new `tests/unit/checkout-warmup.test.ts` pass
with 9 tests. The jsdom half of the suite cannot start in this environment
(`TypeError: webidl.util.markAsUncloneable is not a function` while jsdom loads
undici on Node 20.20.2); an untouched jsdom test fails the same way, so this is
an environment blocker rather than a result. `npm run build` stops at
`Missing STRIPE_SECRET_KEY` during page-data collection, which is the missing
local credential documented in the repository guidance.

## Follow-up: cached campaign content, measured bundle split (2026-11-16)

Sanity editorial content was fetched with `cache: "no-store"` on every campaign
route, in ten page files plus `lib/queries/beneficiary-content.ts`, so each
request paid a full CMS round trip even though story copy, imagery and goal
configuration only change when an editor publishes. Those reads now go through
`lib/queries/campaign-content-cache.ts` (`campaignContentCache(slug)`), which
asks for `revalidate: 60` with the tags `campaign` and `campaign:<slug>`.

Nothing else loosened: the raised amount and donor list still come from
Supabase through `getCampaignBySlug`, the locale and currency context stay
request-scoped, and every route keeps `dynamic = "force-dynamic"` and
`revalidate = 0`, so the page is still rendered per request and no visitor sees
another visitor's currency or amount. Next only honours the fetch-level
cache because the fetch carries an explicit `revalidate`; with `force-dynamic`
and no explicit config the same fetch stays uncached (`patch-fetch`: the
`force-dynamic` default only applies to fetches without their own cache
config). Expect the Sanity half of the server render to drop on the first
repeat hit; a Sanity webhook can call `revalidateTag("campaign:<slug>")` to
skip the window.

The donation flow was then tried as a `next/dynamic` chunk. It works: the
page's initially referenced client chunks fell from 63.7 KB to 41.5 KB gzipped
(about 22 KB, a 22.4 KB chunk emitted separately). It was reverted anyway.
`components/donation/donation-flow.tsx` holds the pre-open wallet subtree, and
four tests in `tests/unit/express-checkout-loading.test.tsx` assert that the
wallet exists right after mount; those assertions are the encoded form of the
contract in `docs/apple-pay-wallet-warmup.md`. Deferring the chunk also puts a
chunk fetch in front of the first Donate tap on slow connections, which is the
latency the wallet warm-up exists to remove. The split is worth revisiting
together with a preload on the Donate trigger, not on its own.

Validation for this change: `npm run typecheck`, `npm run lint --
--max-warnings 0` and the full suite under Node 22 (`vitest run`, 61 files,
591 tests) pass except five failures that also fail on a clean `HEAD`
worktree: `campaign-story.test.tsx` (2), `campaign-page.test.tsx` (import
needs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and `donation-panel.test.tsx` (3).
`npm run build` completes once placeholder Stripe, Supabase and Sanity values
are supplied for a local compile; no Stripe, Supabase or Sanity request is made
by that build.
