# Confirmed-only contributions and $25 presets — 2026-11-10

## Requested behavior

The owner approved the follow-up request to exclude both the 724 historical
offset and the 18 preset street-vendor contributions, count every successful
payment including repeat gifts, and update automatically without a document
reload. The supplied screenshot also requested replacing the $20 preset on
`/help-mango-seller` and `/akram-shake-2` with $25.

The operator stated before implementation that this changes preset buttons,
not the existing custom-amount minimum policy. No production settings,
database/CMS writes, real charges or donor emails were needed.

## Implementation

- Street-vendor counters now use only an exact count of that campaign's
  `donations` rows with `status = succeeded`. The count includes repeat gifts
  and is independent of donor deduplication and the recent-list cap.
- Both mobile/desktop upper summaries and lower contribution badges receive
  the same total. No browser-side increment is performed; duplicate events
  simply cause a fresh authoritative read.
- The 18 preset records and their USD 775 display total were removed from
  street-vendor rendering and definitions. The 724 offset was already removed
  by the preceding release. No historical database payment was changed.
- A campaign-scoped, read-only server-sent event endpoint checks the confirmed
  count every three seconds and emits the count when changed. It sends no
  donor/payment identity. Connections close after 50 seconds, before the
  60-second function limit, and native EventSource reconnects after 3 seconds.
  The route rejects invalid IDs and other/inactive campaigns.
- The client merges fresh server data when the count changes. It retains the
  existing 15-second reconciliation and visibility/connectivity recovery.
  Hidden/offline clients close their stream; returning creates one connection.
  Updates preserve the existing form and wallet subtree. This is near-real-time
  detection with database/network latency, not a database-triggered subscription.
- Mango-seller monthly and single-gift presets now begin at USD 25. Akram's
  upsell normalizes existing USD 20 options to USD 25. Normalization avoids
  duplicate buttons per frequency. Its existing USD 50 / 100 / 150 one-time
  presets remain; no USD 20 one-time preset was present in the live source.
- Custom minimums remain mango USD 20, Akram monthly USD 20 / one-time USD 25,
  and street-vendor USD 20. Payment validation, signed wallet updates, webhook
  verification/idempotency and attribution delivery are unchanged.

## Validation

- Full unit suite: **430 passed, 7 failed, 437 total**, using isolated Node
  24.22.1 / npm 12.2.1 and placeholder/mock service configuration.
- An exact failure-name comparison with the freshly executed preceding-release
  report confirmed the same seven failures in campaign-page, campaign-story
  and donation-panel. No new failing case was introduced.
- The focused eight-file run passed 85 cases. After adding the final page
  normalization case, the full-suite run covered it. The first cloud build
  caught an implicit-any annotation omitted in that new test. The annotation
  was fixed, the final 16 page tests reran successfully, and both TypeScript 7
  and the build-compatible TypeScript 6 checks passed. Application behavior was
  unchanged by that test-only correction.
- ESLint with zero warnings passed. The final production cloud build passed.
- Stream tests cover authoritative 0→1→2, unchanged values, query failures,
  non-overlapping slow queries, abort/cancel cleanup and finite connection life.
- Candidate checks returned 200 for street-vendor English/USD and Arabic/USD,
  mango-seller and Akram. New deployment DNS initially failed on this computer;
  Windows DNS subsequently resolved the hostname. Candidate HTTP checks used
  the observed IPv4 address with curl `--resolve`, retaining hostname/TLS
  verification and the normal Vercel CLI authentication path. No DNS or access
  configuration was modified.
- Candidate and public event streams returned HTTP 200, count 0 and a heartbeat.
  The operator deliberately terminated each sample after seven seconds;
  curl exit 28 therefore reflects the sampling deadline, not an HTTP failure.
- Public formal-domain street-vendor pages returned 200 in English, French,
  German, Spanish and Arabic. All four rendered summary/badge locations agreed
  on 0. The real campaign amount was 0 and no preset donation rows remained.
- Public mango-seller and Akram pages returned 200 with the intended presets.
  Browser inspection confirmed mango monthly/single USD 25 buttons, a selected
  USD 25 single-gift total and card button, and Akram's monthly USD 25 button.
  Screenshots are retained in the ignored release evidence directory.
- Runtime error/fatal query: zero records for this deployment in the bounded
  2026-11-10 14:28:08–14:43:08 UTC window, with no excluded intervals or next page.

No real successful payment was created for verification. Live count movement
after a genuine payment, actual wallet authorization and Meta CAPI receipt
remain outside these checks; count transitions and recovery were mocked.

## Publication and rollback

- Project: `darklife/donation-website`,
  `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Published deployment: `dpl_DrqpWdRAWatCihEMYfUBe3dALEkv`, READY / Production.
- URL: <https://donation-website-fr34nvxta-darklife.vercel.app>.
- Formal domain: <https://donate.mealsupport.org>.
- The candidate was tested before promotion. A subsequent formal-domain
  inspection resolved this exact deployment.
- Source: base `ca8878a6a4124fa64c42700963158d0f08015bde` plus reviewed local edits.
  Source manifest SHA-256:
  `5b8bc7ddbe6ce13aeacf59a662594ac4867d64235518277251a9c26b5cdf7f46`.
  The isolated archive contained 221 files including `.gitignore`; the dry run
  uploaded 220 files, excluding `.gitignore` and local Vercel linkage.
- No Git commit or push was requested or performed. Earlier untracked release
  documents were preserved. Credentials and ignored diagnostic files were not
  uploaded as source.
- The unsuccessful pre-promotion candidate was
  `dpl_7538DUJun1A2YUzJbaxRmifcpqxm`; it never received production aliases.

Restricted evidence lives under ignored `.local/pure-contributions-2026-11-10/`.
For an authorized rollback, promote preceding Ready deployment
`dpl_8976E6pu1DU4GMuCdyDwxRs9Apfm` within `darklife` and verify the formal
domain. That would restore the preceding 18-entry display baseline and $20
mango preset. No database or environment rollback is required.
