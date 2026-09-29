import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

type FundUsageProps = {
  content: SanityCampaign;
};

export function FundUsage({
  content,
}: FundUsageProps) {
  const items =
    content.fundUsageItems ?? [];

  if (items.length === 0) {
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
          (item, index) => {
            const amount =
              typeof item.amount ===
              "number"
                ? formatAmount(
                    item.amount,
                    content.currency ||
                      "USD",
                  )
                : null;

            const description =
              item.description?.trim();

            return (
              <article
                key={
                  item._key ||
                  `${item.title}-${index}`
                }
                className={`
                  py-6

                  ${
                    index > 0
                      ? "border-t border-[var(--border)]"
                      : ""
                  }
                `}
              >
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

                      {item.title
                        ? ": "
                        : ""}
                    </>
                  )}

                  {item.title}
                </h3>

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
          },
        )}
      </div>
    </section>
  );
}

function formatAmount(
  amount: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(amount);
  } catch {
    return `$${amount.toLocaleString(
      "en-US",
    )}`;
  }
}