import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";
import type Stripe from "stripe";
import { metaPixelId, metaPurchaseEventId } from "./config";

function cookie(request: Request, name: string) {
  const part = request.headers.get("cookie")?.split(/;\s*/).find((item) => item.startsWith(`${name}=`));
  try {
    return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
  } catch {
    return "";
  }
}

function validMetaCookie(value: string, kind: "fbp" | "fbc") {
  const pattern = kind === "fbp"
    ? /^fb\.\d+\.\d{13}\.\d+$/
    : /^fb\.\d+\.\d{13}\.[A-Za-z0-9_-]+$/;
  return value.length <= 500 && pattern.test(value) ? value : "";
}

export function captureMetaRequest(request: Request): Record<string, string> {
  const metadata: Record<string, string> = {};
  const fbp = validMetaCookie(cookie(request, "_fbp"), "fbp");
  let fbc = validMetaCookie(cookie(request, "_fbc"), "fbc");
  const externalId = cookie(request, "_meta_external_id");
  if (fbp) metadata.meta_fbp = fbp;
  if (/^[a-f0-9-]{36}$/i.test(externalId)) metadata.meta_external_id = externalId;
  const userAgent = request.headers.get("user-agent");
  if (userAgent) metadata.meta_user_agent = userAgent.slice(0, 500);

  try {
    const referer = new URL(request.headers.get("referer") || "");
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url);
    if (referer.origin === site.origin) {
      const clickId = referer.searchParams.get("fbclid");
      if (!fbc && clickId && /^[A-Za-z0-9_-]{1,450}$/.test(clickId)) {
        fbc = `fb.1.${Date.now()}.${clickId}`;
      }
      // Exclude query strings, fragments and credentials from event URLs.
      metadata.meta_source_url = `${referer.origin}${referer.pathname}`.slice(0, 500);
    }
  } catch {
    // Missing/invalid referrers are normal; use the configured campaign URL later.
  }
  if (fbc) metadata.meta_fbc = fbc;

  // Only trust headers inserted by the deployment proxy. Never use the Stripe
  // webhook request's IP/UA or accept a client-submitted IP in a JSON body.
  const forwarded = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")
    : process.env.META_TRUST_PROXY_HEADERS === "true"
      ? request.headers.get("x-forwarded-for")
      : null;
  const ip = forwarded?.split(",")[0].trim();
  if (ip && isIP(ip)) metadata.meta_ip_address = ip;
  return metadata;
}

function hash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function letters(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/[^\p{L}\p{M}]/gu, "");
}

export function buildMetaUserData(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const details = session.customer_details;
  const address = details?.address;
  const userData: Record<string, string | string[]> = {};
  const addHash = (key: string, value: string) => {
    if (value) userData[key] = [hash(value)];
  };
  const email = (details?.email || session.customer_email || metadata.donor_email || "").trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) addHash("em", email);
  const phone = (details?.phone || metadata.donor_phone || "").trim();
  // A local number without its calling code must not be guessed from geography.
  if (/^(\+|00)/.test(phone)) {
    const digits = phone.replace(/\D/g, "").replace(/^00/, "");
    if (/^[1-9]\d{7,14}$/.test(digits)) addHash("ph", digits);
  }
  const nameParts = details?.name?.trim().split(/\s+/) || [];
  addHash("fn", letters(metadata.donor_first_name || nameParts[0]));
  addHash("ln", letters(metadata.donor_last_name || nameParts.slice(1).join(" ")));
  addHash("ct", letters(address?.city));
  const country = address?.country?.trim().toLowerCase() || "";
  const state = letters(address?.state);
  // US matching expects the two-letter state code, not a hashed full name.
  if (country !== "us" || state.length === 2) addHash("st", state);
  if (/^[a-z]{2}$/.test(country)) addHash("country", country);
  let zip = (address?.postal_code || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (country === "us") zip = zip.slice(0, 5);
  addHash("zp", zip);
  addHash("external_id", metadata.meta_external_id || "");
  const fbp = validMetaCookie(metadata.meta_fbp || "", "fbp");
  const fbc = validMetaCookie(metadata.meta_fbc || "", "fbc");
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (isIP(metadata.meta_ip_address || "")) userData.client_ip_address = metadata.meta_ip_address;
  if (metadata.meta_user_agent) userData.client_user_agent = metadata.meta_user_agent;
  return userData;
}

export function buildMetaPurchase(session: Stripe.Checkout.Session, paidAt: number) {
  if (session.payment_status !== "paid" || !session.currency ||
      !Number.isInteger(session.amount_total) || (session.amount_total ?? 0) <= 0) {
    throw new Error("Meta Purchase requires a verified paid session with a positive amount.");
  }
  const metadata = session.metadata || {};
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  let sourceUrl = metadata.meta_source_url;
  if (!sourceUrl && site) {
    const url = new URL(site);
    const path = metadata.campaign_path;
    if (path?.startsWith("/") && !path.startsWith("//")) url.pathname = path;
    url.search = "";
    url.hash = "";
    sourceUrl = url.toString();
  }
  if (!sourceUrl) throw new Error("Missing website source URL for Meta Purchase.");
  return {
    event_name: "Purchase",
    event_time: paidAt,
    event_id: metaPurchaseEventId(session.id),
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: buildMetaUserData(session),
    custom_data: {
      value: session.amount_total! / 100,
      currency: session.currency.toUpperCase(),
      content_name: "Donation",
      content_category: metadata.frequency === "monthly" ? "Monthly donation" : "One-time donation",
      order_id: session.id,
    },
  };
}

export function metaCapiEnabled() {
  return process.env.META_CAPI_ENABLED === "true";
}

export async function sendMetaPurchase(session: Stripe.Checkout.Session, paidAt: number) {
  if (!metaCapiEnabled()) return false;
  // Never mix sandbox donations into the production dataset.
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (!session.livemode && !testCode) return false;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!accessToken || !/^\d+$/.test(metaPixelId) || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("Meta CAPI configuration is incomplete or invalid.");
  }
  const payload = {
    data: [buildMetaPurchase(session, paidAt)],
    ...(testCode ? { test_event_code: testCode } : {}),
  };
  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${version}/${metaPixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Meta CAPI request failed or timed out; webhook retry is required.");
  }
  // Do not log payloads, tokens, PII, or untrusted error messages from Meta.
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.events_received !== 1) {
    throw new Error(`Meta CAPI did not accept Purchase (HTTP ${response.status}).`);
  }
  return true;
}
