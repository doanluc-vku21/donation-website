import {
  NextResponse,
} from "next/server";

import {
  stripe,
} from "@/lib/stripe/server";

type UpdateExpressCheckoutBody = {
  sessionId:
    string;

  donor: {
    firstName:
      string;

    lastName:
      string;

    email:
      string;

    displayPublicly:
      boolean;
  };
};

function buildPublicDisplayName(
  firstName:
    string,
  lastName:
    string,
) {
  const first =
    firstName.trim();

  const last =
    lastName.trim();

  if (!first) {
    return "Donor";
  }

  if (!last) {
    return first;
  }

  return `${first} ${last.charAt(0)}.`;
}

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as UpdateExpressCheckoutBody;

    const sessionId =
      body.sessionId
        ?.trim();

    const firstName =
      body.donor
        ?.firstName
        ?.trim();

    const lastName =
      body.donor
        ?.lastName
        ?.trim();

    const email =
      body.donor
        ?.email
        ?.trim()
        .toLowerCase();

    const displayPublicly =
      body.donor
        ?.displayPublicly ===
      true;

    if (
      !sessionId ||
      !sessionId.startsWith(
        "cs_",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid checkout session.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !firstName ||
      !lastName ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter your name and email.",
        },
        {
          status: 400,
        },
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const session =
      await stripe.checkout
        .sessions.retrieve(
          sessionId,
        );

    if (
      session.status ===
      "complete"
    ) {
      return NextResponse.json(
        {
          error:
            "Checkout session is already complete.",
        },
        {
          status: 409,
        },
      );
    }

    const displayName =
      displayPublicly
        ? buildPublicDisplayName(
            firstName,
            lastName,
          )
        : "Anonymous";

    await stripe.checkout
      .sessions.update(
        sessionId,
        {
          metadata: {
            donor_first_name:
              firstName,

            donor_last_name:
              lastName,

            donor_email:
              email,

            display_name:
              displayName,

            is_anonymous:
              displayPublicly
                ? "false"
                : "true",
          },
        },
      );

    return NextResponse.json(
      {
        updated:
          true,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Express checkout donor update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update donor information.",
      },
      {
        status: 500,
      },
    );
  }
}
