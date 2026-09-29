import type {
  FundUsageItem,
  SanityCampaign,
} from "@/sanity/types/campaign";

type FundUsageProps = {
  content: SanityCampaign;
};

export function FundUsage({
  content,
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
      {/* =========================================
          SECTION HEADER
      ========================================== */}

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

      {/* =========================================
          ITEMS
      ========================================== */}

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
              currency={
                content.currency ||
                "USD"
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
  currency,
  showDivider,
}: {
  item: FundUsageItem;

  currency: string;

  showDivider: boolean;
}) {
  // Existing items created before itemType
  // remain normal allocation items.
  const itemType =
    item.itemType ||
    "allocation";

  // ========================================================
  // TITLE + TEXT
  // ========================================================

  if (
    itemType === "text"
  ) {
    const title =
      item.title?.trim();

    const content =
      item.content?.trim();

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
  // ========================================================

  const amount =
    typeof item.amount ===
    "number"
      ? formatAmount(
          item.amount,
          currency,
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
              {amount}

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
// FORMAT AMOUNT
// ==========================================================

function formatAmount(
  amount: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          0,
      },
    ).format(
      amount,
    );
  } catch {
    return `$${amount.toLocaleString(
      "en-US",
    )}`;
  }
}