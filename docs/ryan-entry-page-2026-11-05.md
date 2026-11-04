# Ryan entry page — 2026-11-05

The authorized update applies to `/akram-shake-2` on the existing
`donation-website` Vercel production project (`prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`).

- Replace Akram with Ryan in this page's localized campaign display copy,
  including its donation-modal heading. Keep the shared CMS document, campaign
  IDs, slug, payment attribution and other entry pages intact.
- Hide relative donation times in the preview and expanded contribution list.
- Show the selected preset in the amount input without treating it as a custom
  edit or losing the selected radio. Manual edits retain existing recovery.
- Interpret the supplied `$25` correction as the actual minimum, in USD or its
  converted equivalent. Apply it to this entry page's options, input validation,
  card/wallet Session creation, and subsequent wallet amount updates. Preserve
  monthly and one-time choices.

## Validation

- Lint with zero warnings and TypeScript checking passed.
- All 125 focused tests passed (campaign rename, contributions, payment loading,
  monthly checkout, and wallet amount updates).
- Production build passed with isolated placeholder configuration. This does
  not establish real service connectivity; Vercel supplies production config.
- The unconfigured full suite reported 258 passing tests, six failures in old
  story/donation-panel/Pixel assertions, and one suite blocked by the missing
  local Stripe publishable key. No unrelated application behavior was changed
  to satisfy those assertions. Baseline diagnostics are kept in ignored `.local/`.
- No payment confirmation or donor email is part of validation.

## Release and rollback

The pre-release production deployment is `dpl_7g2PFa6b3o3Lb2i8GBAfzNnDDCNB`,
commit `0676d47652306b8c3b30e8f6a24cd5811475007a`. Roll back to that deployment
or revert this change and release the resulting commit. The change requires no
database migration or CMS write.
