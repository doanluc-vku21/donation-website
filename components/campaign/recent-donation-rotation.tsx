"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play } from "lucide-react";
import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";
import { convertUsdToCurrencyMinor, formatMoney } from "@/lib/money";
import { getPublicDonations } from "@/lib/public-donations";
import type { RecentDonation } from "@/lib/sample-data";
import { getUiTranslations } from "@/lib/ui-translations";

type RotationValue = {
  donation: RecentDonation | undefined;
  canRotate: boolean;
  paused: boolean;
  togglePaused: () => void;
};

const RotationContext = createContext<RotationValue | null>(null);

export function RecentDonationRotationProvider({
  donations,
  enabled = true,
  children,
}: {
  donations: RecentDonation[];
  enabled?: boolean;
  children: ReactNode;
}) {
  const publicDonations = useMemo(() => getPublicDonations(donations), [donations]);
  const sequenceKey = useMemo(() => JSON.stringify(publicDonations.map(donation => donation.id)), [publicDonations]);
  const [position, setPosition] = useState({ sequenceKey, index: 0 });
  const [paused, setPaused] = useState(false);
  const togglePaused = useCallback(() => setPaused(current => !current), []);
  const count = publicDonations.length;
  const canRotate = enabled && count > 1;
  const index = position.sequenceKey === sequenceKey ? position.index : 0;
  const donation = publicDonations[index];

  useEffect(() => {
    if (!canRotate || paused) return;

    const timer = window.setInterval(() => {
      setPosition(current => ({
        sequenceKey,
        index: ((current.sequenceKey === sequenceKey ? current.index : 0) + 1) % count,
      }));
    }, 6000);

    return () => window.clearInterval(timer);
  }, [canRotate, paused, sequenceKey, count]);

  const value = useMemo(() => ({ donation, canRotate, paused, togglePaused }), [donation, canRotate, paused, togglePaused]);

  return <RotationContext.Provider value={value}>{children}</RotationContext.Provider>;
}

export function RotatingDonationHint({
  donations,
  locale,
  currency,
  exchangeRate,
  className = "",
  showArrow = false,
}: {
  donations: RecentDonation[];
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
  className?: string;
  showArrow?: boolean;
}) {
  const rotation = useContext(RotationContext);
  const donation = rotation ? rotation.donation : getPublicDonations(donations)[0];
  const t = getUiTranslations(locale);

  if (!donation) return null;

  const isAnonymous = donation.displayName.trim().toLowerCase() === "anonymous";
  const controlLabel = rotation?.paused ? t.resumeRecentDonations : t.pauseRecentDonations;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} aria-live="off" className={`flex min-w-0 items-center gap-1 ${className}`}>
      <p data-recent-donation-id={donation.id} className="flex min-w-0 flex-1 items-center gap-1">
        <span dir="ltr" className="min-w-0 truncate">{donation.displayName}</span>{" "}
        {!isAnonymous && (
          <span className="shrink-0 whitespace-nowrap">
            {t.donated}{" "}
            <span dir="ltr" className="inline-block">
              {formatMoney(convertUsdToCurrencyMinor(donation.amountUsd, exchangeRate), currency, locale, { hideZeroDecimals: true })}
            </span>
          </span>
        )}
        {showArrow && <span aria-hidden="true" className="shrink-0 rtl:rotate-180"> ›</span>}
      </p>
      {rotation?.canRotate && (
        <button
          type="button"
          aria-label={controlLabel}
          title={controlLabel}
          onClick={rotation.togglePaused}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-[#edf1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24543d]"
        >
          {rotation.paused ? <Play aria-hidden="true" className="size-3" /> : <Pause aria-hidden="true" className="size-3" />}
        </button>
      )}
    </div>
  );
}
