import {
  NextResponse,
} from "next/server";

import {
  isCurrency,
  type Currency,
} from "@/lib/currency";

import {
  getUsdToCurrencyRate,
} from "@/lib/exchange-rate";

export const runtime =
  "nodejs";

/*
 * Public exchange-rate lookup used by the
 * in-modal currency switcher.
 *
 * The donor can change currency without a
 * full page reload; the modal fetches the
 * fresh rate here instead of a Server
 * Component refresh, which would tear down
 * the mounted Stripe wallets.
 */
export async function GET(
  request: Request,
) {
  const requested =
    new URL(
      request.url,
    ).searchParams.get(
      "currency",
    );

  if (
    !requested ||
    !isCurrency(
      requested,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Unsupported currency.",
      },
      {
        status: 400,
      },
    );
  }

  const currency:
    Currency =
    requested;

  try {
    const rate =
      await getUsdToCurrencyRate(
        currency,
      );

    if (
      !Number.isFinite(
        rate,
      ) ||
      rate <= 0
    ) {
      throw new Error(
        `Invalid exchange rate for ${currency}`,
      );
    }

    return NextResponse.json(
      {
        currency,
        rate,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error(
      "Currency rate API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load exchange rate.",
      },
      {
        status: 502,
      },
    );
  }
}
