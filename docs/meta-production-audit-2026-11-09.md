# Meta production matching audit — 2026-11-09

## Question and current conclusion

The user requested verification that real production donations send email and
name information to Meta, and identification of the cause of the matching-data
recommendations in Events Manager.

Production configuration and the deployed Git revision support the intended
server-side delivery. **Actual field coverage and Meta acceptance for a real
paid donation could not be established with the available access.** No real
payment, receipt, historical replay, tracking setting change or deployment was
performed. Missing log access is not evidence that no events were sent.

## Verified evidence

- `donate.mealsupport.org` resolves to Ready production deployment
  `dpl_2Moe3mBovMaM57WQ2tzZRfDz8Wpw`, project `donation-website`, team `darklife`.
  Its recorded Git revision is `3e2162331df050d2b3fcbe4f26d6bebb1d76cf89`.
- The production project configuration was read back:
  `META_CAPI_ENABLED=true`, primary Pixel `1116237120993773`, and site origin
  `https://donate.mealsupport.org`.
- `META_CAPI_ACCESS_TOKEN` is configured as a production Secret. The token was
  not retrieved. No production `META_TEST_EVENT_CODE` was listed.
- The repository has the exact deployed Git revision locally. Its
  `lib/meta/server.ts`, Stripe webhook handler and browser Purchase component
  match the currently inspected workspace files byte-for-byte. The deployment
  source-file endpoint returned 404; deployed-code conclusions rely on the
  deployment's Git metadata and the matching local Git object.
- The source's `buildMetaUserData` reads email from Checkout customer details,
  customer email or donor metadata. Valid email is normalized and SHA-256 hashed
  as `user_data.em`. Names are taken from donor metadata or Checkout customer
  details, normalized, hashed and included as `fn`/`ln` when available.
- Hosted Checkout stores form identity in Session metadata. Embedded checkout
  initially has empty donor metadata; the subsequent donation-attempt/update
  flow and Stripe-confirmed customer details supply identity. Empty metadata at
  Session creation alone does not establish a failed paid-event payload.
- The signed webhook handles paid completed/async-succeeded Checkout Sessions,
  retrieves a fresh Session, calls CAPI, requires `events_received=1`, and then
  saves `meta_purchase_sent_at`. Existing donation records do not skip this
  delivery/retry step. Database/receipt failures before CAPI can delay delivery;
  actual failures were not observable in this audit.
- The browser Purchase caller explicitly supplies event/amount/currency and the
  shared event ID, without passing donor identity itself. Meta's account-managed
  automatic matching settings were not accessible. Browser requests alone do
  not establish what the server CAPI request contained.
- Eighteen existing Meta browser/server/webhook tests passed. These are mocked
  regression tests of the matching source, not evidence of a live transmission.

## Access failures and practical limits

The Vercel runtime-log read for the confirmed team/project returned HTTP 403
Forbidden for both a 24-hour window and a narrower 30-minute query scoped to
the live deployment. The webhook runtime-error query also returned HTTP 403.
These responses have an error state; their empty rows are not successful
zero-error results.

The suggested CLI fallback was unavailable: there is no installed Vercel CLI,
CLI login/configuration or runtime Vercel token in this environment. No automatic
login, token extraction or permission changes were attempted. Production Stripe
read access and Meta Events Manager access are also unavailable; the existing
isolated Stripe configuration is sandbox-only and was not used as production
evidence. Production Secrets were not exported or read through another route.

Successful CAPI request bodies and their identity fields are intentionally not
logged. Reading runtime logs would help find rejected deliveries but would not
by itself prove that email/name fields were present in accepted requests.

## Remaining evidence needed

An administrator with existing access can check one recent genuine paid
Checkout Session and its corresponding Meta **server** Purchase. Return only
field presence and outcomes, never donor values, tokens, full payloads, hashes
or private receipt URLs:

| Boundary | Check |
| --- | --- |
| Stripe paid Session | `payment_status=paid`, and whether `customer_details.email` / `customer_email` / `metadata.donor_email` are populated |
| Stripe identity | Whether `customer_details.name`, `metadata.donor_first_name` and `metadata.donor_last_name` are populated |
| Website delivery marker | Whether `metadata.meta_purchase_sent_at` exists |
| Meta server receipt | Whether the corresponding `purchase_<Session ID>` event exists and is processed; correlate IDs privately |
| Meta matching parameters | Whether that server event includes `em`, `fn`, `ln`, and `external_id`; distinguish browser from server and use a recent matching date range |
| Webhook failures | Check the same Session's signed webhook delivery status and sanitized CAPI/receipt/database error category |

If source identity exists but no delivery marker is present, investigate webhook
execution, preceding database/receipt failures, CAPI rejection and marker-write
failure. If the marker exists but a different event lacks identity, correlate the
same Session/event ID and sender first. If the same server event lacks identity,
inspect the actual Session values used at send time and the deployed payload.
Names are optional in the supported flows; absent names alone do not establish
a sender defect. The screenshot's recommendations and estimated quality uplift
do not identify which of these boundaries failed.

Follow [the CAPI runbook](meta-capi-runbook.md) for any subsequent authorized
production or isolated Test Events work. Do not resend historical paid events
or create a real charge to obtain a diagnostic sample.
