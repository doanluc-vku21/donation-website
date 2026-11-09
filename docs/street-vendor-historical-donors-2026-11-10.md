# Reported historical donor count — 2026-11-10

The campaign owner confirmed that approximately 700–800 people donated through
an earlier platform or offline. The street-vendor page therefore displays a
conservative **700+ donors** summary near the donation progress on mobile and
desktop. This is an organizer-reported historical aggregate, not a count
independently established from the current website's payment records.

The visible explanation identifies historical/offline donations reported by the
organizer as the source. The label and explanation support English, French,
German, Spanish and Arabic. This change generates no individual donors, amounts
or timestamps and preserves the existing campaign totals, donation records,
goal and checkout logic. The reported lower bound is not added to other counts,
avoiding an unsupported claim about deduplication across channels.

Source review found that a separate pre-existing commit, `99da1a0`, had added
18 display seed contributions totaling $775. Those entries are separate from
the owner's reported historical aggregate and were not independently validated
by this change. The explanatory text therefore makes no claim that the existing
displayed amount is exclusively database-confirmed online payments.

The shared campaign layout accepts an optional summary slot; only
`/help-street-vendor` supplies it. The existing page tests cover the independent
campaign identity and its existing display data. Lint with
zero warnings, type checking and all 25 tests across the four relevant test
files passed before publication. Live delivery and screenshots are retained in
ignored `.local/help-street-vendor/`.
