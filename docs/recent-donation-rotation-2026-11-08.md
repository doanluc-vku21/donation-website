# Recent donation rotation — 2026-11-08

On campaign pages that display recent-donation hints, a visit starts with the
newest eligible public donation and advances to the next entry every six seconds,
wrapping to the beginning. The order comes from the existing recent-donation
query. There is no additional polling, shared clock, or persisted visitor index.

`RecentDonationRotationProvider` owns one browser-local interval for the page.
The mobile hero, mobile sticky bar and desktop donation summary consume that
same selection. A sticky bar mounted after scrolling immediately shows the
current selection without restarting the timer. Separate mounts have independent
timers; unmounting cleans up the interval. Empty and single-entry lists, and
supporter-progress pages without these hints, do not start an interval.

The hint includes keyboard-accessible pause/resume controls, translated into all
five supported languages, with Arabic text direction. Pausing any control pauses
all hints on that page. Resuming starts a full six-second interval. Automatic
text changes are not announced as a live region. Long names can truncate while
the amount and control remain visible.

Currency-only refreshes preserve the selection and clock. A different sequence
of donation IDs starts with its newest entry and a new interval. Changing the
campaign remounts the provider. The server page and desktop summary remain
server components; rotating the selection does not rerender the payment modal.

The existing exact-ID test-contribution exclusion still applies. Other real
historical gifts, including $10 gifts, remain eligible. Anonymous amounts retain
their existing hidden presentation. Financial totals, supporter counts, payment
records, subscriptions, donation minimums and the contribution list are unchanged.
No database writes, real payments or donor emails are part of this release.

## Validation

- ESLint with zero warnings and TypeScript checking pass.
- All 43 relevant tests pass across public campaign donations, contribution
  lists and monthly supporter progress. Coverage includes exact timing,
  wraparound, delayed sticky mounting, independent visits, clean unmounts,
  shared pause/resume, currency refreshes, new donations, anonymous amounts,
  hidden test contributions and all five control translations.
- Full suite: 334 passed, 8 failed. The eight failures match the freshly recorded
  pre-change baseline: two campaign page router mocks, two story copy assertions,
  three donation panel default-amount assertions and one Meta Pixel assertion.
- A local production build passes using isolated placeholder service
  configuration. This checks compilation and server/client boundaries; live
  service behavior is verified separately after deployment.

Release target: the existing `darklife / donation-website` Vercel production
project through `origin/main`, serving `donate.mealsupport.org`. The preceding
production commit is `c967a50cdf09596a7d1addd896f6f9454c216f56`; reverting this
change restores static latest-donation hints without a data migration.

## Failed deployment and import repair

The first Git deployment, `dpl_Atw9WSSLZTynhDT5PrgAzjtThVBY` for `5d51528`,
failed. A clean source archive reproduced TypeScript error TS2304 in
`components/donation/mobile-donate-bar.tsx`: `getUiTranslations` was not found.
Removing the unused translation variable from `MobileDonateBar` had also removed
the import still required by the file's separate `RaisedText` component. The
earlier successful local build preceded that last cleanup, so it did not validate
the exact source that was pushed.

The repair restores only the shared translation import. A fresh isolated source
installation and production build now pass, as do lint with zero warnings,
type checking and all 43 relevant tests. The build uses placeholder service
configuration and does not invoke production payments or data writes. Unrelated
working-tree changes are excluded from this repair release. Production deployment
status and browser behavior must be checked after pushing the repaired source.
