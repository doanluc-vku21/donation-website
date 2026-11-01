import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isCurrency, type Currency } from "@/lib/currency";

type DonationFrequency =
  | "one_time"
  | "monthly";

export type DonationAttemptBody = {
  campaignId:
    string;

  campaignSlug:
    string;

  campaignPath:
    string;

  email:
    string;

  firstName?:
    string;

  lastName?:
    string;

  amountCents:
    number;

  currency:
    Currency;

  frequency:
    DonationFrequency;
};

function isValidCampaignPath(
  value:
    string,
) {
  return (
    value.startsWith(
      "/",
    ) &&
    !value.startsWith(
      "//",
    ) &&
    !value.includes(
      "://",
    ) &&
    value.length <=
      200
  );
}

export async function saveDonationAttempt(
  body: DonationAttemptBody,
) {
  try {
    const {
      campaignId,
      campaignSlug,
      campaignPath,
      amountCents,
      currency,
      frequency,
    } = body;

    const email =
      body.email
        ?.trim()
        .toLowerCase() ??
      "";

    const firstName =
      body.firstName
        ?.trim() ??
      "";

    const lastName =
      body.lastName
        ?.trim() ??
      "";

    if (!campaignId) {
      return NextResponse.json(
        {
          error:
            "Campaign is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !campaignSlug ||
      !/^[a-z0-9-]+$/.test(
        campaignSlug,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid campaign slug.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !campaignPath ||
      !isValidCampaignPath(
        campaignPath,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid campaign path.",
        },
        {
          status: 400,
        },
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !email ||
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

    if (
      !Number.isInteger(
        amountCents,
      ) ||
      amountCents <
        100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid donation amount.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isCurrency(
        currency,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid currency.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      frequency !==
        "one_time" &&
      frequency !==
        "monthly"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid donation frequency.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data:
        campaign,
      error:
        campaignError,
    } =
      await supabaseAdmin
        .from(
          "campaigns",
        )
        .select(
          "id, slug",
        )
        .eq(
          "id",
          campaignId,
        )
        .eq(
          "slug",
          campaignSlug,
        )
        .eq(
          "is_active",
          true,
        )
        .maybeSingle();

    if (
      campaignError
    ) {
      console.error(
        "Donation attempt campaign lookup error:",
        campaignError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to validate campaign.",
        },
        {
          status: 500,
        },
      );
    }

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "Campaign was not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Reuse a recent pending attempt for the same donor/page.
     * This avoids creating multiple abandoned-email records when
     * the donor retries checkout or changes the amount.
     */
    const reuseAfter =
      new Date(
        Date.now() -
          2 *
            60 *
            60 *
            1000,
      ).toISOString();

    const {
      data:
        existingAttempt,
      error:
        existingAttemptError,
    } =
      await supabaseAdmin
        .from(
          "donation_attempts",
        )
        .select(
          "id",
        )
        .eq(
          "campaign_id",
          campaignId,
        )
        .eq(
          "campaign_path",
          campaignPath,
        )
        .ilike(
          "email",
          email,
        )
        .eq(
          "status",
          "pending",
        )
        .is(
          "reminder_sent_at",
          null,
        )
        .gte(
          "created_at",
          reuseAfter,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(
          1,
        )
        .maybeSingle();

    if (
      existingAttemptError
    ) {
      console.error(
        "Donation attempt lookup error:",
        existingAttemptError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check donation attempt.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      existingAttempt
    ) {
      const {
        data:
          updatedAttempt,
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "donation_attempts",
          )
          .update({
            first_name:
              firstName ||
              null,

            last_name:
              lastName ||
              null,

            amount_cents:
              amountCents,

            currency,

            frequency,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existingAttempt.id,
          )
          .select(
            `
              id,
              status,
              created_at
            `,
          )
          .single();

      if (
        updateError
      ) {
        console.error(
          "Donation attempt update error:",
          updateError,
        );

        return NextResponse.json(
          {
            error:
              "Unable to update donation attempt.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json(
        {
          attemptId:
            updatedAttempt.id,

          status:
            updatedAttempt.status,

          createdAt:
            updatedAttempt.created_at,

          reused:
            true,
        },
      );
    }

    const {
      data:
        attempt,
      error:
        insertError,
    } =
      await supabaseAdmin
        .from(
          "donation_attempts",
        )
        .insert({
          campaign_id:
            campaignId,

          campaign_slug:
            campaignSlug,

          campaign_path:
            campaignPath,

          email,

          first_name:
            firstName ||
            null,

          last_name:
            lastName ||
            null,

          amount_cents:
            amountCents,

          currency,

          frequency,

          status:
            "pending",

          reminder_sent_at:
            null,
        })
        .select(
          `
            id,
            status,
            created_at
          `,
        )
        .single();

    if (
      insertError
    ) {
      console.error(
        "Donation attempt insert error:",
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save donation attempt.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        attemptId:
          attempt.id,

        status:
          attempt.status,

        createdAt:
          attempt.created_at,

        reused:
          false,
      },
      {
        status: 201,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Donation attempt API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create donation attempt.",
      },
      {
        status: 500,
      },
    );
  }
}
