import { getDirection, type Locale } from "@/lib/i18n";
import type { Campaign } from "@/lib/sample-data";
import { getUiTranslations } from "@/lib/ui-translations";

type Props = {
  progress: NonNullable<Campaign["supporterProgress"]>;
  locale: Locale;
};

export function MonthlySupporterProgress({ progress, locale }: Props) {
  const t = getUiTranslations(locale);
  const { count, goal } = progress;
  const knownCount = count != null && Number.isInteger(count) && count >= 0;
  const percent = knownCount && goal > 0 ? Math.min(100, Math.round(count * 100 / goal)) : null;
  const supporterLabel = knownCount
    ? `${new Intl.NumberFormat(locale).format(count)} ${count === 1 ? t.monthlySupporter : t.monthlySupporters}`
    : t.monthlySupporters;

  return (
    <div dir={getDirection(locale)} className="flex min-w-0 items-center gap-4">
      <div role={percent == null ? undefined : "progressbar"} aria-label={supporterLabel}
        aria-valuemin={percent == null ? undefined : 0} aria-valuemax={percent == null ? undefined : 100}
        aria-valuenow={percent ?? undefined}
        className="grid size-[74px] shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#b0ee68 ${percent ?? 0}%, #edf1e8 0)` }}>
        <div className="grid size-[60px] place-items-center rounded-full bg-white">
          <strong dir="ltr" className="text-[18px] font-semibold text-[#161616]">{percent == null ? "—" : `${percent}%`}</strong>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-semibold leading-snug text-[#161616]">{supporterLabel}</p>
        <p className="mt-1 text-[15px] leading-snug text-[#737373]">
          {percent == null ? t.supporterCountUnavailable : t.supporterGoal.replace("{goal}", new Intl.NumberFormat(locale).format(goal))}
        </p>
        <p className="mt-2 text-[12px] leading-snug text-[#737373]">{t.joinAkramSupporters}</p>
      </div>
    </div>
  );
}
