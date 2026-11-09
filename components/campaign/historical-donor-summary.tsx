import { Users } from "lucide-react";
import { getDirection, type Locale } from "@/lib/i18n";

const copy: Record<Locale, { donors: string }> = {
  en: {
    donors: "donors",
  },
  fr: {
    donors: "donateurs",
  },
  de: {
    donors: "Spenderinnen und Spender",
  },
  es: {
    donors: "donantes",
  },
  ar: {
    donors: "متبرع",
  },
};

export function HistoricalDonorSummary({ donorCount, locale }: {
  donorCount: number;
  locale: Locale;
}) {
  const text = copy[locale];

  return (
    <div dir={getDirection(locale)} data-donation-history="donor-count" className="rounded-xl bg-[#f5f8f2] px-3 py-2.5">
      <p className="flex items-center gap-2 text-[15px] font-semibold leading-6 text-[#234124]">
        <Users aria-hidden="true" className="size-4 shrink-0" />
        <span><span dir="ltr" className="inline-block">{new Intl.NumberFormat(locale).format(donorCount)}</span>{" "}{text.donors}</span>
      </p>
    </div>
  );
}
