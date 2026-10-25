# Lint compatibility repair — 2026-10-25

## Toolchain

`typescript-eslint` aborted before inspecting any source because the project's
`typescript` package was TypeScript 7.0, whose native compiler does not expose
the legacy JavaScript compiler API. The installed React, JSX accessibility and
import plugins also declare ESLint 9 compatibility rather than ESLint 10.

The dependency layout now follows Microsoft's
[side-by-side TypeScript guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60):

- `@typescript/native` aliases `typescript@7.0.2` and supplies `tsc`.
- `typescript` aliases `@typescript/typescript6@6.0.2`, which supplies the
  compatible TypeScript 6 API and `tsc6`. The lockfile resolves its API dependency
  to TypeScript 6.0.3. `npm run typecheck` continues to use TypeScript 7.0.2.
- ESLint is pinned to 9.39.5, matching the installed plugins' peer ranges.
  npm marks this older ESLint line as unsupported upstream; revisit the pin
  when the Next.js/React plugins declare support for ESLint 10. No application
  framework or payment SDK upgrade is included in this change.
- The npm lockfile also repairs inconsistent optional WASM dependency entries
  detected by a clean installation check. Builds must use the committed lockfile.

See also the [typescript-eslint dependency support table](https://typescript-eslint.io/users/dependency-versions/).

## Source findings resolved

Once the parser worked, the first source scan found 51 errors and 13 warnings.
The fixes preserve the existing source checks:

- Use typed Portable Text blocks and fund-usage items rather than explicit
  `any` in campaign content, localization and the migration script.
- Catch Stripe session retrieval failures separately from thank-you page JSX.
  Missing sessions, verified payments, unpaid payments and retrieval failure
  still have their original page behavior and Purchase gating.
- Derive cached wallet readiness from the selected Session instead of copying
  it synchronously into state in an effect. A regression test covers returning
  to an already-ready cached amount without another creation request.
- Keep the embedded preloader after its declaration and use an Effect Event
  for current checkout state, while preserving the existing selection/step
  triggers and debounce delays.
- Use a hydration-aware external-store snapshot for the modal portal and a
  memoized prefetch callback with explicit dependencies.
- Remove unused values/helpers, name the PostCSS export, and escape apostrophes
  in JSX without changing the displayed policy text.

Generated output, local diagnostics, Vercel metadata and temporary worktrees are
excluded from lint/test discovery. This prevents the retained baseline checkout
and downloaded production scripts from being treated as application source.
The only inline image-rule exceptions are the intentional raw 1x1 Meta tracking
pixel and the native DOM image used to mock Next Image in jsdom. Hook rules and
TypeScript source checks are not disabled.

## Validation

- A clean `npm ci --no-audit --no-fund` installation succeeds with the committed
  lockfile, including the corrected cross-platform optional dependencies.
- Lint passes with `--max-warnings 0` (zero errors and warnings).
- Type checking passes using both the TypeScript 7 compiler (`npm run typecheck`)
  and the compatible TypeScript 6 compiler (`tsc6 --noEmit --incremental false`).
- 34 focused tests pass, covering the existing Apple Pay/Meta checks, legal
  rendering, cached wallet selection, and the thank-you page success/failure
  paths. These use mock payments, not live charges.
- The full suite still contains the known campaign-story/donation-panel
  assertion failures and campaign-page's missing Stripe public-key setup.
  These predate this repair; no full-suite success is claimed.
- The local environment has no live application credentials. Full production
  build and deployment checks are verified on Vercel after the commit is pushed.
