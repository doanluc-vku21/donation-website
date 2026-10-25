"use client";

import { useEffect } from "react";
import "@/lib/meta/client";
import { metaPurchaseEventId } from "@/lib/meta/config";

type MetaPixelPurchaseProps = {
  sessionId: string;
  value: number;
  currency: string;
  frequency: string;
};

// Survives React remounts when browser storage is unavailable.
const sentPurchases = new Set<string>();

export function MetaPixelPurchase({ sessionId, value, currency, frequency }: MetaPixelPurchaseProps) {
  useEffect(() => {
    if (!Number.isFinite(value) || value <= 0) return;
    const storageKey = `meta-purchase-${sessionId}`;
    let attempts = 0;
    const send = () => {
      if (sentPurchases.has(storageKey)) return true;
      try {
        if (window.sessionStorage.getItem(storageKey)) return true;
      } catch {
        // A storage policy must not suppress an otherwise valid conversion.
      }
      if (typeof window.fbq !== "function") return false;
      window.fbq("track", "Purchase", {
        value,
        currency: currency.toUpperCase(),
        content_name: "Donation",
        content_category: frequency === "monthly" ? "Monthly donation" : "One-time donation",
      }, { eventID: metaPurchaseEventId(sessionId) });
      sentPurchases.add(storageKey);
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // In-memory deduplication remains available.
      }
      return true;
    };
    if (send()) return;
    // The Pixel bootstrap may arrive after hydration. CAPI handles blocked JS.
    const timer = window.setInterval(() => {
      if (send() || ++attempts >= 40) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [sessionId, value, currency, frequency]);
  return null;
}
