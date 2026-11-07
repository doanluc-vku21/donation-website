# Hide one public test contribution — 2026-11-08

The user supplied a screenshot identifying a newly made $10 monthly test
contribution displayed as `Donor` on `/akram-shake-2`. Read-only inspection of
the public page found 97 contribution rows. The newest matching record is
`838ce591-f138-439c-9258-0f421dff2d4d`; six other $10 monthly records belong to
other displayed donors and are retained.

The presentation exclusion in `lib/public-donations.ts` matches that exact ID.
The shared `RecentDonations` component applies it before previewing, counting
visible contributions and sorting the full dialog. It does not modify the input
array or match donations by name or amount. Supplied monthly supporter totals
remain unchanged.

This is a public visibility change, not a database deletion or a privacy
access control. Existing database/RPC results retain the payment. Donation
records, campaign financial totals, donor statistics, Stripe payments and
subscriptions remain unchanged. No refund, cancellation, CMS/database mutation
or credential change is included.

Validation: 36 relevant list, monthly supporter query and progress tests pass;
ESLint with zero warnings, TypeScript checking and diff checks pass. Tests cover
the preview, full dialog, sorting, preservation of other ten-dollar payments
and same-name donors, unchanged input data and unchanged supporter totals.

The release uses the existing `origin/main` production workflow. Rollback is to
remove this ID from the display exclusion or revert the source change; no data
restoration is necessary. The preceding release is `dc88a95`.

## Latest-donation hint follow-up

A subsequent screenshot showed that the inline mobile progress summary and
sticky bar still displayed the test payment. The first patch filtered only the
contribution list; the mobile hero, desktop donation card and mobile sticky bar
each read the first entry directly from the unfiltered campaign data.

`CampaignPage` now creates a public presentation copy of the campaign before
passing it to any child component. The same ID exclusion therefore applies to
all three latest-donation hints, both contribution lists and the modal's
campaign props. The next eligible real donation becomes the latest public gift;
when there is none, no latest-gift hint is rendered. Financial totals, supporter
counts and the source campaign object remain unchanged.

Regression tests render the actual three summary components through the shared
page, including the sticky bar after scrolling. They cover both a normal gift
and a legitimate ten-dollar gift after the hidden test payment, plus a campaign
with no public gifts. The rollback baseline for this follow-up is `a410ed9`.
All 59 focused tests pass across page-wide visibility, contribution lists,
supporter progress, campaign routes and card donation flows. ESLint with zero
warnings, TypeScript checking and diff checks also pass.
