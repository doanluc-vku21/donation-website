"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

import {
  currencies,
  currencySymbols,
  type Currency,
} from "@/lib/currency";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

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

/*
 * The currencies donors actually pick.
 * Everything else stays available through
 * the search field below.
 */
const quickCurrencies:
  Currency[] = [
  "USD",
  "BDT",
  "PKR",
  "INR",
  "EUR",
  "GBP",
  "AED",
  "SAR",
];

type CurrencyNames =
  | Intl.DisplayNames
  | null;

function buildCurrencyNames(
  locale: Locale,
): CurrencyNames {
  try {
    return new Intl.DisplayNames(
      [
        intlLocaleMap[
          locale
        ],
      ],
      {
        type:
          "currency",
      },
    );
  } catch {
    return null;
  }
}

function getCurrencyName(
  names: CurrencyNames,
  currency:
    Currency,
): string {
  try {
    return (
      names?.of(
        currency,
      ) ?? currency
    );
  } catch {
    return currency;
  }
}

type CurrencyPickerSheetProps = {
  open: boolean;

  currency:
    Currency;

  locale:
    Locale;

  pending?:
    boolean;

  onSelect: (
    currency:
      Currency,
  ) => void;

  onClose:
    () => void;
};

export function CurrencyPickerSheet({
  open,
  currency,
  locale,
  pending = false,
  onSelect,
  onClose,
}: CurrencyPickerSheetProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const [
    query,
    setQuery,
  ] = useState(
    "",
  );

  const searchRef =
    useRef<HTMLInputElement>(
      null,
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTimer =
      window.setTimeout(
        () => {
          searchRef.current?.focus(
            {
              preventScroll:
                true,
            },
          );
        },
        60,
      );

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event:
        KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        event.preventDefault();
        setQuery("");
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.clearTimeout(
        focusTimer,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
    onClose,
  ]);

  const names =
    useMemo(
      () =>
        buildCurrencyNames(
          locale,
        ),
      [
        locale,
      ],
    );

  const options =
    useMemo(
      () => {
        const needle =
          query
            .trim()
            .toLowerCase();

        return currencies
          .map(
            (
              code,
            ) => ({
              code,

              symbol:
                currencySymbols[
                  code
                ],

              name:
                getCurrencyName(
                  names,
                  code,
                ),
            }),
          )
          .filter(
            (option) => {
              if (
                !needle
              ) {
                return true;
              }

              return (
                option.code
                  .toLowerCase()
                  .includes(
                    needle,
                  ) ||
                option.name
                  .toLowerCase()
                  .includes(
                    needle,
                  )
              );
            },
          );
      },
      [
        names,
        query,
      ],
    );

  if (!open) {
    return null;
  }

  function closeSheet() {
    setQuery("");

    onClose();
  }

  function selectCurrency(
    code: Currency,
  ) {
    setQuery("");

    onSelect(code);
  }

  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[95]
        flex
        items-end
        justify-center
        bg-black/45
        px-0
        pb-0
        pt-10
        backdrop-blur-[2px]
        sm:items-center
        sm:p-4
      "
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeSheet();
        }
      }}
    >
      <div
        dir={
          locale ===
          "ar"
            ? "rtl"
            : "ltr"
        }
        role="dialog"
        aria-modal="true"
        aria-label={
          t.currencySheetTitle
        }
        className="
          flex
          max-h-[82dvh]
          w-full
          flex-col
          overflow-hidden
          rounded-t-[26px]
          bg-[#fffdfb]
          shadow-[0_-18px_60px_rgba(0,0,0,.26)]
          sm:max-h-[74vh]
          sm:max-w-[430px]
          sm:rounded-[24px]
          sm:shadow-[0_24px_80px_rgba(0,0,0,.28)]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-5
            pb-2
            pt-4
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#8a938c]
              "
            >
              {
                t.donationAmount
              }
            </p>

            <h3
              className="
                mt-0.5
                text-[18px]
                font-bold
                leading-tight
                tracking-[-0.02em]
                text-[#12233d]
              "
            >
              {
                t.currencySheetTitle
              }
            </h3>
          </div>

          <button
            type="button"
            onClick={
              closeSheet
            }
            aria-label={
              t.closeDonationForm
            }
            className="
              grid
              size-8
              shrink-0
              place-items-center
              rounded-full
              bg-[#f4f1ee]
              text-[#5f6975]
              transition
              hover:bg-[#eae5e1]
              hover:text-[#12233d]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#24543d]
            "
          >
            <X
              aria-hidden="true"
              className="
                size-4
              "
            />
          </button>
        </div>

        <div
          className="
            px-5
            pb-1
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              rounded-[12px]
              border
              border-[#e4e7e0]
              bg-white
              px-3
              py-2.5
              focus-within:border-[#9db9a5]
            "
          >
            <Search
              aria-hidden="true"
              className="
                size-4
                shrink-0
                text-[#9aa39c]
              "
            />

            <input
              ref={
                searchRef
              }
              type="search"
              value={
                query
              }
              onChange={(
                event,
              ) =>
                setQuery(
                  event
                    .target
                    .value,
                )
              }
              placeholder={
                t.searchCurrency
              }
              aria-label={
                t.searchCurrency
              }
              autoComplete="off"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[13px]
                font-medium
                text-[#12233d]
                outline-none
                placeholder:text-[#9aa39c]
              "
            />
          </div>

          <div
            className="
              -mx-1
              mt-2.5
              flex
              gap-1.5
              overflow-x-auto
              px-1
              pb-1
              [scrollbar-width:none]
            "
          >
            {quickCurrencies.map(
              (code) => {
                const active =
                  code ===
                  currency;

                return (
                  <button
                    key={
                      code
                    }
                    type="button"
                    aria-pressed={
                      active
                    }
                    onClick={() =>
                      selectCurrency(
                        code,
                      )
                    }
                    className={`
                      inline-flex
                      shrink-0
                      items-center
                      gap-1
                      rounded-full
                      border
                      px-2.5
                      py-1
                      text-[11px]
                      font-bold
                      transition
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-[#24543d]
                      ${
                        active
                          ? "border-[#24543d] bg-[#24543d] text-white"
                          : "border-[#e4e7e0] bg-white text-[#3f4a43] hover:border-[#b6c8b8] hover:text-[#173e2a]"
                      }
                    `}
                  >
                    <span
                      aria-hidden="true"
                      className="
                        text-[12px]
                        leading-none
                      "
                    >
                      {
                        currencySymbols[
                          code
                        ]
                      }
                    </span>

                    {code}
                  </button>
                );
              },
            )}
          </div>
        </div>

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-2.5
            pb-[max(14px,env(safe-area-inset-bottom))]
            pt-1
          "
        >
          {options.length ===
          0 ? (
            <p
              className="
                px-3
                py-8
                text-center
                text-[13px]
                text-[#7a817d]
              "
            >
              {
                t.currencyEmpty
              }
            </p>
          ) : (
            <ul
              role="listbox"
              aria-label={
                t.currencySheetTitle
              }
              className="
                m-0
                list-none
                p-0
              "
            >
              {options.map(
                (option) => {
                  const active =
                    option.code ===
                    currency;

                  return (
                    <li
                      key={
                        option.code
                      }
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={
                          active
                        }
                        disabled={
                          pending
                        }
                        onClick={() =>
                          selectCurrency(
                            option.code,
                          )
                        }
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-[12px]
                          px-2.5
                          py-2.5
                          text-start
                          transition
                          focus-visible:outline-2
                          focus-visible:outline-offset-[-2px]
                          focus-visible:outline-[#24543d]
                          ${
                            active
                              ? "bg-[#eef4ec]"
                              : "hover:bg-[#f6f4f1]"
                          }
                        `}
                      >
                        <span
                          aria-hidden="true"
                          className={`
                            grid
                            size-9
                            shrink-0
                            place-items-center
                            rounded-full
                            text-[13px]
                            font-bold
                            ${
                              active
                                ? "bg-[#24543d] text-white"
                                : "bg-[#f2efe9] text-[#3f4a43]"
                            }
                          `}
                        >
                          {
                            option.symbol
                          }
                        </span>

                        <span
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <span
                            className="
                              block
                              text-[13px]
                              font-bold
                              leading-tight
                              text-[#12233d]
                            "
                          >
                            {
                              option.code
                            }
                          </span>

                          <span
                            className="
                              mt-0.5
                              block
                              truncate
                              text-[11px]
                              text-[#7a817d]
                            "
                          >
                            {
                              option.name
                            }
                          </span>
                        </span>

                        {active && (
                          <Check
                            aria-hidden="true"
                            className="
                              size-4
                              shrink-0
                              text-[#24543d]
                            "
                          />
                        )}
                      </button>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/*
 * Inline trigger used next to the amount
 * field and in the "Choose your gift" row.
 */
export function CurrencyChipButton({
  currency,
  locale,
  onClick,
  variant = "solid",
  className = "",
}: {
  currency:
    Currency;

  locale:
    Locale;

  onClick:
    () => void;

  variant?:
    | "solid"
    | "ghost";

  className?:
    string;
}) {
  const t =
    getUiTranslations(
      locale,
    );

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      aria-label={`${t.changeCurrency}: ${currency}`}
      className={`
        inline-flex
        shrink-0
        items-center
        gap-1
        rounded-full
        text-[11px]
        font-bold
        uppercase
        tracking-[0.06em]
        transition
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-[#24543d]
        ${
          variant ===
          "solid"
            ? "border border-[#e2e6de] bg-white px-2 py-1 text-[#3f4a43] shadow-[0_1px_2px_rgba(18,35,29,.07)] hover:border-[#b6c8b8] hover:text-[#173e2a]"
            : "bg-[#f3f1ec] px-2 py-1 text-[#4b564e] hover:bg-[#e9e6df] hover:text-[#173e2a]"
        }
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className="
          text-[12px]
          leading-none
        "
      >
        {
          currencySymbols[
            currency
          ]
        }
      </span>

      {currency}

      <ChevronDown
        aria-hidden="true"
        className="
          size-3
          opacity-70
        "
      />
    </button>
  );
}
