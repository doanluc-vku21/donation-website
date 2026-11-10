"use client";

import { useEffect, useEffectEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CampaignAutoRefresh({ campaignId, contributionCount }: { campaignId: string; contributionCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refresh = useEffectEvent(() => {
    if (document.visibilityState !== "visible" || !navigator.onLine || isPending) return;
    // Merge fresh server data without remounting the payment form or wallets.
    startTransition(() => router.refresh());
  });
  const onCount = useEffectEvent((event: MessageEvent<string>) => {
    try {
      const data: { count?: unknown } = JSON.parse(event.data);
      if (typeof data.count === "number" && Number.isSafeInteger(data.count) && data.count >= 0 && data.count !== contributionCount) {
        refresh();
      }
    } catch {
      // A malformed/disconnected stream must not replace the last good count.
    }
  });

  useEffect(() => {
    let source: EventSource | undefined;
    const connect = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) {
        source?.close();
        source = undefined;
        return;
      }
      if (!source && typeof EventSource !== "undefined") {
        source = new EventSource(`/api/campaigns/${encodeURIComponent(campaignId)}/contribution-events`);
        source.onmessage = event => onCount(event);
      }
    };
    connect();
    // Recovery for clients/proxies that do not support streaming.
    const timer = window.setInterval(() => refresh(), 15_000);
    const onResume = () => { connect(); refresh(); };
    window.addEventListener("focus", onResume);
    window.addEventListener("online", onResume);
    window.addEventListener("offline", onResume);
    document.addEventListener("visibilitychange", onResume);

    return () => {
      window.clearInterval(timer);
      source?.close();
      window.removeEventListener("focus", onResume);
      window.removeEventListener("online", onResume);
      window.removeEventListener("offline", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [campaignId]);

  return null;
}
