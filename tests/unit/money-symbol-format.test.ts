// @vitest-environment node

import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

describe("formatMoney currency display", () => {
  it("renders the currency symbol instead of the ISO code when asked", () => {
    expect(formatMoney(312_400, "BDT", "en", { hideZeroDecimals: true, currencyDisplay: "narrowSymbol" })).toBe("৳3,124");
    expect(formatMoney(249_900, "BDT", "en", { hideZeroDecimals: true, currencyDisplay: "narrowSymbol" })).toBe("৳2,499");
    expect(formatMoney(2_500, "USD", "en", { currencyDisplay: "narrowSymbol" })).toBe("$25.00");
    expect(formatMoney(2_500, "EUR", "en", { currencyDisplay: "narrowSymbol" })).toBe("€25.00");
  });

  it("keeps the ISO code as the default display", () => {
    // Intl separates the code and the number with a non-breaking space.
    const plain = (text: string) => text.replace(/\u00a0/g, " ");

    expect(plain(formatMoney(312_400, "BDT", "en", { hideZeroDecimals: true }))).toBe("BDT 3,124");
    expect(plain(formatMoney(2_500, "USD", "en", { currencyDisplay: "code" }))).toBe("USD 25.00");
  });

  it("keeps the locale's own symbol placement", () => {
    expect(formatMoney(2_500, "EUR", "fr", { currencyDisplay: "narrowSymbol" })).toContain("25,00");
    expect(formatMoney(2_500, "EUR", "fr", { currencyDisplay: "narrowSymbol" })).toContain("€");
  });
});
