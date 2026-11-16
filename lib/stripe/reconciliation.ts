import "server-only";

import type Stripe from "stripe";

import { getOrCreateDonor } from "@/lib/queries/donors";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { getUsdToCurrencyRate } from "@/lib/exchange-rate";
import { convertCurrencyMinorToUsd } from "@/lib/money";
import { isCurrency, type Currency } from "@/lib/currency";

const PAGE_SIZE = 100;

export type UnattributedPayment = {
  sessionId: string;
  chargedAmountMinor: number;
  currency: string;
  donorEmail: string;
  createdAt: string;
};

export type ReconciliationResult = {
  scanned: number;
  paid: number;
  alreadyRecorded: number;
  backfilled: number;
  unattributed: UnattributedPayment[];
  skipped: string[];
};

type PaidSession = {
  sessionId: string;
  chargedCurrency: Currency;
  chargedDonationMinor: number;
  chargedFeeMinor: number;
  chargedTotalMinor: number;
  exchangeRate: number;
  frequency: "one_time" | "monthly";
  campaignId: string | null;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  isAnonymous: boolean;
  createdAt: string;
  subscriptionId: string | null;
  paymentIntentId: string | null;
  customerId: string | null;
};

function normalizeCurrency(value: string | null | undefined): Currency | null {
  const normalized = (value ?? "").trim().toUpperCase();
  return isCurrency(normalized) ? normalized : null;
}

function positiveInteger(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

function nonNegativeInteger(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function positiveNumber(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function displayNameFor(metadata: Stripe.Metadata, firstName: string, lastName: string, isAnonymous: boolean): string {
  if (isAnonymous) {
    return "Anonymous";
  }

  const stored = (metadata.display_name ?? "").trim();
  if (stored) {
    return stored;
  }

  if (!lastName) {
    return firstName;
  }

  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

async function buildSession(session: Stripe.Checkout.Session): Promise<PaidSession | null> {
  const metadata = session.metadata ?? {};
  const chargedCurrency = normalizeCurrency(session.currency) ?? normalizeCurrency(metadata.charged_currency);
  const chargedTotalMinor = positiveInteger(session.amount_total);

  if (!chargedCurrency || chargedTotalMinor <= 0) {
    return null;
  }

  const chargedDonationMinor = positiveInteger(metadata.charged_donation_amount_cents) || chargedTotalMinor;
  const chargedFeeMinor = nonNegativeInteger(metadata.charged_fee_amount_cents);
  const storedRate = positiveNumber(metadata.usd_exchange_rate);
  const exchangeRate = storedRate > 0 ? storedRate : await getUsdToCurrencyRate(chargedCurrency);

  if (!(exchangeRate > 0)) {
    return null;
  }

  const email = ((metadata.donor_email ?? "").trim() || session.customer_details?.email || session.customer_email || "")
    .trim()
    .toLowerCase();
  const firstName = (metadata.donor_first_name ?? "").trim() || (session.customer_details?.name ?? "").trim().split(" ")[0] || "Donor";
  const lastName = (metadata.donor_last_name ?? "").trim();
  const isAnonymous = (metadata.is_anonymous ?? "true") !== "false";

  return {
    sessionId: session.id,
    chargedCurrency,
    chargedDonationMinor,
    chargedFeeMinor,
    chargedTotalMinor,
    exchangeRate,
    frequency: metadata.frequency === "monthly" ? "monthly" : "one_time",
    campaignId: (metadata.campaign_id ?? "").trim() || null,
    displayName: displayNameFor(metadata, firstName, lastName, isAnonymous),
    email,
    firstName,
    lastName,
    isAnonymous,
    createdAt: new Date(session.created * 1000).toISOString(),
    subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerId: typeof session.customer === "string" ? session.customer : null,
  };
}

async function insertDonation(session: PaidSession): Promise<boolean> {
  if (!session.email) {
    return false;
  }

  const donorId = await getOrCreateDonor({
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    phone: null,
    stripeCustomerId: session.customerId,
  });

  const normalizedDonationUsdCents = convertCurrencyMinorToUsd(
    session.chargedDonationMinor,
    session.exchangeRate,
    session.chargedCurrency,
  );
  const normalizedFeeUsdCents = convertCurrencyMinorToUsd(session.chargedFeeMinor, session.exchangeRate, session.chargedCurrency);
  const normalizedTotalUsdCents = convertCurrencyMinorToUsd(
    session.chargedTotalMinor,
    session.exchangeRate,
    session.chargedCurrency,
  );

  const { error } = await supabaseAdmin.from("donations").insert({
    campaign_id: session.campaignId,
    donor_id: donorId,
    display_name: session.displayName,
    amount_cents: normalizedDonationUsdCents,
    fee_amount_cents: normalizedFeeUsdCents,
    total_amount_cents: normalizedTotalUsdCents,
    currency: "USD",
    charged_amount_cents: session.chargedDonationMinor,
    charged_fee_amount_cents: session.chargedFeeMinor,
    charged_total_amount_cents: session.chargedTotalMinor,
    charged_currency: session.chargedCurrency,
    usd_exchange_rate: session.exchangeRate,
    frequency: session.frequency,
    status: "succeeded",
    is_anonymous: session.isAnonymous,
    stripe_customer_id: session.customerId,
    stripe_payment_intent_id: session.paymentIntentId,
    stripe_checkout_session_id: session.sessionId,
    stripe_subscription_id: session.subscriptionId,
  });

  if (!error) {
    return true;
  }

  // A concurrent webhook may have written the row between the lookup and here.
  if (error.code === "23505") {
    return false;
  }

  console.error("Reconciliation insert error:", error);
  return false;
}

/**
 * Compares paid Stripe Checkout Sessions against the donations table and
 * records anything the webhook missed. A paid session with no row is a gift
 * the campaign page will never show, so the cron closes that gap instead of
 * relying on a donor complaint.
 */
export async function reconcilePaidSessions(options: {
  sinceSeconds: number;
  apply: boolean;
  maxPages?: number;
}): Promise<ReconciliationResult> {
  const maxPages = options.maxPages ?? 20;
  const result: ReconciliationResult = {
    scanned: 0,
    paid: 0,
    alreadyRecorded: 0,
    backfilled: 0,
    unattributed: [],
    skipped: [],
  };

  let startingAfter: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: options.sinceSeconds },
      limit: PAGE_SIZE,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const session of sessions.data) {
      result.scanned += 1;

      if (session.payment_status !== "paid" || session.status !== "complete") {
        continue;
      }

      result.paid += 1;

      const { data: existing, error } = await supabaseAdmin
        .from("donations")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (error) {
        console.error("Reconciliation lookup error:", error);
        result.skipped.push(session.id);
        continue;
      }

      if (existing) {
        result.alreadyRecorded += 1;
        continue;
      }

      const candidate = await buildSession(session);
      if (!candidate) {
        result.skipped.push(session.id);
        continue;
      }

      if (!candidate.campaignId) {
        result.unattributed.push({
          sessionId: candidate.sessionId,
          chargedAmountMinor: candidate.chargedDonationMinor,
          currency: candidate.chargedCurrency,
          donorEmail: candidate.email,
          createdAt: candidate.createdAt,
        });
        continue;
      }

      if (!options.apply) {
        continue;
      }

      if (await insertDonation(candidate)) {
        result.backfilled += 1;
        console.info("Reconciled missing donation:", candidate.sessionId, candidate.chargedDonationMinor, candidate.chargedCurrency);
      } else {
        result.skipped.push(candidate.sessionId);
      }
    }

    if (!sessions.has_more || sessions.data.length === 0) {
      break;
    }

    startingAfter = sessions.data[sessions.data.length - 1]?.id;
  }

  return result;
}
