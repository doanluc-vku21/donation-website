"use client";

import {
  Heart,
} from "lucide-react";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

import {
  DONATION_MODAL_OPEN_EVENT,
} from "./donation-modal-events";

type DonationModalTriggerProps = {
  locale: Locale;

  className?: string;

  label?: string;

  showHeart?: boolean;
};

export function DonationModalTrigger({
  locale,
  className = "",
  label,
  showHeart = true,
}: DonationModalTriggerProps) {
  const t =
    getUiTranslations(
      locale,
    );

  function openDonationModal() {
    window.dispatchEvent(
      new Event(
        DONATION_MODAL_OPEN_EVENT,
      ),
    );
  }

  return (
    <button
      type="button"
      onClick={
        openDonationModal
      }
      className={
        className
      }
    >
      {showHeart && (
        <Heart
          aria-hidden="true"
          className="size-[18px]"
        />
      )}

      {label ??
        t.donate}
    </button>
  );
}
