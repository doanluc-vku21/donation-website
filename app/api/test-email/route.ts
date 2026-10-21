import {
  NextResponse,
} from "next/server";

import {
  resend,
} from "@/lib/resend";

export const runtime =
  "nodejs";

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      await request.json();

    const email =
      String(
        body?.email ??
          "",
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
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
            "Invalid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data,
      error,
    } =
      await resend.emails.send(
        {
          from:
            "MEAL SUPPORT INC <donations@mail.mealsupport.org>",

          to:
            email,

          replyTo:
            "support@mealsupport.org",

          subject:
            "Test email from MEAL SUPPORT INC",

          html:
            `
              <div
                style="
                  font-family: Arial, sans-serif;
                  max-width: 560px;
                  margin: 0 auto;
                  padding: 24px;
                  color: #17233b;
                "
              >
                <h2
                  style="
                    margin: 0 0 16px;
                  "
                >
                  Resend is working ✅
                </h2>

                <p>
                  This is a test email sent from
                  MEAL SUPPORT INC using Resend.
                </p>

                <p>
                  If you received this email,
                  your domain verification and
                  API configuration are working.
                </p>

                <p
                  style="
                    margin-top: 28px;
                    color: #68736d;
                    font-size: 14px;
                  "
                >
                  MEAL SUPPORT INC
                </p>
              </div>
            `,
        },
      );

    if (error) {
      console.error(
        "Resend test email error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success:
        true,

      id:
        data?.id ??
        null,
    });
  } catch (
    error
  ) {
    console.error(
      "Test email route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to send test email.",
      },
      {
        status: 500,
      },
    );
  }
}