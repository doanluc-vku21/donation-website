/*
 * A donation row must survive even when the database refuses the
 * charged-currency columns.
 *
 * Deployments of the donations table that only accept the currency codes the
 * picker shipped with reject newer ones through a CHECK constraint, and a
 * rejected insert drops a paid gift from both the campaign page and the
 * raised total. The USD-normalized amount stays authoritative for stats, so
 * the retry below keeps it and gives up only the charged-currency detail.
 */

/*
 * Rejections that mean "this column value is not acceptable here" rather than
 * "the write failed":
 *
 * 23514  check_violation          – a CHECK constraint refused the value
 * 22P02  invalid_text_representation – an enum/type column refused the value
 * 22001  string_data_right_truncation – the column is narrower than the value
 * 42703  undefined_column         – the column is missing in this deployment
 */
const chargedColumnRejectionCodes: readonly string[] = [
  "23514",
  "22P02",
  "22001",
  "42703",
];

export function isChargedColumnRejection(
  error:
    | {
        code?: string | null;
      }
    | null
    | undefined,
): boolean {
  const code = error?.code;

  return (
    typeof code === "string" && chargedColumnRejectionCodes.includes(code)
  );
}

/*
 * Retry unless the row is already there: a duplicate means a concurrent
 * delivery won the race, and inserting again would only move the row further
 * away from the caller's expectation. Every other failure — a schema
 * rejection or a transient error — is worth one attempt without the
 * charged-currency columns, because landing the money matters more than
 * landing the currency detail.
 */
export function shouldRetryWithoutChargedCurrency(
  error:
    | {
        code?: string | null;
      }
    | null
    | undefined,
): boolean {
  return Boolean(error) && error?.code !== "23505";
}

/*
 * Drops the charged-currency detail while keeping the USD-normalized
 * accounting columns that campaign stats and the public list rely on.
 */
export function withoutChargedCurrencyColumns(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...payload,

    charged_amount_cents: null,

    charged_fee_amount_cents: null,

    charged_total_amount_cents: null,

    charged_currency: null,
  };
}
