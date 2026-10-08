"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  X,
} from "lucide-react";

import {
  convertUsdToCurrencyMinor,
  formatMoney,
} from "@/lib/money";

import type {
  Currency,
} from "@/lib/currency";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
  translateRelativeTime,
} from "@/lib/ui-translations";

import type {
  RecentDonation,
} from "@/lib/sample-data";

type RecentDonationsProps = {
  donations:
    RecentDonation[];

  locale:
    Locale;

  currency:
    Currency;

  exchangeRate:
    number;

  className?: string;

  previewLimit?: number;
};

type SortMode =
  | "recent"
  | "highest";

const localeMap:
  Record<
    Locale,
    string
  > = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  ar: "ar",
};

export function RecentDonations({
  donations,
  locale,
  currency,
  exchangeRate,
  className = "mt-12",
  previewLimit = 4,
}: RecentDonationsProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      "recent",
    );

  const previewDonations =
    donations.slice(
      0,
      previewLimit,
    );

  const sortedDonations =
    useMemo(() => {
      const result = [
        ...donations,
      ];

      if (
        sortMode ===
        "highest"
      ) {
        result.sort(
          (a, b) =>
            b.amountUsd -
            a.amountUsd,
        );
      }

      return result;
    }, [
      donations,
      sortMode,
    ]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const originalOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
      "hidden";

    function handleKeyDown(
      event:
        KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setModalOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style
        .overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    modalOpen,
  ]);

  if (
    donations.length ===
    0
  ) {
    return null;
  }

  return (
    <>
      {/* =========================================
          CONTRIBUTIONS
      ========================================== */}

      <section
        dir="ltr"
        className={`${className} w-full`}
        aria-labelledby="contributions-title"
      >
        {/* HEADER */}

        <div
          className="
            border-t
            border-[#e4e8e3]
            pt-8
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
              gap-4
            "
          >
            {/* HEADER TEXT */}

            <div
              dir={
                textDirection
              }
              className="
                min-w-0
                flex-1
              "
            >
              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[#24543d]
                "
              >
                {
                  t.communitySupport
                }
              </p>

              <h2
                id="contributions-title"
                className="
                  mt-1.5
                  text-[26px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-[#12233d]

                  sm:text-[30px]
                "
              >
                {
                  t.contributions
                }
              </h2>
            </div>

            {/* COUNT - KEEP LAYOUT */}

            <span
              dir={
                textDirection
              }
              className="
                mb-1
                shrink-0
                rounded-full
                bg-[#f4f7f2]
                px-3
                py-1.5
                text-[12px]
                font-medium
                text-[#6f7a86]
              "
            >
              {donations.length.toLocaleString(
                localeMap[
                  locale
                ],
              )}{" "}

              {donations.length ===
              1
                ? t.contribution
                : t.contributions}
            </span>
          </div>

          <p
            dir={
              textDirection
            }
            className="
              mt-2
              max-w-[520px]
              text-[14px]
              leading-6
              text-[#6f7a86]
            "
          >
            {
              t.recentSupport
            }
          </p>
        </div>

        {/* =====================================
            LIST
        ====================================== */}

        <div
          className="
            mt-5
            overflow-hidden
            rounded-[18px]
            border
            border-[#e4e7e2]
            bg-white
          "
        >
          <ul
            className="
              divide-y
              divide-[#edf0ec]
            "
          >
            {previewDonations.map(
              (
                donation,
              ) => (
                <ContributionRow
                  key={
                    donation.id
                  }
                  donation={
                    donation
                  }
                  locale={
                    locale
                  }
                  currency={
                    currency
                  }
                  exchangeRate={
                    exchangeRate
                  }
                />
              ),
            )}
          </ul>
        </div>

        {/* =====================================
            SEE ALL
        ====================================== */}

        {donations.length >
          previewLimit && (
          <button
            type="button"
            dir={
              textDirection
            }
            onClick={() => {
              setSortMode(
                "recent",
              );

              setModalOpen(
                true,
              );
            }}
            className="
              mt-4
              flex
              min-h-[48px]
              w-full
              items-center
              justify-center
              rounded-full
              border
              border-[#dfe4de]
              bg-white
              px-5
              text-[14px]
              font-semibold
              text-[#24543d]
              shadow-[0_2px_8px_rgba(20,50,35,.04)]
              transition

              hover:border-[#bfcabf]
              hover:bg-[#fafbf9]

              active:scale-[0.995]
            "
          >
            {
              t.seeAllContributions
            }
          </button>
        )}
      </section>

      {/* =========================================
          MODAL
      ========================================== */}

      {modalOpen && (
        <div
          dir="ltr"
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/45
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalOpen(
                false,
              );
            }
          }}
        >
          <section
            dir="ltr"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contributions-modal-title"
            className="
              flex
              max-h-[84vh]
              w-full
              max-w-[520px]
              flex-col
              overflow-hidden
              rounded-[22px]
              border
              border-[#e3e7e2]
              bg-white
              shadow-[0_24px_70px_rgba(0,0,0,.22)]
            "
          >
            {/* HEADER */}

            <div
              className="
                shrink-0
                border-b
                border-[#edf0ec]
                bg-white
                px-5
                pb-5
                pt-5

                sm:px-6
                sm:pt-6
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                {/* MODAL TEXT */}

                <div
                  dir={
                    textDirection
                  }
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-[#24543d]
                    "
                  >
                    {
                      t.communitySupport
                    }
                  </p>

                  <h2
                    id="contributions-modal-title"
                    className="
                      mt-1.5
                      text-[22px]
                      font-bold
                      tracking-[-0.025em]
                      text-[#12233d]
                    "
                  >
                    {
                      t.contributions
                    }
                  </h2>

                  <p
                    className="
                      mt-2
                      text-[13px]
                      leading-5
                      text-[#6f7a86]
                    "
                  >
                    {
                      t.browseLatestDonations
                    }
                  </p>
                </div>

                {/* CLOSE stays same side */}

                <button
                  type="button"
                  aria-label={
                    t.closeContributions
                  }
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="
                    -mr-1
                    -mt-1
                    grid
                    size-10
                    shrink-0
                    place-items-center
                    rounded-full
                    border
                    border-transparent
                    text-[#6f7a86]
                    transition

                    hover:border-[#e1e5e0]
                    hover:bg-[#f7f9f6]
                    hover:text-[#12233d]
                  "
                >
                  <X
                    aria-hidden="true"
                    className="size-5"
                  />
                </button>
              </div>

              {/* =====================================
                  SORT
              ====================================== */}

              <label
                dir={
                  textDirection
                }
                className="
                  mt-5
                  block
                "
              >
                <span
                  className="
                    block
                    text-[13px]
                    font-semibold
                    text-[#12233d]
                  "
                >
                  {
                    t.sortBy
                  }
                </span>

                <div
                  dir="ltr"
                  className="
                    relative
                    mt-2
                  "
                >
                  <select
                    dir={
                      textDirection
                    }
                    value={
                      sortMode
                    }
                    onChange={(
                      event,
                    ) =>
                      setSortMode(
                        event.target
                          .value as SortMode,
                      )
                    }
                    className="
                      min-h-[48px]
                      w-full
                      appearance-none
                      rounded-[12px]
                      border
                      border-[#dce2dc]
                      bg-[#fbfcfa]
                      px-4
                      pr-11
                      text-[14px]
                      font-medium
                      text-[#12233d]
                      outline-none
                      transition

                      focus:border-[#24543d]
                      focus:ring-2
                      focus:ring-[#dcebdc]
                    "
                  >
                    <option
                      value="recent"
                    >
                      {
                        t.mostRecent
                      }
                    </option>

                    <option
                      value="highest"
                    >
                      {
                        t.highestAmount
                      }
                    </option>
                  </select>

                  <ChevronDown
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      right-4
                      top-1/2
                      size-4
                      -translate-y-1/2
                      text-[#53665a]
                    "
                  />
                </div>
              </label>
            </div>

            {/* =====================================
                MODAL LIST
            ====================================== */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                bg-[#fcfdfb]
                px-4
                py-2

                sm:px-5
              "
            >
              <ul
                className="
                  divide-y
                  divide-[#edf0ec]
                "
              >
                {sortedDonations.map(
                  (
                    donation,
                  ) => (
                    <ContributionRow
                      key={
                        donation.id
                      }
                      donation={
                        donation
                      }
                      locale={
                        locale
                      }
                      currency={
                        currency
                      }
                      exchangeRate={
                        exchangeRate
                      }
                      modal
                    />
                  ),
                )}
              </ul>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

// =================================================
// CONTRIBUTION ROW
// =================================================

function ContributionRow({
  donation,
  locale,
  currency,
  exchangeRate,
  modal = false,
}: {
  donation:
    RecentDonation;

  locale:
    Locale;

  currency:
    Currency;

  exchangeRate:
    number;

  modal?: boolean;
}) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  const initials =
    getInitials(
      donation.displayName,
    );

  const translatedTime =
    translateRelativeTime(
      donation.relativeTime,
      locale,
    );

  const isAnonymous =
    donation.displayName
      .trim()
      .toLowerCase() ===
    "anonymous";

  return (
    <li
      dir="ltr"
      className={`
        group
        flex
        items-center
        gap-3
        transition

        ${
          modal
            ? "px-2 py-4"
            : "px-4 py-4 sm:px-5"
        }

        hover:bg-[#fbfcfa]
      `}
    >
      {/* =====================================
          AVATAR
      ====================================== */}

      <span
        dir="ltr"
        className="
          grid
          size-11
          shrink-0
          place-items-center
          rounded-full
          bg-[#edf7df]
          text-[12px]
          font-semibold
          text-[#24543d]
          ring-1
          ring-inset
          ring-[#e2efcf]
        "
      >
        {initials}
      </span>

      {/* =====================================
          NAME + TIME
      ====================================== */}

      <div
        dir={
          textDirection
        }
        className="
          min-w-0
          flex-1
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >
          <p
            className="
              truncate
              text-[14px]
              font-semibold
              text-[#12233d]

              sm:text-[15px]
            "
          >
            {
              donation
                .displayName
            }
          </p>

          {donation.frequency ===
            "monthly" && (
            <span
              className="
                shrink-0
                rounded-full
                bg-[#f1f6ee]
                px-2
                py-0.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-[#426a4f]
              "
            >
              {
                t.monthly
              }
            </span>
          )}
        </div>

        <p
          className="
            mt-1
            truncate
            text-[12px]
            text-[#718096]
          "
        >
          {
            translatedTime
          }
        </p>
      </div>

      {/* =====================================
          AMOUNT
      ====================================== */}

      {!isAnonymous && (
        <div
          dir="ltr"
          className="
            shrink-0
          "
        >
          <strong
            dir="ltr"
            className="
              inline-flex
              min-w-[48px]
              items-center
              justify-center
              rounded-full
              bg-[#eef6e8]
              px-3
              py-2
              text-[14px]
              font-bold
              text-[#14623f]
            "
          >
            {formatMoney(
              convertUsdToCurrencyMinor(
                donation.amountUsd,
                exchangeRate,
              ),
              currency,
              locale,
              {
                hideZeroDecimals:
                  true,
              },
            )}
          </strong>
        </div>
      )}
    </li>
  );
}

// =================================================
// INITIALS
// =================================================

function getInitials(
  displayName: string,
) {
  if (
    !displayName ||
    displayName
      .toLowerCase() ===
      "anonymous"
  ) {
    return "A";
  }

  const words =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[
      words.length -
        1
    ][0]
  ).toUpperCase();
}