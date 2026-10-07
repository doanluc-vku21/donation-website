import "server-only";

import type {
  Currency,
} from "@/lib/currency";

type FrankfurterRateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

const BASE_CURRENCY:
  Currency = "USD";

/**
 * Lấy tỷ giá:
 *
 * 1 USD = X targetCurrency
 *
 * Ví dụ:
 * USD -> EUR = 0.86
 *
 * Nghĩa là:
 * $100 ≈ €86
 */
export async function getUsdToCurrencyRate(
  currency: Currency,
): Promise<number> {
  if (
    currency ===
    BASE_CURRENCY
  ) {
    return 1;
  }

  const response =
    await fetch(
      `https://api.frankfurter.dev/v2/rate/${BASE_CURRENCY.toLowerCase()}/${currency.toLowerCase()}`,
      {
        next: {
          // Tỷ giá không cần fetch lại mỗi request.
          // Cache 6 giờ.
          revalidate:
            60 * 60 * 6,
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Unable to load exchange rate USD/${currency}`,
    );
  }

  const data =
    (await response.json()) as FrankfurterRateResponse;

  if (
    !Number.isFinite(
      data.rate,
    ) ||
    data.rate <= 0
  ) {
    throw new Error(
      `Invalid exchange rate USD/${currency}`,
    );
  }

  return data.rate;
}