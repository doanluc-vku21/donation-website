"use client";

import {
  Languages,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n";

import {
  currencies,
  currencyLabels,
  type Currency,
} from "@/lib/currency";

type LocaleCurrencySwitcherProps = {
  locale:
    Locale;

  currency:
    Currency;
};

export function LocaleCurrencySwitcher({
  locale,
  currency,
}: LocaleCurrencySwitcherProps) {
  const router =
    useRouter();

  function handleLocaleChange(
    nextLocale:
      Locale,
  ) {
    document.cookie =
      `site_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;

    router.refresh();
  }

  function handleCurrencyChange(
    nextCurrency:
      Currency,
  ) {
    document.cookie =
      `site_currency=${nextCurrency}; Path=/; Max-Age=31536000; SameSite=Lax`;

    router.refresh();
  }

  return (
    <div
      dir="ltr"
      className="
        flex
        items-center
        gap-2
      "
    >
      {/* =====================================
          LANGUAGE
      ====================================== */}

      <label
        className="
          inline-flex
          min-h-[42px]
          items-center
          gap-2
          rounded-full
          border
          border-[#dde3ea]
          bg-white
          px-3
          text-sm
          shadow-sm
        "
      >
        <Languages
          aria-hidden="true"
          className="size-4"
        />

        <select
          value={
            locale
          }
          onChange={(
            event,
          ) =>
            handleLocaleChange(
              event.target
                .value as Locale,
            )
          }
          aria-label="Language"
          className="
            max-w-[110px]
            cursor-pointer
            bg-transparent
            font-medium
            outline-none
          "
        >
          {locales.map(
            (
              item,
            ) => (
              <option
                key={
                  item
                }
                value={
                  item
                }
              >
                {
                  localeLabels[
                    item
                  ]
                }
              </option>
            ),
          )}
        </select>
      </label>

      {/* =====================================
          CURRENCY
      ====================================== */}

      <label
        className="
          inline-flex
          min-h-[42px]
          items-center
          rounded-full
          border
          border-[#dde3ea]
          bg-white
          px-3
          text-sm
          shadow-sm
        "
      >
        <select
          value={
            currency
          }
          onChange={(
            event,
          ) =>
            handleCurrencyChange(
              event.target
                .value as Currency,
            )
          }
          aria-label="Currency"
          className="
            cursor-pointer
            bg-transparent
            font-semibold
            outline-none
          "
        >
          {currencies.map(
            (
              item,
            ) => (
              <option
                key={
                  item
                }
                value={
                  item
                }
              >
                {
                  currencyLabels[
                    item
                  ]
                }
              </option>
            ),
          )}
        </select>
      </label>
    </div>
  );
}