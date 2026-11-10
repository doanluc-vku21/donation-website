# Six street-vendor presets and restored display baseline — 2026-11-10

## Approved outcome

The owner corrected the preceding request: retain the existing 18 displayed
contributions and USD 775 starting amount. The owner then explicitly selected
six amounts for both monthly and one-time donations, ordered USD 150, 125, 100,
75, 50, 25, with USD 100 recommended. The follow-up screenshot confirmed adding
three more boxes to the existing three-column layout.

This record supersedes the preceding pure-contribution display decision.
Earlier dated release records remain historical evidence.

## Implementation

- Restored the original 18 display records and their USD 775 total. The
  displayed count is 18 plus the exact count of successful payment records for
  this campaign; displayed funds add USD 775 to the campaign's existing real
  accounting. The 724 historical offset remains removed. No preset record was
  inserted into the database or independently verified as a real payment.
- Both upper summaries and lower contribution badges use the same displayed
  total. Repeat successful donations still count separately, while webhook
  idempotency and server-confirmed payment status are unchanged.
- Separated the displayed total from the confirmed-payment count passed to
  the refresh component. The event stream still sends raw confirmed counts,
  preventing needless refreshes caused by comparing 0 confirmed payments with
  an 18-entry display baseline.
- Both frequencies now contain the six explicit options. Exactly USD 100 is
  featured in each, so the initial form selection and wallet warm-up agree.
- DonationFlow sorts only this campaign's presets in descending order. The
  existing three-column grid naturally shows two rows. Other campaigns retain
  their prior ordering and presets, including the previously published USD 25
  mango-seller and Akram choices.
- Custom amount minimums, currencies, fees, payment confirmation and email/Meta
  delivery were not changed. No production environment or database/CMS write
  was required.

## Validation

- ESLint with zero warnings passed. TypeScript 7 and the compatible TypeScript
  6 checks passed using isolated Node 24.22.1 / npm 12.2.1.
- Full suite: **433 passed, 7 failed, 440 total**. The seven failing case names
  exactly match the freshly executed prior-release baseline (campaign-page,
  campaign-story and donation-panel). No new failure was introduced.
- Regression coverage checks both six-option sequences, exactly one USD 100
  recommendation per frequency, USD 100 warm-up, default monthly/one-time
  selections and a USD 125 wallet request. It also checks restored totals,
  18→19→20 updates, repeated snapshots, capped lists, retained form state and
  raw-count event comparison with the 18-entry baseline.
- Production cloud build passed before promotion.
- Staged English/USD and Arabic/USD street-vendor responses returned 200 with
  the restored total and both complete preset sequences. Mango-seller and
  Akram responses returned 200 with their preceding presets.
- Public formal-domain checks returned 200 in English, French, German,
  Spanish and Arabic. All four mobile/desktop summary/badge locations showed
  18; funds were USD 775 and the 18 display records were present. At the time
  of checking, the independently read confirmed-payment count was zero.
- The public event stream returned HTTP 200, raw count zero and a heartbeat.
  The operator deliberately ended the sample after seven seconds; curl exit
  28 reflects this sampling deadline rather than an HTTP error.
- A browser confirmed the desktop six-button order, then a 390×844 mobile
  viewport confirmed two rows for both frequencies, USD 100 selected and
  recommended, the correct USD 100 total and rendered wallet/card controls.
  Screenshots were retained; the temporary viewport override was reset.
- The browser console sample contained zero error entries. The deployment's
  error/fatal query returned zero records in the bounded window
  2026-11-10 14:47:03–15:02:03 UTC, with no excluded intervals or further page.

No payment confirmation, real charge, donor identity, donor email or synthetic
Purchase event was submitted. Genuine post-payment counter movement and
real-device wallet authorization remain unverified; those transitions were
covered with mocks.

## Publication and rollback

- Project: `darklife/donation-website`,
  `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Production deployment: `dpl_EvNEkhQedvYFkS3o5gUEGyQ7JVBv`, READY.
- URL: <https://donation-website-cyt0uetbw-darklife.vercel.app>.
- Formal page: <https://donate.mealsupport.org/help-street-vendor>.
- The candidate was checked before promotion; a formal-domain inspection
  afterward resolved the exact new deployment.
- Source: base commit `ca8878a6a4124fa64c42700963158d0f08015bde` plus reviewed
  working-directory edits. Manifest SHA-256:
  `bd5152a692a4dcb876b73ca758be159c14dd5d18a4e0e9a416ba6bb51f57dcd4`.
  The isolated snapshot contained 221 files including `.gitignore`; the dry
  run uploaded 220 files, excluding `.gitignore` and local Vercel linkage.
- No Git commit or push was requested or performed. Prior untracked release
  documents and the ongoing local changes were preserved.

Restricted evidence is under ignored
`.local/street-vendor-six-presets-2026-11-10/`. For an authorized rollback,
promote preceding Ready deployment `dpl_DrqpWdRAWatCihEMYfUBe3dALEkv` in
`darklife`, then inspect the formal domain. That rollback would restore the
preceding zero-offset display and three-button street-vendor choices; it would
undo the current requested 18/USD 775 baseline and six presets. No database or
environment rollback is needed. Rollback is recorded, not executed.
