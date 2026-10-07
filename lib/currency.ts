export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "AED",
] as const;

export type Currency =
  (typeof currencies)[number];

export const defaultCurrency:
  Currency = "USD";

export const currencyLabels:
  Record<
    Currency,
    string
  > = {
  USD: "USD $",
  EUR: "EUR €",
  GBP: "GBP £",
  CAD: "CAD $",
  AUD: "AUD $",
  AED: "AED د.إ",
};

export const currencySymbols:
  Record<
    Currency,
    string
  > = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "$",
  AUD: "$",
  AED: "د.إ",
};

export function isCurrency(
  value:
    | string
    | undefined
    | null,
): value is Currency {
  return currencies.includes(
    value as Currency,
  );
}

// =========================================================
// COUNTRY → CURRENCY
// =========================================================

const countryCurrencyMap:
  Record<
    string,
    Currency
  > = {
  // -----------------------------------------
  // UNITED STATES
  // -----------------------------------------

  US: "USD",

  // -----------------------------------------
  // EUROZONE
  // -----------------------------------------

  AT: "EUR",
  BE: "EUR",
  HR: "EUR",
  CY: "EUR",
  EE: "EUR",
  FI: "EUR",
  FR: "EUR",
  DE: "EUR",
  GR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SK: "EUR",
  SI: "EUR",
  ES: "EUR",

  // -----------------------------------------
  // UNITED KINGDOM
  // -----------------------------------------

  GB: "GBP",

  // -----------------------------------------
  // CANADA
  // -----------------------------------------

  CA: "CAD",

  // -----------------------------------------
  // AUSTRALIA
  // -----------------------------------------

  AU: "AUD",

  // -----------------------------------------
  // UNITED ARAB EMIRATES
  // -----------------------------------------

  AE: "AED",
};

export function getCurrencyForCountry(
  country:
    | string
    | undefined
    | null,
): Currency {
  if (!country) {
    return defaultCurrency;
  }

  const normalized =
    country
      .trim()
      .toUpperCase();

  return (
    countryCurrencyMap[
      normalized
    ] ??
    defaultCurrency
  );
}