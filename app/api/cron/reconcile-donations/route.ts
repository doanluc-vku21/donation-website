import { NextResponse } from "next/server";

import { reconcilePaidSessions } from "@/lib/stripe/reconciliation";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/*
 * Stripe is the source of truth for money, Supabase for what the site shows.
 * This job compares them and writes any paid Checkout Session that has no
 * donation row, so a missed webhook delays a gift by minutes instead of
 * hiding it until someone complains.
 */
const RECONCILE_WINDOW_HOURS = 48;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Missing CRON_SECRET");

    return NextResponse.json({ error: "Cron secret is not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await reconcilePaidSessions({
      sinceSeconds: Math.floor(Date.now() / 1000) - RECONCILE_WINDOW_HOURS * 60 * 60,
      apply: true,
    });

    for (const payment of result.unattributed) {
      console.warn(
        "Paid Checkout Session without campaign metadata:",
        payment.sessionId,
        payment.chargedAmountMinor,
        payment.currency,
        payment.createdAt,
      );
    }

    return NextResponse.json({
      windowHours: RECONCILE_WINDOW_HOURS,
      scanned: result.scanned,
      paid: result.paid,
      alreadyRecorded: result.alreadyRecorded,
      backfilled: result.backfilled,
      unattributed: result.unattributed.length,
      skipped: result.skipped.length,
    });
  } catch (error) {
    console.error("Donation reconciliation failed:", error);

    return NextResponse.json({ error: "Reconciliation failed." }, { status: 500 });
  }
}
