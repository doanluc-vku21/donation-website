# Street-vendor USD 200 / 150 / 100 first row — 2026-11-10

The owner explicitly requested first-row USD 200 / 150 / 100, second-row
USD 75 / 50 / 25, identical monthly and one-time options, USD 100 recommended,
and retention of the 18 display contributions and USD 775 baseline. Publication
and post-deployment checks were explicitly authorized.

The option configuration and its regression tests were updated. Both
frequencies now contain `[20000, 15000, 10000, 7500, 5000, 2500]` USD cents,
with only 10000 featured. The descending-order renderer and three-column grid
already provide the requested rows. A source-manifest comparison against the
preceding published snapshot confirmed exactly three changed files:

- `lib/street-vendor-campaign.ts`.
- `tests/unit/street-vendor-campaign.test.ts`.
- `tests/unit/express-checkout-loading.test.tsx`.

All other application and test sources match the preceding release. The
approved 18-entry display baseline, USD 775 amount, confirmed-payment counting,
repeat-gift handling and automatic updates remain. No database/CMS write,
environment change, payment confirmation or donor email was performed.

## Validation and live result

- Lint with zero warnings and both TypeScript 7 / TypeScript 6 checks passed,
  using isolated Node 24.22.1 / npm 12.2.1.
- Full suite: **433 passed, 7 failed, 440 total**. Comparing failure names with
  the preceding freshly executed report confirmed the same seven existing
  campaign-page, campaign-story and donation-panel failures.
- Regression checks cover six-option order in both frequencies, USD 100
  default selection/wallet warm-up, absence of the USD 125 button, and USD 200
  and USD 150 single-gift wallet requests with correct integer minor units.
- The final production cloud build passed. English/USD and Arabic/USD staged
  checks returned 200 with the intended options, matching counters and baseline.
- After promotion, public formal-domain checks returned 200 in all five
  supported languages. Each had the exact six options, USD 100 recommended,
  the original 18 display rows, 18 total contributions and USD 775. At that
  check, the campaign had zero independently counted successful payments.
- A browser at a temporary 390×844 viewport confirmed the two rows for monthly
  and one-time gifts, default USD 100, and a USD 200 total after selecting that
  button. Returning between frequencies restored the recommended USD 100.
  The browser viewport was reset afterward; screenshots were retained.
- The bounded browser console sample contained zero errors. The deployment's
  error/fatal scan returned zero records for 2026-11-10 14:52:31–15:07:31 UTC,
  with no excluded intervals or further page.

No real charge was made. These checks do not establish actual wallet
authorization, successful live card payment or Meta receipt of a new Purchase.

## Published source and rollback

- Project: `darklife/donation-website`,
  `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Deployment: `dpl_GoqHkC6REtGBJhxfCFdmnN1vKczK`, READY / Production.
- URL: <https://donation-website-p9gw3wvc9-darklife.vercel.app>.
- Formal page: <https://donate.mealsupport.org/help-street-vendor>.
- Staged checks preceded promotion. Formal-domain inspection afterward resolved
  this exact deployment.
- Source: base `ca8878a6a4124fa64c42700963158d0f08015bde` plus the reviewed
  working-directory edits. Source manifest SHA-256:
  `483964ae6088391e2b22b45f81df85f63d52763ec99bbe76cee949ec8d33bcf3`.
  The isolated snapshot contained 221 files including `.gitignore`; the dry
  run uploaded 220 files, excluding `.gitignore` and local Vercel linkage.
- No Git commit or push was requested or performed. Earlier local edits and
  untracked release records were preserved.

Evidence is retained under restricted, ignored
`.local/street-vendor-200-presets-2026-11-10/`. For an authorized rollback,
promote preceding Ready deployment `dpl_EvNEkhQedvYFkS3o5gUEGyQ7JVBv` in
`darklife`, then verify the formal domain. This restores the preceding
USD 150 / 125 / 100 first row while retaining the 18/USD 775 baseline. No
database or environment rollback is required. Rollback was not executed.
