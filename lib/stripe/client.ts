"use client";

import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

// Card and wallet providers share the same Stripe controller/fraud signals.
export const stripePromise = loadStripe(publishableKey);
