"use client";

import { loadStripe } from "@stripe/stripe-js/pure";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

// Importing the default loader injects Stripe.js even without a mounted wallet.
// Start the pure loader on payment intent (or the existing iOS prewarm), while
// retaining one controller and Stripe's default fraud-signal configuration.
let stripePromise: ReturnType<typeof loadStripe> | undefined;
export function getStripePromise() {
  return stripePromise ??= loadStripe(publishableKey!).catch((error) => {
    stripePromise = undefined;
    throw error;
  });
}

export function prepareStripe() {
  // A speculative load failure must not become an unhandled rejection.
  void getStripePromise().catch(() => {});
}
