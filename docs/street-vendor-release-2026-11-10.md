# Street vendor production release — 2026-11-10

## Published result

The new campaign is live at
<https://donate.mealsupport.org/help-street-vendor> with the confirmed **USD
2,500** goal and supplied mountain portrait.

- Project: `darklife/donation-website`, `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Production deployment: `dpl_2b3261BXtkVx1HpWKV8HRk5ZRAf1`.
- Deployment URL: `https://donation-website-e6p3323q6-darklife.vercel.app`.
- Final state: **READY**, promoted after candidate checks passed.
- A fresh inspection of the formal domain resolved this exact deployment.
- Independent campaign ID: `909d80f9-2f2d-430f-a411-5f826e9a58c6`.

The user requested publication and testing, confirmed the goal and completed
Vercel login manually. The connector could not resolve the project after team
authorization; separately authorized official CLI login succeeded. No
credentials were exported from Vercel or browser storage.

## Release source and database

The release used an isolated 205-file source snapshot based on HEAD
`3e2162331df050d2b3fcbe4f26d6bebb1d76cf89` plus the requested changes.
Existing uncommitted mango-seller preset changes and their specific test changes
were excluded and retained in the user's working directory. All uploaded file
hashes matched the reviewed manifest before the successful deployment. The
initial CLI publication did not create a Git commit or push. For subsequent
source synchronization, retain the original unpublished mango-seller preset
edits separately and commit the reviewed release source.

Only the isolated deployment snapshot included the idempotent initializer as a
post-build command. The repository's `vercel.json` and the shared project build
command were not changed. The initializer verifies the production environment,
exact project ID, database origin, campaign identity, goal, presets and final
activation. It emits sanitized results, not credentials or donor details.

Two earlier candidates failed with SQLSTATE `42501` when trying to create a
campaign absent from the database. The first reported manual success was
followed by a screenshot of the read-only check showing no campaign had been
created. The administrator then ran the approved initialization transaction
through a prefilled SQL Editor in project `tykwnwjmokbdnkqszqrh`. The next
screenshot confirmed creation and the USD 2,500 goal. The successful cloud build
independently read back the campaign as active and verified all six presets.

The transaction in `scripts/setup-street-vendor.sql` initializes only this
campaign and its presets. It changes no grants, RLS policies, other campaigns or
donation history. No Sanity import was required: the reviewed localized fallback
copy and portrait ship with the app.

## Validation

- Reviewed release source: lint, type checking, isolated production build and
  **218 relevant tests passed**. The fuller workspace and reproduced baseline
  failures are recorded in `street-vendor-landing-2026-11-09.md`.
- Actual production cloud build and initializer: passed.
- Staged candidate: authenticated HTTP checks passed in English and Arabic;
  verified the independent identity, goal, six presets, canonical/sharing
  metadata, Arabic heading/story direction and portrait checksum.
- Formal domain, without protection bypass: **six page checks passed** covering
  English, French, German, Spanish and Arabic in USD, plus French in EUR. Locale
  and currency were verified from rendered responses and serialized props.
- All page checks returned HTTP 200 with the same independent identity and
  250,000 USD minor-unit goal. At verification, raised amount and donor count
  were zero; neither was copied from another campaign.
- Formal-domain portrait bytes matched the supplied file's SHA-256 checksum.
  The stylesheet and two JavaScript assets checked returned HTTP 200.
- The existing mango-seller page returned HTTP 200 with its original identity
  (`e6ed5c3c-af72-40eb-b0e9-9819347bf339`), title, canonical URL, goal and donation
  presets unchanged from the pre-release response.
- Vercel runtime error query for this deployment returned **zero records** for
  the observed window, 2026-11-09 16:58:18–17:18:18 UTC. This is a bounded scan,
  not a guarantee about future traffic or complete monitoring coverage.

The root layout's existing HTML language remains `en`; translated campaign
content and Arabic RTL containers were checked separately. These HTTP checks
do not execute client scripts or establish live payment/wallet behavior. Local
mocked browser checks covered desktop/mobile/narrow/Arabic layouts, modal
opening/closing and one-time/monthly amount boundaries before publication.
Automatic in-app browser control remained disabled in Work settings. A request
was sent to open the published page for the user; queued UI opening alone was
not counted as verification.

No real charges, donor emails, historical payment replays or synthetic
production conversion events were used. US LCP performance and Meta's actual
receipt of donor email/name fields remain unverified; this release makes no
claim that the Meta dashboard warning is resolved. See
`meta-production-audit-2026-11-09.md` for the separate attribution findings.

## Evidence and rollback

Ignored `.local/help-street-vendor/` retains the reviewed upload manifest, cloud
status/logs, promotion result, sanitized release result, HTTP reports and
restricted response snapshots. Credentials and donor information must not be
copied into tracked release documentation.

The preceding Ready deployment is `dpl_2Moe3mBovMaM57WQ2tzZRfDz8Wpw`,
`https://donation-website-al5t40dch-darklife.vercel.app`. If an authorized rollback
is needed, restore that deployment in the same project and verify formal-domain
readback. Deactivate only the new campaign if appropriate, retaining payment
records. Follow Vercel's documented promotion behavior after rollback before
resuming automatic domain assignment.
