// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  currencies,
  currencyLabels,
  currencySymbols,
  getCurrencyForCountry,
  isCurrency,
} from "@/lib/currency";
import { formatMoney, convertUsdToCurrencyMinor, convertCurrencyMinorToUsd } from "@/lib/money";

describe("expanded currency support", () => {
  it("defines labels, symbols, and formatting for all supported currencies", () => {
    expect(currencies.length).toBeGreaterThanOrEqual(100);
    for (const currency of currencies) {
      expect(isCurrency(currency)).toBe(true);
      expect(currencyLabels[currency]).toContain(currency);
      expect(currencySymbols[currency].length).toBeGreaterThan(0);

      const formatted = formatMoney(2500, currency, "en", { hideZeroDecimals: true });
      expect(formatted).toBeTruthy();

      const minor = convertUsdToCurrencyMinor(2500, 3.75);
      expect(minor).toBe(9375);
      expect(convertCurrencyMinorToUsd(minor, 3.75)).toBe(2500);
    }
  });

  it("maps donor countries to their local currencies", () => {
    expect(getCurrencyForCountry("SA")).toBe("SAR");
    expect(getCurrencyForCountry("QA")).toBe("QAR");
    expect(getCurrencyForCountry("CH")).toBe("CHF");
    expect(getCurrencyForCountry("SG")).toBe("SGD");
    expect(getCurrencyForCountry("MY")).toBe("MYR");
    expect(getCurrencyForCountry("TR")).toBe("TRY");
    expect(getCurrencyForCountry("SE")).toBe("SEK");
    expect(getCurrencyForCountry("NO")).toBe("NOK");
    expect(getCurrencyForCountry("DK")).toBe("DKK");
    expect(getCurrencyForCountry("NZ")).toBe("NZD");
    expect(getCurrencyForCountry("ZA")).toBe("ZAR");
    expect(getCurrencyForCountry("PL")).toBe("PLN");
    expect(getCurrencyForCountry("HK")).toBe("HKD");
    expect(getCurrencyForCountry("MX")).toBe("MXN");
    expect(getCurrencyForCountry("BR")).toBe("BRL");
  });
});
