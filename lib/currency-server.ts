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

export async function getCurrency():
  Promise<CurrencyDetection> {
  const cookieStore =
    await cookies();

  const savedCurrency =
    cookieStore.get(
      "site_currency",
    )?.value;

  // =========================================
  // 1. USER MANUAL CHOICE
  // =========================================

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

  // =========================================
  // 2. GEO COUNTRY
  // =========================================

  const headerStore =
    await headers();

  /*
   * Vercel production:
   * x-vercel-ip-country
   *
   * Ví dụ:
   * US
   * DE
   * FR
   * GB
   */
  const country =
    headerStore.get(
      "x-vercel-ip-country",
    );

  if (country) {
    return {
      currency:
        getCurrencyForCountry(
          country,
        ),

      country:
        country.toUpperCase(),

      source:
        "geo",
    };
  }

  // =========================================
  // 3. FALLBACK
  // =========================================

  return {
    currency:
      defaultCurrency,

    country:
      null,

    source:
      "fallback",
  };
}