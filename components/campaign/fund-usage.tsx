import type {
  Currency,
} from "@/lib/currency";

import type {
  Locale,
} from "@/lib/i18n";

import {
  convertUsdToCurrencyMinor,
  formatMoney,
} from "@/lib/money";

import type {
  FundUsageItem,
  SanityCampaign,
} from "@/sanity/types/campaign";

type FundUsageProps = {
  content: SanityCampaign;
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
};

export function FundUsage({
  content,
  locale,
  currency,
  exchangeRate,
}: FundUsageProps) {
  const items =
    content.fundUsageItems ??
    [];

  if (
    items.length === 0
  ) {
    return null;
  }

  const title =
    content.fundUsageTitle?.trim() ||
    "How the funds will be used";

  const subtitle =
    content.fundUsageSubtitle?.trim();

  return (
    <section
      className="
        mt-10
        w-full
        border-t
        border-[var(--border)]
        pt-8

        sm:mt-12
        sm:pt-10
      "
      aria-labelledby="fund-usage-title"
    >
      <h2
        id="fund-usage-title"
        className="
          text-[26px]
          font-bold
          leading-tight
          tracking-[-0.035em]
          text-[var(--ink)]

          sm:text-[30px]
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mt-2
            text-[15px]
            leading-6
            text-[var(--muted)]

            sm:text-[16px]
          "
        >
          {subtitle}
        </p>
      )}

      <div
        className="
          mt-6
          overflow-hidden
          rounded-[18px]
          border
          border-[var(--border)]
          bg-white
          px-5

          sm:px-6
        "
      >
        {items.map(
          (
            item,
            index,
          ) => (
            <FundUsageRow
              key={
                item._key ||
                `${index}`
              }
              item={
                item
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
              showDivider={
                index > 0
              }
            />
          ),
        )}
      </div>
    </section>
  );
}

// ==========================================================
// FUND USAGE ROW
// ==========================================================

function FundUsageRow({
  item,
  locale,
  currency,
  exchangeRate,
  showDivider,
}: {
  item: FundUsageItem;
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
  showDivider: boolean;
}) {
  const itemType =
    item.itemType ||
    "allocation";

  // ========================================================
  // TEXT ITEM
  // ========================================================

  if (
    itemType === "text"
  ) {
    const title =
      item.title?.trim()
        ? convertEmbeddedUsdAmounts(
            item.title.trim(),
            currency,
            locale,
            exchangeRate,
          )
        : undefined;

    const content =
      item.content?.trim()
        ? convertEmbeddedUsdAmounts(
            item.content.trim(),
            currency,
            locale,
            exchangeRate,
          )
        : undefined;

    if (
      !title &&
      !content
    ) {
      return null;
    }

    return (
      <article
        className={`
          py-6

          ${
            showDivider
              ? "border-t border-[var(--border)]"
              : ""
          }
        `}
      >
        {title && (
          <h3
            className="
              text-[16px]
              font-semibold
              leading-6
              text-[var(--ink)]

              sm:text-[17px]
            "
          >
            {title}
          </h3>
        )}

        {content && (
          <p
            className={`
              whitespace-pre-line
              text-[15px]
              leading-[1.65]
              text-[var(--muted)]

              sm:text-[16px]

              ${
                title
                  ? "mt-3"
                  : ""
              }
            `}
          >
            {content}
          </p>
        )}
      </article>
    );
  }

  // ========================================================
  // ALLOCATION
  //
  // Sanity `item.amount` is the base USD major-unit amount.
  // Example: 7000 = $7,000.
  // Convert it into minor units first, then to local currency.
  // ========================================================

  const amount =
    typeof item.amount ===
    "number"
      ? formatMoney(
          convertUsdToCurrencyMinor(
            Math.round(
              item.amount *
                100,
            ),
            exchangeRate,
          ),
          currency,
          locale,
          {
            hideZeroDecimals:
              true,
          },
        )
      : null;

  const title =
    item.title?.trim();

  const description =
    item.description?.trim();

  if (
    !amount &&
    !title &&
    !description
  ) {
    return null;
  }

  return (
    <article
      className={`
        py-6

        ${
          showDivider
            ? "border-t border-[var(--border)]"
            : ""
        }
      `}
    >
      {(amount ||
        title) && (
        <h3
          className="
            text-[16px]
            font-semibold
            leading-6
            text-[var(--ink)]

            sm:text-[17px]
          "
        >
          {amount && (
            <>
              <span
                dir="ltr"
                className="inline-block"
              >
                {amount}
              </span>

              {title
                ? ": "
                : ""}
            </>
          )}

          {title}
        </h3>
      )}

      {description && (
        <p
          className="
            mt-3
            whitespace-pre-line
            text-[15px]
            leading-[1.6]
            text-[var(--muted)]

            sm:text-[16px]
          "
        >
          {description}
        </p>
      )}
    </article>
  );
}

// ==========================================================
// CONVERT USD AMOUNTS EMBEDDED INSIDE TEXT
//
// Handles examples like:
//   $20,000
//   $20 000
//   20,000 $
//   20 000 $
//
// Sanity text is treated as base USD content.
// ==========================================================

function convertEmbeddedUsdAmounts(
  value: string,
  currency: Currency,
  locale: Locale,
  exchangeRate: number,
) {
  const convertNumber = (
    rawNumber: string,
  ) => {
    const normalized =
      rawNumber
        .replace(
          /[\s\u00A0\u202F,]/g,
          "",
        )
        .replace(
          /[.](?=\d{3}(?:\D|$))/g,
          "",
        );

    const usdAmount =
      Number(
        normalized,
      );

    if (
      !Number.isFinite(
        usdAmount,
      )
    ) {
      return null;
    }

    const localMinor =
      convertUsdToCurrencyMinor(
        Math.round(
          usdAmount *
            100,
        ),
        exchangeRate,
      );

    return formatMoney(
      localMinor,
      currency,
      locale,
      {
        hideZeroDecimals:
          true,
      },
    );
  };

  let result =
    value.replace(
      /\$\s*([\d][\d\s\u00A0\u202F,\.]*)/g,
      (
        full,
        rawNumber:
          string,
      ) =>
        convertNumber(
          rawNumber,
        ) ??
        full,
    );

  result =
    result.replace(
      /([\d][\d\s\u00A0\u202F,\.]*)\s*\$/g,
      (
        full,
        rawNumber:
          string,
      ) =>
        convertNumber(
          rawNumber,
        ) ??
        full,
    );

  return result;
}
