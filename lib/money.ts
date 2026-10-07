import type {
  Currency,
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
// FORMAT MONEY
// =========================================================

/**
 * amountMinor:
 *
 * USD:
 * 100 = $1.00
 *
 * EUR:
 * 100 = €1.00
 *
 * GBP:
 * 100 = £1.00
 *
 * 6 currency hiện tại của project đều là
 * two-decimal currencies.
 */
export function formatMoney(
  amountMinor: number,
  currency: Currency,
  locale: Locale = "en",
  options?: {
    hideZeroDecimals?:
      boolean;
  },
) {
  const amount =
    amountMinor / 100;

  const formatter =
    new Intl.NumberFormat(
      intlLocaleMap[
        locale
      ],
      {
        style:
          "currency",

        currency,

        minimumFractionDigits:
          options
            ?.hideZeroDecimals &&
          Number.isInteger(
            amount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          options
            ?.hideZeroDecimals &&
          Number.isInteger(
            amount,
          )
            ? 0
            : 2,
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
 */
export function convertUsdToCurrencyMinor(
  usdCents: number,
  usdToCurrencyRate:
    number,
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

  return Math.round(
    usdCents *
      usdToCurrencyRate,
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

  return Math.round(
    amountMinor /
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
 * Đây vẫn chỉ là "fee contribution estimate".
 * Stripe fee thật có thể khác tùy quốc gia /
 * payment method / international card.
 */
export function calculateFeeContribution(
  amountMinor: number,
  usdToCurrencyRate = 1,
) {
  const fixedFee =
    Math.round(
      30 *
        usdToCurrencyRate,
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