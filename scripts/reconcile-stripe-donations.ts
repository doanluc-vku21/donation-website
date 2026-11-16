import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { convertCurrencyMinorToUsd } from "@/lib/money";
import { getCurrencyMinorUnitFactor, isCurrency, type Currency } from "@/lib/currency";

/*
 * Finds Stripe Checkout Sessions that were paid but never turned into a
 * donation row — the failure mode that keeps a completed gift off the
 * campaign page. Dry run by default; `--apply` writes the missing rows with
 * the amounts Stripe actually charged.
 *
 *   npx tsx scripts/reconcile-stripe-donations.ts --since=2026-11-01
 *   npx tsx scripts/reconcile-stripe-donations.ts --since=2026-11-01 --apply
 */

type PaidSession = {
  id: string;
  created: number;
  amountTotal: number;
  currency: Currency;
  frequency: "one_time" | "monthly";
  campaignId: string | null;
  campaignPath: string;
  displayName: string;
  isAnonymous: boolean;
  donorEmail: string;
  chargedDonationMinor: number;
  chargedFeeMinor: number;
  exchangeRate: number;
  subscriptionId: string | null;
  paymentIntentId: string | null;
  customerId: string | null;
};

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find(argument => argument.startsWith(prefix));
  return match?.slice(prefix.length);
}

function positiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function fetchUsdRate(currency: Currency): Promise<number | null> {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rate/usd/${currency}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { rate?: unknown };
    const rate = Number(payload.rate);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

function normalizeCurrencyCode(code: string | null | undefined): Currency | null {
  const normalized = (code ?? "").trim().toUpperCase();
  return isCurrency(normalized) ? normalized : null;
}

function displayNameFor(session: Stripe.Checkout.Session): string {
  const metadata = session.metadata ?? {};
  const stored = (metadata.display_name ?? "").trim();
  if (stored) {
    return stored;
  }

  const first = (metadata.donor_first_name ?? "").trim();
  const last = (metadata.donor_last_name ?? "").trim();
  if (!first) {
    return "Anonymous";
  }

  return last ? `${first} ${last.charAt(0)}.` : first;
}

async function loadSession(
  session: Stripe.Checkout.Session,
): Promise<PaidSession | null> {
  const metadata = session.metadata ?? {};
  const currency = normalizeCurrencyCode(session.currency) ?? normalizeCurrencyCode(metadata.charged_currency);
  const amountTotal = session.amount_total ?? 0;

  if (!currency || amountTotal <= 0) {
    return null;
  }

  const factor = getCurrencyMinorUnitFactor(currency);
  // Without metadata the split between gift and fee is unknown; record the whole
  // charge as the gift rather than inventing a fee that was never written.
  const chargedDonationMinor = positiveInteger(metadata.charged_donation_amount_cents) ?? Math.max(factor, amountTotal);
  const chargedFeeMinor = positiveInteger(metadata.charged_fee_amount_cents) ?? 0;
  const storedRate = Number(metadata.usd_exchange_rate);
  const exchangeRate = Number.isFinite(storedRate) && storedRate > 0 ? storedRate : await fetchUsdRate(currency);
  if (!exchangeRate) {
    return null;
  }

  return {
    id: session.id,
    created: session.created,
    amountTotal,
    currency,
    frequency: metadata.frequency === "monthly" ? "monthly" : "one_time",
    campaignId: (metadata.campaign_id ?? "").trim() || null,
    campaignPath: (metadata.campaign_path ?? "").trim(),
    displayName: displayNameFor(session),
    isAnonymous: (metadata.is_anonymous ?? "false") === "true",
    donorEmail: (metadata.donor_email ?? session.customer_details?.email ?? "").trim().toLowerCase(),
    chargedDonationMinor,
    chargedFeeMinor,
    exchangeRate,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerId: typeof session.customer === "string" ? session.customer : null,
  };
}

async function run(): Promise<void> {
  const since = argValue("since");
  const apply = process.argv.includes("--apply");
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !supabaseUrl || !serviceKey) {
    console.error(
      "Reconcile needs STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Pull them into an ignored file first, for example: npx vercel env pull .env.local --environment=production",
    );
    process.exitCode = 1;
    return;
  }

  const sinceSeconds = since ? Math.floor(Date.parse(`${since}T00:00:00Z`) / 1000) : Math.floor(Date.now() / 1000) - 7 * 86_400;
  if (!Number.isFinite(sinceSeconds) || sinceSeconds <= 0) {
    console.error(`Unable to read --since=${since ?? ""}. Use --since=YYYY-MM-DD.`);
    process.exitCode = 1;
    return;
  }

  const stripe = new Stripe(secretKey);
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let startingAfter: string | undefined;
  const missing: PaidSession[] = [];
  const unmapped: PaidSession[] = [];
  let scanned = 0;
  let paid = 0;

  for (;;) {
    const page = await stripe.checkout.sessions.list({
      created: { gte: sinceSeconds },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const session of page.data) {
      scanned += 1;

      if (session.payment_status !== "paid" || session.status !== "complete") {
        continue;
      }

      paid += 1;
      const candidate = await loadSession(session);
      if (!candidate) {
        continue;
      }

      const { data: existing, error } = await supabase
        .from("donations")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (error) {
        console.error(`Lookup failed for ${session.id}: ${error.code ?? error.message}`);
        process.exitCode = 1;
        return;
      }

      if (existing) {
        continue;
      }

      if (candidate.campaignId) {
        missing.push(candidate);
      } else {
        unmapped.push(candidate);
      }
    }

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  const format = (session: PaidSession) =>
    `${new Date(session.created * 1000).toISOString()}  ${session.id}  ` +
    `${(session.chargedDonationMinor / getCurrencyMinorUnitFactor(session.currency)).toFixed(2)} ${session.currency}  ` +
    `${session.frequency}  ${session.displayName || "(no name)"}  ${session.donorEmail || "(no email)"}`;

  console.log(`Scanned ${scanned} session(s) since ${new Date(sinceSeconds * 1000).toISOString()}; ${paid} paid.`);
  console.log(`Missing donation rows (campaign known): ${missing.length}`);
  for (const session of missing) {
    console.log(`  ${format(session)}`);
  }
  console.log(`Paid but unattributable (no campaign_id in metadata): ${unmapped.length}`);
  for (const session of unmapped) {
    console.log(`  ${format(session)}`);
  }

  if (!apply) {
    if (missing.length > 0) {
      console.log("\nDry run. Re-run with --apply to write the rows above.");
    }
    return;
  }

  let written = 0;
  for (const session of missing) {
    if (!session.donorEmail) {
      console.warn(`Skipped ${session.id}: Stripe has no donor email, so the row cannot be attributed to a donor.`);
      continue;
    }

    const donorPattern = session.donorEmail.replace(/[\\%_]/g, "\\$&");
    const donorLookup = await supabase.from("donors").select("id").ilike("email", donorPattern).maybeSingle();
    if (donorLookup.error) {
      console.error(`Donor lookup failed for ${session.id}: ${donorLookup.error.code ?? donorLookup.error.message}`);
      process.exitCode = 1;
      return;
    }

    let donorId = donorLookup.data?.id as string | undefined;
    if (!donorId) {
      const donorInsert = await supabase
        .from("donors")
        .insert({ first_name: session.displayName === "Anonymous" ? "Donor" : session.displayName, email: session.donorEmail })
        .select("id")
        .maybeSingle();
      if (donorInsert.error) {
        console.error(`Donor insert failed for ${session.id}: ${donorInsert.error.code ?? donorInsert.error.message}`);
        process.exitCode = 1;
        return;
      }
      donorId = donorInsert.data?.id as string | undefined;
    }

    if (!donorId) {
      console.warn(`Skipped ${session.id}: no donor row could be resolved for ${session.donorEmail}.`);
      continue;
    }

    const normalizedDonationUsdCents = convertCurrencyMinorToUsd(session.chargedDonationMinor, session.exchangeRate, session.currency);
    const normalizedFeeUsdCents = convertCurrencyMinorToUsd(session.chargedFeeMinor, session.exchangeRate, session.currency);
    const normalizedTotalUsdCents = convertCurrencyMinorToUsd(session.amountTotal, session.exchangeRate, session.currency);

    const { error } = await supabase.from("donations").insert({
      campaign_id: session.campaignId,
      donor_id: donorId,
      display_name: session.displayName,
      amount_cents: normalizedDonationUsdCents,
      fee_amount_cents: normalizedFeeUsdCents,
      total_amount_cents: normalizedTotalUsdCents,
      currency: "USD",
      charged_amount_cents: session.chargedDonationMinor,
      charged_fee_amount_cents: session.chargedFeeMinor,
      charged_total_amount_cents: session.amountTotal,
      charged_currency: session.currency,
      usd_exchange_rate: session.exchangeRate,
      frequency: session.frequency,
      status: "succeeded",
      is_anonymous: session.isAnonymous,
      stripe_customer_id: session.customerId,
      stripe_payment_intent_id: session.paymentIntentId,
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: session.subscriptionId,
    });

    if (error) {
      console.error(`Insert failed for ${session.id}: ${error.code ?? error.message}`);
      process.exitCode = 1;
      return;
    }

    written += 1;
  }

  console.log(`\nWrote ${written} donation row(s).`);
}

run().catch(error => {
  console.error("Reconcile failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
