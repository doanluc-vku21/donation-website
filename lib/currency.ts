export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "AED",
  "SAR",
  "QAR",
  "CHF",
  "SGD",
  "MYR",
  "TRY",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "ZAR",
  "PLN",
  "HKD",
  "MXN",
  "BRL",
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
  SAR: "SAR ﷼",
  QAR: "QAR ر.ق",
  CHF: "CHF ₣",
  SGD: "SGD $",
  MYR: "MYR RM",
  TRY: "TRY ₺",
  SEK: "SEK kr",
  NOK: "NOK kr",
  DKK: "DKK kr",
  NZD: "NZD $",
  ZAR: "ZAR R",
  PLN: "PLN zł",
  HKD: "HKD $",
  MXN: "MXN $",
  BRL: "BRL R$",
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
  SAR: "﷼",
  QAR: "ر.ق",
  CHF: "CHF",
  SGD: "$",
  MYR: "RM",
  TRY: "₺",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  NZD: "$",
  ZAR: "R",
  PLN: "zł",
  HKD: "$",
  MXN: "$",
  BRL: "R$",
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
  // AUSTRALIA & NEW ZEALAND
  // -----------------------------------------

  AU: "AUD",
  NZ: "NZD",

  // -----------------------------------------
  // MIDDLE EAST
  // -----------------------------------------

  AE: "AED",
  SA: "SAR",
  QA: "QAR",

  // -----------------------------------------
  // EUROPE (NON-EURO)
  // -----------------------------------------

  CH: "CHF",
  LI: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  TR: "TRY",

  // -----------------------------------------
  // ASIA PACIFIC
  // -----------------------------------------

  SG: "SGD",
  MY: "MYR",
  HK: "HKD",

  // -----------------------------------------
  // AFRICA & AMERICAS
  // -----------------------------------------

  ZA: "ZAR",
  MX: "MXN",
  BR: "BRL",
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
