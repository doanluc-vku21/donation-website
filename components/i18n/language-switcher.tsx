"use client";

import {
  Languages,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
}: {
  locale: Locale;
}) {
  const router =
    useRouter();

  function handleChange(
    nextLocale: Locale,
  ) {
    document.cookie =
      `site_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;

    router.refresh();
  }

  return (
    <label
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-[#dde3ea]
        bg-white
        px-3
        py-2
        text-sm
        shadow-sm
      "
    >
      <Languages
        aria-hidden="true"
        className="size-4"
      />

      <select
        value={locale}
        onChange={(
          event,
        ) =>
          handleChange(
            event.target
              .value as Locale,
          )
        }
        className="
          cursor-pointer
          bg-transparent
          font-medium
          outline-none
        "
        aria-label="Language"
      >
        {locales.map(
          (item) => (
            <option
              key={item}
              value={item}
            >
              {
                localeLabels[
                  item
                ]
              }
            </option>
          ),
        )}
      </select>
    </label>
  );
}