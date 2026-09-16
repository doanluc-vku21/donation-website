"use client";

import {
  useEffect,
} from "react";

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<
        string,
        unknown
      >,
    ) => void;
  }
}

type MetaPixelPurchaseProps = {
  sessionId: string;
  value: number;
  currency: string;
  frequency: string;
};

export function MetaPixelPurchase({
  sessionId,
  value,
  currency,
  frequency,
}: MetaPixelPurchaseProps) {
  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      typeof window.fbq !==
        "function"
    ) {
      return;
    }

    const storageKey =
      `meta-purchase-${sessionId}`;

    // Tránh refresh trang Thank You
    // gửi Purchase nhiều lần
    // trong cùng browser session.
    if (
      window.sessionStorage.getItem(
        storageKey,
      )
    ) {
      return;
    }

    window.fbq(
      "track",
      "Purchase",
      {
        value,

        currency:
          currency.toUpperCase(),

        content_name:
          "Donation",

        content_category:
          frequency ===
          "monthly"
            ? "Monthly donation"
            : "One-time donation",
      },
    );

    window.sessionStorage.setItem(
      storageKey,
      "1",
    );
  }, [
    sessionId,
    value,
    currency,
    frequency,
  ]);

  return null;
}