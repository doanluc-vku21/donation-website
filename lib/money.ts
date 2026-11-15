import {
  getCurrencyMinorUnitExponent,
  getCurrencyMinorUnitFactor,
  getMinorUnitFactorForCode,
  type Currency,
} from "@/lib/currency";

import type {
  Locale,
} from "@/lib/i18n";

// =========================================================
// LOCALE → INTL LOCALE
// =========================================================

const intlLocaleMap:
  Record<
    Locale,
    string
  > = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  ar: "ar-AE",
};

// =========================================================
// MAJOR ↔ MINOR UNITS
// =========================================================

/**
 * Minor units in this project always match what Stripe expects
 * for the currency:
 *
 * USD: 100 = $1.00
 * JPY: 100 = ¥100
 * KWD: 1000 = KWD 1.000
 *
 * toMajorUnits() turns those integers into the number a donor
 * reads, so formatting and Meta values stay correct for
 * zero-decimal and three-decimal currencies.
 */
export function toMajorUnits(
  amountMinor: number,
  currency: Currency,
): number {
  return (
    amountMinor /
    getCurrencyMinorUnitFactor(
      currency,
    )
  );
}

/**
 * Same as toMajorUnits() for a raw Stripe / ISO code that has not
 * been narrowed to Currency yet. Unknown codes fall back to 2.
 */
export function toMajorUnitsForCode(
  amountMinor: number,
  currencyCode: string,
): number {
  return (
    amountMinor /
    getMinorUnitFactorForCode(
      currencyCode,
    )
  );
}

export function toMinorUnits(
  amountMajor: number,
  currency: Currency,
): number {
  return Math.round(
    amountMajor *
      getCurrencyMinorUnitFactor(
        currency,
      ),
  );
}

// =========================================================
// FORMAT MONEY
// =========================================================

export type MoneyFormatOptions = {
  hideZeroDecimals?: boolean;

  /*
   * Intl currencyDisplay.
   *
   * "narrowSymbol" turns
   * "BDT 3,124" into "৳3,124"
   * and keeps the code only for
   * currencies without a symbol.
   */
  currencyDisplay?:
    | "symbol"
    | "narrowSymbol"
    | "code"
    | "name";
};

export function formatMoney(
  amountMinor: number,
  currency: Currency,
  locale: Locale = "en",
  options?: MoneyFormatOptions,
) {
  const amount =
    toMajorUnits(
      amountMinor,
      currency,
    );

  /*
   * JPY has no subunit, KWD has thousandths.
   * Match the currency instead of always showing 2 digits.
   */
  const fractionDigits =
    options
      ?.hideZeroDecimals &&
    Number.isInteger(
      amount,
    )
      ? 0
      : getCurrencyMinorUnitExponent(
          currency,
        );

  const formatter =
    new Intl.NumberFormat(
      intlLocaleMap[
        locale
      ],
      {
        style:
          "currency",

        currency,

        ...(options
          ?.currencyDisplay
          ? {
              currencyDisplay:
                options.currencyDisplay,
            }
          : {}),

        minimumFractionDigits:
          fractionDigits,

        maximumFractionDigits:
          fractionDigits,
      },
    );

  return formatter.format(
    amount,
  );
}

// =========================================================
// LEGACY USD FORMATTER
// =========================================================

/**
 * Giữ lại để code cũ chưa migrate
 * không bị lỗi.
 *
 * Sau này có thể xoá khi toàn bộ app đã
 * chuyển sang formatMoney().
 */
export function formatUsd(
  cents: number,
) {
  return formatMoney(
    cents,
    "USD",
    "en",
  );
}

// =========================================================
// USD → LOCAL CURRENCY
// =========================================================

/**
 * Convert số tiền USD minor units
 * sang local currency minor units.
 *
 * Ví dụ:
 *
 * usdCents = 2500
 * rate = 0.86
 *
 * $25 → €21.50
 *
 * return = 2150
 *
 * Zero-decimal and three-decimal currencies are scaled by
 * 10 ** (exponent - 2) so JPY is not charged 100× and KWD is
 * not charged 10× less than intended.
 */
export function convertUsdToCurrencyMinor(
  usdCents: number,
  usdToCurrencyRate:
    number,
  currency: Currency = "USD",
) {
  if (
    !Number.isFinite(
      usdCents,
    ) ||
    !Number.isFinite(
      usdToCurrencyRate,
    ) ||
    usdToCurrencyRate <=
      0
  ) {
    return 0;
  }

  const exponentShift =
    getCurrencyMinorUnitExponent(
      currency,
    ) - 2;

  return Math.round(
    usdCents *
      usdToCurrencyRate *
      10 ** exponentShift,
  );
}

/**
 * Convert a USD amount (in cents) to the selected local currency's minor units,
 * rounded to the nearest whole major currency unit, so presets read as tidy
 * numbers such as 3,124 instead of 3,123.75.
 */
export function convertUsdToWholeCurrencyMinor(
  usdCents: number,
  usdToCurrencyRate: number,
  currency: Currency = "USD",
) {
  const factor =
    getCurrencyMinorUnitFactor(
      currency,
    );

  const minor =
    convertUsdToCurrencyMinor(
      usdCents,
      usdToCurrencyRate,
      currency,
    );

  if (minor <= 0) {
    return 0;
  }

  return Math.max(
    factor,
    Math.round(
      minor /
        factor,
    ) * factor,
  );
}

/**
 * Convert a USD minimum amount (in cents) to the selected local currency's
 * minor units, rounded to the nearest whole major currency unit (no pennies).
 */
export function convertUsdMinimumToWholeCurrencyMinor(
  usdCents: number,
  usdToCurrencyRate: number,
  currency: Currency = "USD",
) {
  return convertUsdToWholeCurrencyMinor(
    usdCents,
    usdToCurrencyRate,
    currency,
  );
}

// =========================================================
// LOCAL CURRENCY → USD
// =========================================================

/**
 * Dùng khi khách tự nhập local currency.
 *
 * Ví dụ:
 *
 * user nhập €50
 *
 * EUR minor = 5000
 * USD/EUR rate = 0.86
 *
 * USD ≈ $58.14
 *
 * return ≈ 5814 cents
 */
export function convertCurrencyMinorToUsd(
  amountMinor: number,
  usdToCurrencyRate:
    number,
  currency: Currency = "USD",
) {
  if (
    !Number.isFinite(
      amountMinor,
    ) ||
    !Number.isFinite(
      usdToCurrencyRate,
    ) ||
    usdToCurrencyRate <=
      0
  ) {
    return 0;
  }

  const exponentShift =
    2 -
    getCurrencyMinorUnitExponent(
      currency,
    );

  return Math.round(
    amountMinor *
      10 ** exponentShift /
      usdToCurrencyRate,
  );
}

// =========================================================
// PROCESSING FEE
// =========================================================

/**
 * Công thức hiện tại của website:
 *
 * 2.9% + $0.30
 *
 * Khi currency != USD:
 * phần fixed $0.30 được convert sang
 * local currency.
 *
 * LƯU Ý:
 *
 * Đây vẫn chỉ là "fee contribution estimate".
 * Stripe fee thật có thể khác tùy quốc gia /
 * payment method / international card.
 */
export function calculateFeeContribution(
  amountMinor: number,
  usdToCurrencyRate = 1,
  currency: Currency = "USD",
) {
  const factor =
    getCurrencyMinorUnitFactor(
      currency,
    );

  /*
   * $0.30 expressed in the local currency's minor units.
   */
  const fixedFee =
    Math.round(
      30 *
        usdToCurrencyRate *
        factor /
        100,
    );

  return Math.round(
    amountMinor *
      0.029 +
      fixedFee,
  );
}

// =========================================================
// PROGRESS
// =========================================================

export function progressPercent(
  raisedCents: number,
  goalCents: number,
) {
  if (
    goalCents <= 0
  ) {
    return 0;
  }

  const percent =
    (raisedCents /
      goalCents) *
    100;

  if (
    raisedCents <= 0
  ) {
    return 0;
  }

  if (
    percent < 1
  ) {
    return Number(
      percent.toFixed(
        1,
      ),
    );
  }

  return Math.round(
    percent,
  );
}
