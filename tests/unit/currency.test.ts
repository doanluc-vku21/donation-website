// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  currencies,
  currencyLabels,
  currencySymbols,
  getCurrencyForCountry,
  isCurrency,
} from "@/lib/currency";
import {
  formatMoney,
  convertUsdToCurrencyMinor,
  convertUsdMinimumToWholeCurrencyMinor,
  convertCurrencyMinorToUsd,
} from "@/lib/money";
import {
  getCurrencyMinorUnitExponent,
  getCurrencyMinorUnitFactor,
} from "@/lib/currency";

describe("expanded currency support", () => {
  it("defines labels, symbols, and formatting for all supported currencies", () => {
    expect(currencies.length).toBeGreaterThanOrEqual(100);
    for (const currency of currencies) {
      expect(isCurrency(currency)).toBe(true);
      expect(currencyLabels[currency]).toContain(currency);
      expect(currencySymbols[currency].length).toBeGreaterThan(0);

      const formatted = formatMoney(2500, currency, "en", { hideZeroDecimals: true });
      expect(formatted).toBeTruthy();

      const minor = convertUsdToCurrencyMinor(2500, 3.75, currency);
      expect(minor).toBeGreaterThan(0);
      // Rounding to the currency's smallest unit may cost a few cents.
      expect(Math.abs(convertCurrencyMinorToUsd(minor, 3.75, currency) - 2500)).toBeLessThanOrEqual(20);
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

  it("rounds local-currency minimum donation amounts to whole numbers without pennies", () => {
    expect(convertUsdMinimumToWholeCurrencyMinor(2000, 1)).toBe(2000);
    expect(convertUsdMinimumToWholeCurrencyMinor(2000, 1.38)).toBe(2800);
    expect(convertUsdMinimumToWholeCurrencyMinor(2000, 0.86)).toBe(1700);
    expect(convertUsdMinimumToWholeCurrencyMinor(2500, 3.6725)).toBe(9200);
  });
});

describe("minor unit exponents", () => {
  it("matches Stripe's smallest unit for each currency", () => {
    expect(getCurrencyMinorUnitExponent("USD")).toBe(2);
    expect(getCurrencyMinorUnitFactor("USD")).toBe(100);
    expect(getCurrencyMinorUnitFactor("HUF")).toBe(100);
    expect(getCurrencyMinorUnitFactor("ISK")).toBe(100);
    expect(getCurrencyMinorUnitFactor("TWD")).toBe(100);
    expect(getCurrencyMinorUnitFactor("JPY")).toBe(1);
    expect(getCurrencyMinorUnitFactor("VND")).toBe(1);
    expect(getCurrencyMinorUnitFactor("KWD")).toBe(1000);
    expect(getCurrencyMinorUnitFactor("BHD")).toBe(1000);
  });

  it("converts USD to zero-decimal currencies without inflating them 100x", () => {
    // $25 -> 3,800 yen, charged as 3800 by Stripe.
    expect(convertUsdToCurrencyMinor(2500, 152, "JPY")).toBe(3800);
    expect(convertCurrencyMinorToUsd(3800, 152, "JPY")).toBe(2500);
    expect(convertUsdMinimumToWholeCurrencyMinor(2000, 152, "JPY")).toBe(3040);
    expect(convertUsdMinimumToWholeCurrencyMinor(20, 3700, "UGX")).toBe(740);
  });

  it("converts USD to three-decimal currencies by 1000 minor units", () => {
    expect(convertUsdToCurrencyMinor(2500, 0.307, "KWD")).toBe(7675);
    expect(convertUsdMinimumToWholeCurrencyMinor(2500, 0.307, "KWD")).toBe(8000);
    expect(convertCurrencyMinorToUsd(8000, 0.307, "KWD")).toBe(2606);
  });
});

describe("newly supported currencies", () => {
  it("carries labels, symbols, and country mappings", () => {
    expect(currencyLabels.JPY).toBe("JPY ¥");
    expect(currencyLabels.KWD).toBe("KWD د.ك");
    expect(currencySymbols.KRW).toBe("₩");
    expect(getCurrencyForCountry("JP")).toBe("JPY");
    expect(getCurrencyForCountry("KR")).toBe("KRW");
    expect(getCurrencyForCountry("TW")).toBe("TWD");
    expect(getCurrencyForCountry("KW")).toBe("KWD");
    expect(getCurrencyForCountry("CM")).toBe("XAF");
    expect(getCurrencyForCountry("SN")).toBe("XOF");
    expect(getCurrencyForCountry("PF")).toBe("XPF");
  });
});
