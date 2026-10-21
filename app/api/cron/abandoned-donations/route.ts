import {
  NextResponse,
} from "next/server";

import {
  resend,
} from "@/lib/resend";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import {
  stripe,
} from "@/lib/stripe/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const ABANDONED_AFTER_MINUTES =
  20;

const MAX_ATTEMPTS_PER_RUN =
  25;

type DonationAttemptRow = {
  id:
    string;

  campaign_id:
    string;

  campaign_slug:
    string;

  campaign_path:
    string;

  email:
    string;

  first_name:
    string | null;

  last_name:
    string | null;

  amount_cents:
    number;

  currency:
    string;

  frequency:
    "one_time" | "monthly";

  status:
    "pending" | "completed";

  stripe_checkout_session_id:
    string | null;

  reminder_sent_at:
    string | null;

  created_at:
    string;
};

function escapeHtml(
  value:
    string,
) {
  return value
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function formatAmount(
  amountCents:
    number,
  currency:
    string,
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency:
          currency.toUpperCase(),

        minimumFractionDigits:
          amountCents %
            100 ===
          0
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      amountCents /
        100,
    );
  } catch {
    return `${(
      amountCents /
      100
    ).toFixed(
      2,
    )} ${currency.toUpperCase()}`;
  }
}

function buildContinueUrl(
  campaignPath:
    string,
) {
  const siteUrl =
    (
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "https://donate.mealsupport.org"
    ).replace(
      /\/+$/,
      "",
    );

  const safePath =
    campaignPath.startsWith(
      "/",
    ) &&
    !campaignPath.startsWith(
      "//",
    )
      ? campaignPath
      : "/";

  return `${siteUrl}${safePath}#donation-panel`;
}

async function releaseReminderClaim(
  attemptId:
    string,
  claimTime:
    string,
) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "donation_attempts",
      )
      .update({
        reminder_sent_at:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        attemptId,
      )
      .eq(
        "status",
        "pending",
      )
      .eq(
        "reminder_sent_at",
        claimTime,
      );

  if (
    error
  ) {
    console.error(
      "Unable to release abandoned reminder claim:",
      attemptId,
      error,
    );
  }
}

async function markCompletedFromStripe(
  attemptId:
    string,
  checkoutSessionId:
    string,
) {
  const now =
    new Date().toISOString();

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "donation_attempts",
      )
      .update({
        status:
          "completed",

        completed_at:
          now,

        updated_at:
          now,

        stripe_checkout_session_id:
          checkoutSessionId,
      })
      .eq(
        "id",
        attemptId,
      );

  if (
    error
  ) {
    throw error;
  }
}

async function processAttempt(
  attempt:
    DonationAttemptRow,
) {
  const claimTime =
    new Date().toISOString();

  const {
    data:
      claimedAttempt,
    error:
      claimError,
  } =
    await supabaseAdmin
      .from(
        "donation_attempts",
      )
      .update({
        reminder_sent_at:
          claimTime,

        updated_at:
          claimTime,
      })
      .eq(
        "id",
        attempt.id,
      )
      .eq(
        "status",
        "pending",
      )
      .is(
        "reminder_sent_at",
        null,
      )
      .select(
        `
          id,
          campaign_id,
          campaign_slug,
          campaign_path,
          email,
          first_name,
          last_name,
          amount_cents,
          currency,
          frequency,
          status,
          stripe_checkout_session_id,
          reminder_sent_at,
          created_at
        `,
      )
      .maybeSingle();

  if (
    claimError
  ) {
    throw claimError;
  }

  if (
    !claimedAttempt
  ) {
    return {
      id:
        attempt.id,

      result:
        "skipped_already_claimed" as const,
    };
  }

  const claimed =
    claimedAttempt as DonationAttemptRow;

  if (
    claimed
      .stripe_checkout_session_id
  ) {
    try {
      const session =
        await stripe.checkout
          .sessions.retrieve(
            claimed
              .stripe_checkout_session_id,
          );

      if (
        session.payment_status ===
          "paid" ||
        session.status ===
          "complete"
      ) {
        await markCompletedFromStripe(
          claimed.id,
          session.id,
        );

        return {
          id:
            claimed.id,

          result:
            "completed_detected_from_stripe" as const,
        };
      }
    } catch (
      stripeError
    ) {
      console.error(
        "Unable to verify abandoned Stripe session:",
        claimed.id,
        claimed
          .stripe_checkout_session_id,
        stripeError,
      );

      await releaseReminderClaim(
        claimed.id,
        claimTime,
      );

      return {
        id:
          claimed.id,

        result:
          "stripe_verification_failed" as const,
      };
    }
  }

  const {
    data:
      latestAttempt,
    error:
      latestError,
  } =
    await supabaseAdmin
      .from(
        "donation_attempts",
      )
      .select(
        `
          id,
          status,
          completed_at
        `,
      )
      .eq(
        "id",
        claimed.id,
      )
      .maybeSingle();

  if (
    latestError
  ) {
    await releaseReminderClaim(
      claimed.id,
      claimTime,
    );

    throw latestError;
  }

  if (
    latestAttempt?.status ===
      "completed"
  ) {
    return {
      id:
        claimed.id,

      result:
        "completed_before_send" as const,
    };
  }

  const continueUrl =
    buildContinueUrl(
      claimed.campaign_path,
    );

  const amountLabel =
    formatAmount(
      Number(
        claimed.amount_cents,
      ),
      claimed.currency,
    );

  const firstName =
    claimed.first_name
      ?.trim() ??
    "";

  const greeting =
    firstName
      ? `Hi ${escapeHtml(
          firstName,
        )},`
      : "Hi,";

  const frequencyLabel =
    claimed.frequency ===
    "monthly"
      ? "monthly donation"
      : "donation";

  const safeContinueUrl =
    escapeHtml(
      continueUrl,
    );

  const safeAmountLabel =
    escapeHtml(
      amountLabel,
    );

  const subject =
    claimed.frequency ===
    "monthly"
      ? "Your monthly donation wasn’t completed"
      : "Your donation wasn’t completed";

  const html =
    `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f8f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      You can continue your donation where you left off.
    </div>

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="background:#f7f8f5;"
    >
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:560px;
              background:#ffffff;
              border:1px solid #e7ebe5;
              border-radius:18px;
            "
          >
            <tr>
              <td
                style="
                  padding:32px;
                  font-family:Arial,Helvetica,sans-serif;
                  color:#17233b;
                "
              >
                <div
                  style="
                    font-size:14px;
                    font-weight:700;
                    color:#25724a;
                    margin-bottom:20px;
                  "
                >
                  MEAL SUPPORT INC
                </div>

                <h1
                  style="
                    margin:0 0 16px;
                    font-size:24px;
                    line-height:1.3;
                    color:#17233b;
                  "
                >
                  Your donation wasn’t completed
                </h1>

                <p
                  style="
                    margin:0 0 16px;
                    font-size:16px;
                    line-height:1.65;
                    color:#45534b;
                  "
                >
                  ${greeting}
                </p>

                <p
                  style="
                    margin:0 0 16px;
                    font-size:16px;
                    line-height:1.65;
                    color:#45534b;
                  "
                >
                  It looks like your ${frequencyLabel} of
                  <strong>${safeAmountLabel}</strong>
                  wasn’t completed.
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:16px;
                    line-height:1.65;
                    color:#45534b;
                  "
                >
                  If you’d still like to help, you can continue
                  your donation where you left off.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="margin:0 0 26px;"
                >
                  <tr>
                    <td
                      bgcolor="#1f6a47"
                      style="border-radius:999px;"
                    >
                      <a
                        href="${safeContinueUrl}"
                        style="
                          display:inline-block;
                          padding:14px 24px;
                          font-family:Arial,Helvetica,sans-serif;
                          font-size:16px;
                          font-weight:700;
                          color:#ffffff;
                          text-decoration:none;
                        "
                      >
                        Continue my donation
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:0 0 10px;
                    font-size:13px;
                    line-height:1.6;
                    color:#7a857f;
                  "
                >
                  If you already completed your donation,
                  please disregard this email.
                </p>

                <p
                  style="
                    margin:0;
                    font-size:13px;
                    line-height:1.6;
                    color:#7a857f;
                  "
                >
                  Thank you for your kindness.<br />
                  MEAL SUPPORT INC
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();

  const text =
    [
      firstName
        ? `Hi ${firstName},`
        : "Hi,",
      "",
      `It looks like your ${frequencyLabel} of ${amountLabel} wasn’t completed.`,
      "",
      "If you’d still like to help, you can continue your donation where you left off:",
      continueUrl,
      "",
      "If you already completed your donation, please disregard this email.",
      "",
      "Thank you for your kindness.",
      "MEAL SUPPORT INC",
    ].join(
      "\n",
    );

  const {
    data:
      emailData,
    error:
      emailError,
  } =
    await resend.emails.send(
      {
        from:
          process.env
            .RESEND_FROM_EMAIL ??
          "MEAL SUPPORT INC <donations@mail.mealsupport.org>",

        to:
          claimed.email,

        replyTo:
          process.env
            .RESEND_REPLY_TO ??
          "support@mealsupport.org",

        subject,

        html,

        text,
      },
    );

  if (
    emailError
  ) {
    console.error(
      "Abandoned donation email error:",
      claimed.id,
      emailError,
    );

    await releaseReminderClaim(
      claimed.id,
      claimTime,
    );

    return {
      id:
        claimed.id,

      result:
        "email_failed" as const,

      error:
        emailError.message,
    };
  }

  return {
    id:
      claimed.id,

    result:
      "sent" as const,

    emailId:
      emailData?.id ??
      null,
  };
}

export async function GET(
  request:
    Request,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (
    !cronSecret
  ) {
    console.error(
      "Missing CRON_SECRET",
    );

    return NextResponse.json(
      {
        error:
          "Cron secret is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const abandonedBefore =
      new Date(
        Date.now() -
          ABANDONED_AFTER_MINUTES *
            60 *
            1000,
      ).toISOString();

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "donation_attempts",
        )
        .select(
          `
            id,
            campaign_id,
            campaign_slug,
            campaign_path,
            email,
            first_name,
            last_name,
            amount_cents,
            currency,
            frequency,
            status,
            stripe_checkout_session_id,
            reminder_sent_at,
            created_at
          `,
        )
        .eq(
          "status",
          "pending",
        )
        .is(
          "reminder_sent_at",
          null,
        )
        .lte(
          "created_at",
          abandonedBefore,
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          },
        )
        .limit(
          MAX_ATTEMPTS_PER_RUN,
        );

    if (
      error
    ) {
      console.error(
        "Abandoned donation query error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load abandoned donations.",
        },
        {
          status: 500,
        },
      );
    }

    const attempts =
      (
        data ??
        []
      ) as DonationAttemptRow[];

    const results = [];

    for (
      const attempt
      of attempts
    ) {
      try {
        const result =
          await processAttempt(
            attempt,
          );

        results.push(
          result,
        );
      } catch (
        attemptError
      ) {
        console.error(
          "Abandoned donation processing error:",
          attempt.id,
          attemptError,
        );

        results.push({
          id:
            attempt.id,

          result:
            "error",

          error:
            attemptError instanceof
              Error
              ? attemptError.message
              : "Unknown error",
        });
      }
    }

    const sent =
      results.filter(
        (
          result,
        ) =>
          result.result ===
          "sent",
      ).length;

    return NextResponse.json({
      success:
        true,

      checked:
        attempts.length,

      sent,

      results,
    });
  } catch (
    error
  ) {
    console.error(
      "Abandoned donation cron error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to process abandoned donations.",
      },
      {
        status: 500,
      },
    );
  }
}
