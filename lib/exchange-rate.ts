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

const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const rateCache = new Map<Currency, { rate: number; expiresAt: number }>();

const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.75,
  CAD: 1.42,
  AUD: 1.46,
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  CHF: 0.83,
  SGD: 1.28,
  MYR: 4.07,
  TRY: 50.25,
  SEK: 9.94,
  NOK: 9.54,
  DKK: 6.73,
  NZD: 1.79,
  ZAR: 16.59,
  PLN: 3.96,
  HKD: 7.85,
  MXN: 18.64,
  BRL: 5.58,
};

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

  const now = Date.now();
  const cached = rateCache.get(currency);
  if (cached && cached.expiresAt > now) {
    return cached.rate;
  }

  try {
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

    if (response.ok) {
      const data =
        (await response.json()) as FrankfurterRateResponse;

      if (
        Number.isFinite(
          data.rate,
        ) &&
        data.rate > 0
      ) {
        rateCache.set(currency, {
          rate: data.rate,
          expiresAt: now + RATE_CACHE_TTL_MS,
        });

        return data.rate;
      }
    }
  } catch (error) {
    console.warn(`Exchange rate fetch failed for USD/${currency}, using fallback rate:`, error);
  }

  const fallback = FALLBACK_RATES[currency];
  if (fallback && fallback > 0) {
    return fallback;
  }

  throw new Error(
    `Unable to load exchange rate USD/${currency}`,
  );
}