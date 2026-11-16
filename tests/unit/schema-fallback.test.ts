// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  isChargedColumnRejection,
  shouldRetryWithoutChargedCurrency,
  withoutChargedCurrencyColumns,
} from "@/lib/supabase/schema-fallback";

describe("charged currency schema fallback", () => {
  it.each(["23514", "22P02", "22001", "42703"])(
    "treats %s as a schema rejection that is safe to retry",
    code => {
      expect(isChargedColumnRejection({ code })).toBe(true);
    },
  );

  it.each(["23505", "08006", "PGRST301", "", undefined])(
    "keeps %s out of the retry path",
    code => {
      expect(isChargedColumnRejection({ code })).toBe(false);
    },
  );

  it("retries a schema rejection and any other failure that is not a duplicate", () => {
    expect(shouldRetryWithoutChargedCurrency({ code: "23514" })).toBe(true);
    expect(shouldRetryWithoutChargedCurrency({ code: "XX000" })).toBe(true);
    expect(shouldRetryWithoutChargedCurrency({ code: null })).toBe(true);
    expect(shouldRetryWithoutChargedCurrency({ code: "23505" })).toBe(false);
    expect(shouldRetryWithoutChargedCurrency(null)).toBe(false);
  });

  it("handles a missing error object", () => {
    expect(isChargedColumnRejection(null)).toBe(false);
    expect(isChargedColumnRejection(undefined)).toBe(false);
  });

  it("drops only the charged currency detail and keeps the USD accounting", () => {
    const payload = {
      campaign_id: "campaign-1",
      amount_cents: 10157,
      fee_amount_cents: 0,
      total_amount_cents: 10157,
      currency: "USD",
      charged_amount_cents: 12900,
      charged_fee_amount_cents: 0,
      charged_total_amount_cents: 12900,
      charged_currency: "SGD",
      usd_exchange_rate: 1.27,
      status: "succeeded",
    };

    expect(withoutChargedCurrencyColumns(payload)).toEqual({
      campaign_id: "campaign-1",
      amount_cents: 10157,
      fee_amount_cents: 0,
      total_amount_cents: 10157,
      currency: "USD",
      charged_amount_cents: null,
      charged_fee_amount_cents: null,
      charged_total_amount_cents: null,
      charged_currency: null,
      usd_exchange_rate: 1.27,
      status: "succeeded",
    });
    expect(payload.charged_currency).toBe("SGD");
  });
});
