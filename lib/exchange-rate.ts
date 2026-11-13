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
  NZD: 1.79,
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
  ZAR: 16.59,
  PLN: 3.96,
  HKD: 7.85,
  MXN: 18.64,
  BRL: 5.58,
  INR: 93.89,
  PKR: 277.3,
  BDT: 125,
  PHP: 63.63,
  THB: 33.8,
  IDR: 18227,
  CNY: 6.66,
  ILS: 3.19,
  EGP: 53.57,
  MAD: 9.86,
  DZD: 137,
  YER: 237.3,
  CZK: 21.98,
  RON: 4.82,
  BGN: 1.76,
  RSD: 106.1,
  BAM: 1.76,
  ALL: 81.84,
  MKD: 55.63,
  MDL: 18.14,
  UAH: 45.43,
  GEL: 2.6,
  AZN: 1.7,
  AMD: 361.6,
  LKR: 332.6,
  NPR: 150.7,
  MVR: 15.47,
  BND: 1.29,
  MOP: 8.09,
  KZT: 445.6,
  KGS: 87.63,
  TJS: 9.22,
  UZS: 11987,
  MNT: 3611,
  KHR: 4098,
  ARS: 1548,
  COP: 3295,
  PEN: 3.41,
  UYU: 40.61,
  BOB: 11.74,
  CRC: 451.4,
  DOP: 61.38,
  GTQ: 7.68,
  HNL: 27.05,
  NIO: 36.62,
  PAB: 1,
  JMD: 158.2,
  TTD: 6.77,
  BBD: 2.03,
  BSD: 1,
  BZD: 2.04,
  BMD: 1,
  KYD: 0.84,
  XCD: 2.75,
  GYD: 212.2,
  SRD: 37.83,
  HTG: 131.7,
  AWG: 1.8,
  ANG: 1.79,
  NGN: 1355,
  KES: 130,
  ETB: 162.2,
  TZS: 2650,
  BWP: 13.61,
  MUR: 47.62,
  NAD: 16.65,
  SCR: 14.34,
  SZL: 16.66,
  LSL: 16.65,
  ZMW: 20.46,
  MWK: 1739,
  MZN: 63.81,
  AOA: 920,
  CDF: 2299,
  CVE: 99.25,
  GMD: 73.75,
  LRD: 170.7,
  SLE: 23.11,
  SOS: 574.1,
  FJD: 2.27,
  PGK: 4.53,
  SBD: 8.08,
  TOP: 2.42,
  WST: 2.77,
  FKP: 0.75,
  GIP: 0.76,
  SHP: 0.75,
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