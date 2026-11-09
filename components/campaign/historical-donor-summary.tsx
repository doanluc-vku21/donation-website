import { Users } from "lucide-react";
import { getDirection, type Locale } from "@/lib/i18n";

const copy: Record<Locale, { donors: string; note: string }> = {
  en: {
    donors: "donors",
    note: "Includes historical and offline donations reported by the organizer.",
  },
  fr: {
    donors: "donateurs",
    note: "Inclut les dons historiques et hors ligne déclarés par l’organisateur.",
  },
  de: {
    donors: "Spenderinnen und Spender",
    note: "Enthält frühere und außerhalb dieser Website erfolgte Spenden laut Veranstalter.",
  },
  es: {
    donors: "donantes",
    note: "Incluye donaciones anteriores y fuera de línea declaradas por el organizador.",
  },
  ar: {
    donors: "متبرع",
    note: "يشمل التبرعات السابقة وغير الإلكترونية بحسب إفادة المنظّم.",
  },
};

export function HistoricalDonorSummary({ minimumDonorCount, locale }: {
  minimumDonorCount: number;
  locale: Locale;
}) {
  const text = copy[locale];

  return (
    <div dir={getDirection(locale)} data-donation-history="organizer-reported" className="rounded-xl bg-[#f5f8f2] px-3 py-2.5">
      <p className="flex items-center gap-2 text-[15px] font-semibold leading-6 text-[#234124]">
        <Users aria-hidden="true" className="size-4 shrink-0" />
        <span><span dir="ltr" className="inline-block">{new Intl.NumberFormat(locale).format(minimumDonorCount)}+</span>{" "}{text.donors}</span>
      </p>
      <p className="mt-1 text-xs leading-[18px] text-[#657263]">{text.note}</p>
    </div>
  );
}
