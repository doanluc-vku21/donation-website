import {
  cookies,
  headers,
} from "next/headers";

import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n";

function detectLocaleFromBrowser(
  acceptLanguage:
    | string
    | null,
): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const firstLanguage =
    acceptLanguage
      .split(",")[0]
      ?.split(";")[0]
      ?.trim()
      .toLowerCase();

  if (!firstLanguage) {
    return defaultLocale;
  }

  const baseLanguage =
    firstLanguage
      .split("-")[0];

  if (
    isLocale(
      baseLanguage,
    )
  ) {
    return baseLanguage;
  }

  return defaultLocale;
}

export async function getLocale():
  Promise<Locale> {
  const cookieStore =
    await cookies();

  const savedLocale =
    cookieStore.get(
      "site_locale",
    )?.value;

  // =========================================
  // 1. USER MANUAL CHOICE
  // =========================================

  if (
    isLocale(
      savedLocale,
    )
  ) {
    return savedLocale;
  }

  // =========================================
  // 2. BROWSER PRIMARY LANGUAGE ONLY
  // =========================================

  const headerStore =
    await headers();

  const acceptLanguage =
    headerStore.get(
      "accept-language",
    );

  return detectLocaleFromBrowser(
    acceptLanguage,
  );
}