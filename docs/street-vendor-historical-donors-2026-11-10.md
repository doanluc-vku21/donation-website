# Reported historical donor count — 2026-11-10

The campaign owner confirmed that approximately 700–800 people donated through
an earlier platform or offline. The street-vendor page therefore displays a
conservative **700+ donors** summary near the donation progress on mobile and
desktop. This is an organizer-reported historical aggregate, not a count
independently established from the current website's payment records.

The visible explanation identifies historical/offline donations as the source
and states that the amount raised above reflects online donations only. Both
the count label and explanation support English, French, German, Spanish and
Arabic. No individual donors, amounts or timestamps are generated. The online
campaign's donor count, donation list, amount raised, goal and checkout logic
are not changed. The reported lower bound is not added to the online count,
avoiding an unsupported claim about deduplication across channels.

The shared campaign layout accepts an optional summary slot; only
`/help-street-vendor` supplies it. The existing page isolation/accounting tests
continue to require unchanged online totals and donation records. Lint with
zero warnings, type checking and all 25 tests across the four relevant test
files passed before publication. Live delivery and screenshots are retained in
ignored `.local/help-street-vendor/`.
