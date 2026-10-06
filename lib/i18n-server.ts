import {
  cookies,
} from "next/headers";

import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n";

export async function getLocale():
  Promise<Locale> {
  const cookieStore =
    await cookies();

  const value =
    cookieStore.get(
      "site_locale",
    )?.value;

  if (isLocale(value)) {
    return value;
  }

  return defaultLocale;
}