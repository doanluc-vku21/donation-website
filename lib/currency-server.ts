import {
  cookies,
  headers,
} from "next/headers";

import {
  defaultCurrency,
  getCurrencyForCountry,
  isCurrency,
  type Currency,
} from "@/lib/currency";

import {
  getUsdToCurrencyRate,
} from "@/lib/exchange-rate";

// =========================================================
// TYPES
// =========================================================

export type CurrencyDetection = {
  currency:
    Currency;

  country:
    string | null;

  source:
    | "cookie"
    | "geo"
    | "fallback";
};

export type CurrencyContext =
  CurrencyDetection & {
    /**
     * 1 USD = exchangeRate currency
     *
     * Ví dụ:
     *
     * currency = EUR
     * exchangeRate = 0.86
     */
    exchangeRate:
      number;
  };

// =========================================================
// DETECT CURRENCY
// =========================================================

export async function getCurrency():
  Promise<CurrencyDetection> {
  const cookieStore =
    await cookies();

  const savedCurrency =
    cookieStore.get(
      "site_currency",
    )?.value;

  // =======================================================
  // 1. USER MANUAL CHOICE
  // =======================================================

  if (
    isCurrency(
      savedCurrency,
    )
  ) {
    return {
      currency:
        savedCurrency,

      country:
        null,

      source:
        "cookie",
    };
  }

  // =======================================================
  // 2. GEO COUNTRY
  // =======================================================

  const headerStore =
    await headers();

  const country =
    headerStore.get(
      "x-vercel-ip-country",
    );

  if (
    country
  ) {
    return {
      currency:
        getCurrencyForCountry(
          country,
        ),

      country:
        country
          .trim()
          .toUpperCase(),

      source:
        "geo",
    };
  }

  // =======================================================
  // 3. FALLBACK
  // =======================================================

  return {
    currency:
      defaultCurrency,

    country:
      null,

    source:
      "fallback",
  };
}

// =========================================================
// CURRENCY + EXCHANGE RATE
// =========================================================

export async function getCurrencyContext():
  Promise<CurrencyContext> {
  const detection =
    await getCurrency();

  // USD không cần external API.
  if (
    detection.currency ===
    "USD"
  ) {
    return {
      ...detection,

      exchangeRate:
        1,
    };
  }

  try {
    const exchangeRate =
      await getUsdToCurrencyRate(
        detection.currency,
      );

    return {
      ...detection,

      exchangeRate,
    };
  } catch (
    error
  ) {
    console.error(
      "Currency exchange rate error:",
      error,
    );

    /*
     * QUAN TRỌNG:
     *
     * Không được làm:
     *
     * EUR + rate = 1
     *
     * vì khi đó $100 sẽ biến thành €100,
     * sai giá trị tiền.
     *
     * Nếu API tỷ giá lỗi, fallback hẳn về USD.
     */
    return {
      currency:
        "USD",

      country:
        detection.country,

      source:
        "fallback",

      exchangeRate:
        1,
    };
  }
}