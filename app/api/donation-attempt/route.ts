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
  attemptId?:
    string | null;

  stripeCheckoutSessionId:
    string;

  donor?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    displayPublicly?: boolean;
  };
};

function buildPublicDisplayName(firstName: string, lastName: string) {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!first) return "";
  if (!last) return first;
  return `${first} ${last.charAt(0)}.`;
}

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

    const bodyFirstName = body.donor?.firstName?.trim() ?? "";
    const bodyLastName = body.donor?.lastName?.trim() ?? "";
    const bodyEmail = body.donor?.email?.trim().toLowerCase() ?? "";
    const hasBodyDonor = Boolean(bodyFirstName || bodyLastName || bodyEmail);

    if (
      !stripeCheckoutSessionId ||
      (!attemptId && !hasBodyDonor)
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

    let attempt: {
      id: string;
      status: string;
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } | null = null;

    if (attemptId) {
      const {
        data:
          attemptData,
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
              status,
              email,
              first_name,
              last_name
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

      if (!attemptData) {
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

      attempt = attemptData;
    }

    const donorFirstName = (bodyFirstName || attempt?.first_name || "").trim();
    const donorLastName = (bodyLastName || attempt?.last_name || "").trim();
    const candidateEmail = (bodyEmail || attempt?.email || "").trim().toLowerCase();
    const donorEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail) ? candidateEmail : "";
    const isAnonymous = typeof body.donor?.displayPublicly === "boolean"
      ? !body.donor.displayPublicly
      : undefined;
    const displayName = isAnonymous === true
      ? "Anonymous"
      : buildPublicDisplayName(donorFirstName, donorLastName);

    await stripe.checkout
      .sessions.update(
        stripeCheckoutSessionId,
        {
          metadata: {
            // Stripe merges metadata keys. Avoid rewriting a stale snapshot,
            // which could erase the webhook's delivery marker during a race.
            ...captureMetaRequest(request),

            ...(attemptId ? { donation_attempt_id: attemptId } : {}),
            ...(donorFirstName ? { donor_first_name: donorFirstName } : {}),
            ...(donorLastName ? { donor_last_name: donorLastName } : {}),
            ...(donorEmail ? { donor_email: donorEmail } : {}),
            ...(displayName ? { display_name: displayName } : {}),
            ...(isAnonymous !== undefined ? { is_anonymous: isAnonymous ? "true" : "false" } : {}),
          },
        },
      );

    if (attemptId) {
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
    }

    return NextResponse.json({
      success:
        true,

      attemptId:
        attemptId ?? null,

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
