"use client";

import {
  ChevronDown,
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
        gap-1.5

        sm:gap-2
      "
    >
      {/* =====================================
          LANGUAGE
          Mobile: icon only
          sm+: show language name
      ====================================== */}

      <label
        className="
          relative
          inline-flex
          min-h-[36px]
          min-w-[42px]
          items-center
          justify-center
          gap-1
          rounded-full
          border
          border-[#dde3ea]
          bg-white
          px-2
          text-[12px]
          shadow-sm

          sm:min-h-[42px]
          sm:min-w-0
          sm:justify-start
          sm:gap-2
          sm:px-3
          sm:text-sm
        "
      >
        <Languages
          aria-hidden="true"
          className="
            size-4
            shrink-0
          "
        />

        {/* Desktop/tablet visible text */}
        <span
          className="
            hidden
            max-w-[96px]
            truncate
            font-medium

            sm:inline
          "
        >
          {
            localeLabels[
              locale
            ]
          }
        </span>

        <ChevronDown
          aria-hidden="true"
          className="
            size-3
            shrink-0

            sm:size-3.5
          "
        />

        {/* Native select covers the whole pill */}
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
            absolute
            inset-0
            h-full
            w-full
            cursor-pointer
            opacity-0
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
          min-h-[36px]
          items-center
          rounded-full
          border
          border-[#dde3ea]
          bg-white
          px-2.5
          text-[12px]
          shadow-sm

          sm:min-h-[42px]
          sm:px-3
          sm:text-sm
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
            w-[58px]
            cursor-pointer
            bg-transparent
            font-semibold
            outline-none

            sm:w-auto
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
