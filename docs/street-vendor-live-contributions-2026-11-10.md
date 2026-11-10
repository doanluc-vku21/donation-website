# Synchronized street-vendor contributions — 2026-11-10

## Requested behavior and implementation

The owner requested matching upper and lower counters, starting at the existing
18 display contributions and increasing to 19, 20 and onward as confirmed
payments arrive. Both locations now use the label Contributions and the same
server-calculated total. The unrelated 724 historical-donor offset was removed.

The additional count comes from an exact, server-only count of `donations`
rows for this campaign with `status = succeeded`. It counts payment records,
including repeat gifts, rather than distinct people or the capped 100-entry
recent-donation list. The existing 18 seed entries remain display data; they
were not inserted into the database or independently verified as paid gifts.
Campaign amounts, payment confirmation, webhook idempotency and email/Meta
delivery behavior are unchanged.

Only this campaign enables a 15-second server refresh. Returning to the page
or restoring connectivity also refreshes data. Hidden/offline visits and a
pending refresh do not start overlapping updates. Next.js merges the updated
server response while retaining client form and wallet state. No optimistic
count increments or payment-confirmation requests are generated. An unavailable
database count raises a server error instead of inventing a zero-payment total.

The bottom contribution badges receive the same explicit total as both upper
summaries, independent of visible-list length. Existing translation strings
cover English, French, German, Spanish and Arabic, including RTL layout. Other
campaigns retain their previous counting and refresh behavior.

## Validation

- ESLint with `--max-warnings 0` and type checking passed using isolated Node
  24.22.1 / npm 12.2.1.
- Full suite: **417 passed, 7 failed, 424 total**. Comparing the current JSON
  report with the freshly executed pre-change report confirmed exactly the
  same seven failing case names in campaign-page, campaign-story and
  donation-panel tests. All 21 added cases passed; no new suite failure appeared.
- Coverage includes 18→19→20, repeated identical snapshots, all five languages,
  counts beyond the recent-list cap, campaign/status query scoping, unavailable
  counts, hidden/offline visits, cleanup and slow-refresh concurrency.
- Actual DonationModal regression coverage retained the selected custom amount,
  existing wallet DOM and request count after fresh campaign props arrived.
- The production cloud build passed before domain promotion.
- Staged English/USD and Arabic/EUR street-vendor pages returned 200 and showed
  matching counts in all four rendered mobile/desktop summary/badge locations.
  The mango-seller candidate returned 200 with its existing USD 20 / 50 / 75
  single-gift presets.
- After promotion, the formal-domain street-vendor page returned 200 in all
  five supported languages without Vercel protection bypass. Each response
  showed a total of 18 in all four locations, with the former 742 label absent.
- A browser on the formal domain confirmed the upper and lower labels. A USD
  35 custom amount remained after more than one refresh interval. The bounded
  browser console read contained zero error entries. Screenshots are retained
  in ignored local evidence.
- No real payment, donor identity, email, synthetic Purchase event or database
  mutation was submitted for validation. Actual 18→19 movement after a genuine
  payment remains a live follow-up; the increment behavior was verified with
  mocked data rather than a real charge.

## Published deployment and source

- Project: `darklife/donation-website`,
  `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Production deployment: `dpl_8976E6pu1DU4GMuCdyDwxRs9Apfm`.
- Deployment URL: <https://donation-website-4ubizh9h3-darklife.vercel.app>.
- Formal page: <https://donate.mealsupport.org/help-street-vendor>.
- State: READY; staged checks passed, then promotion succeeded. A subsequent
  formal-domain inspection resolved this exact deployment.
- Source: base commit `ca8878a6a4124fa64c42700963158d0f08015bde` plus the reviewed
  working-directory changes. No Git commit or push was requested or performed.
- Source manifest SHA-256:
  `90bddc6efc85f868e691f76b056a6fabe02cfc98106661bc2857c3f6db491386`.
  The isolated snapshot contained 215 files including `.gitignore`; the CLI
  dry run uploaded 214 files, excluding `.gitignore` and local Vercel linkage.
  The deployment records the base commit and source manifest hash as metadata.

The earlier untracked `production-release-2026-11-10.md` was preserved. The
snapshot excludes local credentials, dependencies and diagnostic materials.
Evidence is under restricted, ignored `.local/street-vendor-live-2026-11-10/`.

## Separate runtime finding and rollback

A runtime error/fatal scan for the new deployment returned one error during
2026-11-10 14:15:54–14:25:54 UTC: the existing abandoned-donation cron could not
retrieve an old Stripe test-mode Session. A fresh scan of the preceding
deployment returned two errors for that same test Session, establishing that
the issue predates this change. The cron source is unchanged. No reminder job
was manually invoked, historical record changed or email sent to diagnose it.

To roll back, promote the preceding Ready production deployment
`dpl_5BcJJxMkb4HPzj9oQ5fSU7k1DoZs` within `darklife`, then inspect the formal
domain and check its response. This restores the preceding display behavior;
no database migration or environment rollback is needed. Rollback is recorded,
not executed.
