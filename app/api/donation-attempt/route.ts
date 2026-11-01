import {
  NextResponse,
} from "next/server";
import { captureMetaRequest } from "@/lib/meta/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import {
  stripe,
} from "@/lib/stripe/server";

import { saveDonationAttempt, type DonationAttemptBody } from "@/lib/donation-attempt";

type AttachAttemptBody = {
  attemptId:
    string;

  stripeCheckoutSessionId:
    string;
};

export const runtime =
  "nodejs";

export async function POST(request: Request) {
  try {
    return await saveDonationAttempt((await request.json()) as DonationAttemptBody);
  } catch (error) {
    console.error("Donation attempt API error:", error);
    return NextResponse.json({ error: "Unable to create donation attempt." }, { status: 500 });
  }
}

export async function PATCH(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as AttachAttemptBody;

    const attemptId =
      body.attemptId
        ?.trim();

    const stripeCheckoutSessionId =
      body.stripeCheckoutSessionId
        ?.trim();

    if (
      !attemptId ||
      !stripeCheckoutSessionId
    ) {
      return NextResponse.json(
        {
          error:
            "Attempt ID and Stripe Checkout Session ID are required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data:
        attempt,
      error:
        attemptError,
    } =
      await supabaseAdmin
        .from(
          "donation_attempts",
        )
        .select(
          `
            id,
            status
          `,
        )
        .eq(
          "id",
          attemptId,
        )
        .maybeSingle();

    if (
      attemptError
    ) {
      console.error(
        "Donation attempt attach lookup error:",
        attemptError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load donation attempt.",
        },
        {
          status: 500,
        },
      );
    }

    if (!attempt) {
      return NextResponse.json(
        {
          error:
            "Donation attempt was not found.",
        },
        {
          status: 404,
        },
      );
    }

    await stripe.checkout
      .sessions.update(
        stripeCheckoutSessionId,
        {
          metadata: {
            // Stripe merges metadata keys. Avoid rewriting a stale snapshot,
            // which could erase the webhook's delivery marker during a race.
            ...captureMetaRequest(request),

            donation_attempt_id:
              attemptId,
          },
        },
      );

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "donation_attempts",
        )
        .update({
          stripe_checkout_session_id:
            stripeCheckoutSessionId,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          attemptId,
        );

    if (
      updateError
    ) {
      console.error(
        "Donation attempt Stripe attach database error:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to attach checkout session to donation attempt.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success:
        true,

      attemptId,

      stripeCheckoutSessionId,
    });
  } catch (
    error
  ) {
    console.error(
      "Donation attempt attach error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to attach donation attempt to Stripe.",
      },
      {
        status: 500,
      },
    );
  }
}
