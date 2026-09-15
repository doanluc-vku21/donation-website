import Link from "next/link";
import {
  Check,
  Heart,
  Mail,
  Share2,
  ShieldCheck,
} from "lucide-react";

import { stripe } from "@/lib/stripe/server";
import { formatUsd } from "@/lib/money";

type ThankYouPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function ThankYouPage({
  searchParams,
}: ThankYouPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)] px-5 py-12">
        <section className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-white p-7 text-center shadow-[0_28px_90px_rgba(20,43,78,.13)] sm:p-11">
          <h1 className="text-3xl font-semibold">
            Payment session not found
          </h1>

          <p className="mt-4 text-[var(--muted)]">
            We couldn't find the Stripe Checkout session for this donation.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 font-semibold text-white"
          >
            Return to campaign
          </Link>
        </section>
      </main>
    );
  }

  try {
    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    const amountTotal =
      session.amount_total ?? 0;

    const donationAmount =
      Number(
        session.metadata
          ?.donation_amount_cents ??
          amountTotal,
      );

    const feeAmount =
      Number(
        session.metadata
          ?.fee_amount_cents ??
          0,
      );

    const email =
      session.customer_details
        ?.email ??
      session.customer_email ??
      session.metadata
        ?.donor_email ??
      "";

    const paymentSucceeded =
      session.payment_status ===
      "paid";

    const displayName =
      session.metadata
        ?.display_name ??
      "";

    const frequency =
      session.metadata
        ?.frequency ??
      "one_time";

    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)] px-5 py-12">
        <section className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-white p-7 text-center shadow-[0_28px_90px_rgba(20,43,78,.13)] sm:p-11">

          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <Check
              aria-hidden="true"
              className="size-8"
            />
          </span>

          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            Payment confirmed
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">
            Thank you
            {displayName &&
            displayName !==
              "Anonymous"
              ? `, ${displayName}`
              : ""}
            .
          </h1>

          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Your donation has been
            processed successfully
            through Stripe.
          </p>

          <div className="mt-7 rounded-2xl bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--muted)]">
              Your donation
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {formatUsd(
                donationAmount,
              )}
            </p>

            {feeAmount >
              0 && (
              <div className="mt-4 border-t border-[var(--border)] pt-4 text-sm">

                <div className="flex justify-between gap-4 text-[var(--muted)]">
                  <span>
                    Donation
                  </span>

                  <span>
                    {formatUsd(
                      donationAmount,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between gap-4 text-[var(--muted)]">
                  <span>
                    Transaction cost contribution
                  </span>

                  <span>
                    {formatUsd(
                      feeAmount,
                    )}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 font-semibold text-[var(--ink)]">
                  <span>
                    Total paid
                  </span>

                  <span>
                    {formatUsd(
                      amountTotal,
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
              <ShieldCheck
                aria-hidden="true"
                className="size-4 text-[var(--success)]"
              />

              {paymentSucceeded
                ? "Payment successful"
                : `Payment status: ${session.payment_status}`}
            </div>

            {email && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <Mail
                  aria-hidden="true"
                  className="size-4"
                />

                Confirmation sent to{" "}
                <strong className="font-medium text-[var(--ink)]">
                  {email}
                </strong>
              </p>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] px-4 py-3 text-left text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--muted)]">
                Donation type
              </span>

              <strong>
                {frequency ===
                "monthly"
                  ? "Monthly"
                  : "One-time"}
              </strong>
            </div>

            <div className="mt-2 flex justify-between gap-4">
              <span className="text-[var(--muted)]">
                Payment status
              </span>

              <strong
                className={
                  paymentSucceeded
                    ? "text-[var(--success)]"
                    : ""
                }
              >
                {session.payment_status}
              </strong>
            </div>

            <div className="mt-2 flex justify-between gap-4">
              <span className="text-[var(--muted)]">
                Currency
              </span>

              <strong>
                {session.currency?.toUpperCase() ??
                  "USD"}
              </strong>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/#donation-panel"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 font-semibold text-white transition hover:bg-[var(--accent-dark)]"
            >
              <Heart
                aria-hidden="true"
                className="size-4 fill-current"
              />

              Donate again
            </Link>

            <Link
              href="/#top"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-5 font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Share2
                aria-hidden="true"
                className="size-4"
              />

              Share campaign
            </Link>
          </div>

          <p className="mt-6 text-xs leading-5 text-[var(--muted)]">
            Secure payment processed
            by Stripe Sandbox.
          </p>
        </section>
      </main>
    );
  } catch (error) {
    console.error(
      "Unable to retrieve Stripe session:",
      error,
    );

    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)] px-5 py-12">
        <section className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-white p-7 text-center shadow-[0_28px_90px_rgba(20,43,78,.13)] sm:p-11">
          <h1 className="text-3xl font-semibold">
            Unable to verify donation
          </h1>

          <p className="mt-4 leading-7 text-[var(--muted)]">
            We couldn't retrieve this
            payment from Stripe. Please
            return to the campaign and
            try again.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 font-semibold text-white"
          >
            Return to campaign
          </Link>
        </section>
      </main>
    );
  }
}