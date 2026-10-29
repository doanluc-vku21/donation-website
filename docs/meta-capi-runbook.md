# Meta Purchase reporting operations

Use this runbook when activating, repairing, or moving the site's Meta Purchase
reporting. Read [the implementation guide](meta-emq.md) first. For the completed
2026-10-29 rollout, see [the activation record](meta-capi-activation-2026-10-29.md).
Recheck live accounts, permissions, settings, and deployed code before reuse.

## Reporting model

Stripe confirms a paid Checkout Session through a signed webhook. The website
sends a server Purchase to Meta CAPI; the paid thank-you page can also send a
browser Purchase. Both use `purchase_<Stripe Checkout Session ID>` so Meta can
deduplicate the two sources. An accepted server delivery is recorded in Stripe
Session metadata as `meta_purchase_sent_at`. Failed delivery must remain
retryable even if the donation already exists.

The website's donation list, Meta's received events, and Ads Manager's attributed
purchases measure different things. Compare the same payment, date range,
account timezone, and attribution settings before diagnosing a discrepancy.
An organic donation does not necessarily become an ad-attributed purchase.

## 1. Establish scope and baseline

1. Confirm authorization for the intended dataset, credential generation,
   Production variables, tracking enablement, and deployment.
2. Inspect `git status --short`, the target revision, `lib/meta/config.ts`,
   `lib/meta/server.ts`, and `app/api/webhooks/stripe/route.ts`. Preserve local
   changes. Verify the deployed revision separately from the local checkout.
3. Confirm the Meta business, dataset, ad account, Vercel team/project,
   environment, and production domain. The 2026-10-29 baseline was:

   | Item | Recorded target |
   | --- | --- |
   | Business | Grow Mark |
   | Dataset | Donation Pixel 2, `1116237120993773` |
   | Ad account | non, `1717838513252156` |
   | Vercel project | `darklife/donation-website` |
   | Environment / domain | Production / `donate.mealsupport.org` |

4. Inventory browser Pixels, website CAPI, Stripe Conversions App, and other
   automatic/server integrations. Inspect Purchase event IDs and deduplication
   diagnostics. Multiple sources alone do not prove duplicate purchases.
5. Record configuration presence, sender permissions, and a rollback path
   without recording credential values or donor information.

## 2. Prepare credentials and an isolated test

1. In Events Manager, select the confirmed dataset, open Settings, and use the
   manual Conversions API setup to generate an access token. In the completed
   rollout, **Set up without Dataset Quality API** was selected; no additional
   Dataset Quality API permissions were needed.
2. Keep the token server-only. Transfer it through an isolated workflow into
   the deployment secret store. Never paste it into chat, source, shell
   arguments, logs, screenshots, or a `NEXT_PUBLIC_*` variable.
3. Open the dataset's Test Events tab and obtain its server test code. Keep
   test configuration separate from Production. Use Stripe sandbox payments
   for payment-flow testing; a synthetic non-live Session can test the sender
   transport without charging anyone. Label that narrower result accurately.
4. Require `META_TEST_EVENT_CODE` for a non-live Session. Exercise the actual
   sender with `META_CAPI_ENABLED=true` and the matching dataset/token. A
   successful transport check requires HTTP 200, `events_received=1`, and a
   corresponding **Purchase / Processed / Server** entry in Test Events.
5. Check the expected event ID, amount, and currency. With sandbox browser and
   signed-webhook access, also verify matching browser/server IDs, refresh and
   webhook redelivery deduplication, unpaid-session suppression, and recovery
   after a declined Meta response. Record any checks that were not performed.

## 3. Coordinate overlapping senders

Prepare and validate replacement delivery before removing an existing sender's
access. Disable only the confirmed overlapping Purchase source, or align its
event ID. Do not disconnect unrelated datasets or payment services.

During the 2026-10-29 investigation, Events Manager's Stripe Disconnect action
failed with a UI error. The targeted fallback was Business Settings → Connected
apps → Stripe Conversions App → remove **only Donation Pixel 2** from its asset
permissions. Reloading confirmed that no Grow Mark asset remained assigned to
that app. The app itself was not uninstalled. This is a recorded workaround,
not a step to repeat without checking current access and overlap.

Do not revoke a working sender before replacement coverage is ready. The
initial removal in this incident preceded replacement validation; retain this
sequencing lesson when using the runbook again.

## 4. Configure Vercel and deploy

Use the confirmed project's **Production** environment:

| Variable | Required value / handling |
| --- | --- |
| `META_CAPI_ACCESS_TOKEN` | Secret issued for the selected dataset; server-only |
| `META_CAPI_ENABLED` | `true` after isolated validation and sender coordination |
| `NEXT_PUBLIC_META_PIXEL_ID` | Selected dataset ID; `1116237120993773` in this rollout |
| `NEXT_PUBLIC_SITE_URL` | Actual HTTPS site origin |
| `META_TEST_EVENT_CODE` | Absent in Production |

Recheck the deployed revision's additional browser Pixel configuration. A local
fallback or old `.env.example` ID is not proof of the live target. A separate
browser Pixel must not automatically receive this dataset's CAPI token.

1. Save the approved variables and read back non-secret values. Confirm the
   token is stored as a Secret without revealing it.
2. Redeploy the intended revision so the variables take effect. If Meta or
   Vercel requests CAPTCHA, email, or WhatsApp verification, let the account
   holder complete it directly in the browser; do not request codes in chat.
3. Wait for **Ready / Production**, then confirm the real domain points to
   that deployment. A successful build alone is not a successful rollout.
4. Remove temporary plaintext credentials. If a backup is required, encrypt
   it and restrict access under ignored `.local/auth/`. Keep redacted diagnostic
   artifacts under ignored `.local/diagnostics/`.

## 5. Verify and record

For code changes, run the relevant tests, lint, and type checking as required
by `AGENTS.md`. Focused Meta regression tests can be run with:

```powershell
npm test -- tests/unit/meta-browser.test.tsx tests/unit/meta-server.test.ts tests/unit/meta-webhook.test.ts
```

Check public campaign responses and the published Pixel ID after deployment.
HTTP-only checks do not verify browser event delivery, payment completion,
Apple Pay performance, or ad attribution.

For the next genuine payment, use authorized read-only access to correlate the
paid Stripe Session, charged amount/currency, expected Purchase ID, Meta receipt,
and `meta_purchase_sent_at`. Review Ads Manager separately using the correct
reporting range/timezone and attribution settings. Do not create unnecessary
real charges or replay historical payments merely to populate reports.

Create a dated record under `docs/` containing the target, revision, deployment,
configuration names, redacted test results, unverified items, and rollback.
Distinguish operator verification from user-reported success. Never include
tokens, OTPs, donor details, or private receipt URLs.

## Rollback and troubleshooting

- To stop website server delivery, set `META_CAPI_ENABLED=false` in Production
  and redeploy. Read back the result; browser tracking and payments remain.
- Restoring a previously removed Stripe integration requires the administrator
  to restore access for this dataset. Coordinate senders before reconnecting.
- If Meta rejects delivery, inspect sanitized webhook errors and configuration;
  preserve signed-webhook retries. Do not mark failed events as sent.
- If events are received but ads show no purchases, inspect attribution and the
  reporting range before changing the sender or replaying events.
- If duplicates are suspected, compare actual event IDs for the same paid
  Session across sources. Raw event counts are not unique-payment evidence.
