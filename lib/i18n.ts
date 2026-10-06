export const locales = [
  "en",
  "fr",
  "de",
  "es",
  "ar",
] as const;

export type Locale =
  (typeof locales)[number];

export const defaultLocale:
  Locale = "en";

export const localeLabels:
  Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  ar: "العربية",
};

export function isLocale(
  value:
    | string
    | undefined
    | null,
): value is Locale {
  return locales.includes(
    value as Locale,
  );
}

export function getDirection(
  locale: Locale,
) {
  return locale === "ar"
    ? "rtl"
    : "ltr";
}