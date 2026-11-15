// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  calculateFeeContribution,
  convertUsdToWholeCurrencyMinor,
  formatMoney,
  toMajorUnits,
  toMajorUnitsForCode,
  toMinorUnits,
} from "@/lib/money";

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

describe("convertUsdToWholeCurrencyMinor", () => {
  it("rounds fractional local amounts to tidy whole units", () => {
    expect(convertUsdToWholeCurrencyMinor(2_500, 124.95)).toBe(312_400);
    expect(convertUsdToWholeCurrencyMinor(5_000, 124.95)).toBe(624_800);
    expect(convertUsdToWholeCurrencyMinor(7_500, 124.95)).toBe(937_100);
    expect(convertUsdToWholeCurrencyMinor(2_500, 1)).toBe(2_500);
  });

  it("never returns a fractional or sub-unit amount", () => {
    expect(convertUsdToWholeCurrencyMinor(2_000, 124.95) % 100).toBe(0);
    expect(convertUsdToWholeCurrencyMinor(1, 124.95)).toBe(100);
  });
});

describe("formatMoney minor units", () => {
  const plain = (text: string) => text.replace(/\u00a0/g, " ");

  it("shows zero-decimal currencies as whole units", () => {
    expect(formatMoney(3_800, "JPY", "en", { currencyDisplay: "narrowSymbol" })).toBe("¥3,800");
    expect(plain(formatMoney(3_800, "JPY", "en", { currencyDisplay: "code" }))).toBe("JPY 3,800");
    expect(plain(formatMoney(2_540_000, "VND", "en", { currencyDisplay: "code" }))).toBe("VND 2,540,000");
  });

  it("shows three-decimal currencies with thousandths", () => {
    expect(plain(formatMoney(2_500, "KWD", "en", { currencyDisplay: "code" }))).toBe("KWD 2.500");
    expect(plain(formatMoney(2_500, "BHD", "en", { currencyDisplay: "code" }))).toBe("BHD 2.500");
  });

  it("drops trailing zeros only when the amount is whole", () => {
    expect(plain(formatMoney(350_000, "HUF", "en", { hideZeroDecimals: true }))).toBe("HUF 3,500");
    expect(plain(formatMoney(350_050, "HUF", "en", { hideZeroDecimals: true }))).toBe("HUF 3,500.50");
  });
});

describe("major and minor unit helpers", () => {
  it("converts between Stripe amounts and displayed amounts", () => {
    expect(toMajorUnits(2_500, "USD")).toBe(25);
    expect(toMajorUnits(3_800, "JPY")).toBe(3_800);
    expect(toMajorUnits(2_500, "KWD")).toBe(2.5);
    expect(toMinorUnits(2.5, "KWD")).toBe(2_500);
    expect(toMajorUnitsForCode(3_800, "jpy")).toBe(3_800);
    expect(toMajorUnitsForCode(1_000, "ZZZ")).toBe(10);
  });

  it("scales the fixed fee into the local currency's minor units", () => {
    expect(calculateFeeContribution(2_500, 1, "USD")).toBe(103);
    // 2.9% of 3,800 = 110.2, plus $0.30 worth of yen (46) = 156.
    expect(calculateFeeContribution(3_800, 152, "JPY")).toBe(156);
    // 2.9% of KWD 2.500 = 72.5 fils, plus $0.30 worth of dinars (92) = 165.
    expect(calculateFeeContribution(2_500, 0.307, "KWD")).toBe(165);
  });
});
