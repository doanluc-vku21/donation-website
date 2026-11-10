import { Users } from "lucide-react";
import { getDirection, type Locale } from "@/lib/i18n";
import { getUiTranslations } from "@/lib/ui-translations";

export function HistoricalDonorSummary({ contributionCount, locale }: {
  contributionCount: number;
  locale: Locale;
}) {
  const t = getUiTranslations(locale);

  return (
    <div dir={getDirection(locale)} data-donation-history="contribution-count" className="rounded-xl bg-[#f5f8f2] px-3 py-2.5">
      <p className="flex items-center gap-2 text-[15px] font-semibold leading-6 text-[#234124]">
        <Users aria-hidden="true" className="size-4 shrink-0" />
        <span><span dir="ltr" className="inline-block">{new Intl.NumberFormat(locale).format(contributionCount)}</span>{" "}{contributionCount === 1 ? t.contribution : t.contributions}</span>
      </p>
    </div>
  );
}
