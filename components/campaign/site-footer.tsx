"use client";

import { useState } from "react";
import {
  LockKeyhole,
  X,
} from "lucide-react";

type PopupKey =
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "refund";

const popupContent: Record<
  PopupKey,
  {
    title: string;
    content: React.ReactNode;
  }
> = {
  about: {
    title: "About",
    content: (
      <>
        <p>
          Open Hands Relief supports
          community-led programs focused on
          food security, education, family
          care, and practical support for
          children and families.
        </p>

        <p className="mt-4">
          Our goal is to make giving simple,
          transparent, and meaningful.
        </p>
      </>
    ),
  },

  contact: {
    title: "Contact",
    content: (
      <>
        <p>
          If you have questions about a
          donation, receipt, recurring gift,
          or payment issue, please contact
          our support team.
        </p>

        <p className="mt-4">
          Please include the email address
          used for your donation so we can
          assist you more quickly.
        </p>
      </>
    ),
  },

  privacy: {
    title: "Privacy Policy",
    content: (
      <>
        <p>
          We collect only the information
          needed to process and manage your
          donation, such as your name,
          email address, optional phone
          number, and donation details.
        </p>

        <p className="mt-4">
          Payment information is processed
          securely by Stripe and is not
          stored directly on our servers.
        </p>

        <p className="mt-4">
          We do not sell your personal
          information.
        </p>
      </>
    ),
  },

  terms: {
    title: "Terms & Conditions",
    content: (
      <>
        <p>
          By making a donation, you confirm
          that the payment information you
          provide is accurate and that you
          are authorized to use the selected
          payment method.
        </p>

        <p className="mt-4">
          Monthly donations will continue
          automatically until cancelled.
        </p>

        <p className="mt-4">
          Additional terms may apply
          depending on the campaign and
          payment method.
        </p>
      </>
    ),
  },

  refund: {
    title: "Donation / Refund Policy",
    content: (
      <>
        <p>
          Donations are generally considered
          final once successfully processed.
        </p>

        <p className="mt-4">
          If you believe a donation was made
          in error or there is a payment
          issue, please contact us as soon as
          possible so the request can be
          reviewed.
        </p>

        <p className="mt-4">
          Approved refunds will be returned
          to the original payment method.
        </p>
      </>
    ),
  },
};

export function SiteFooter() {
  const [activePopup, setActivePopup] =
    useState<PopupKey | null>(null);

  const activeContent =
    activePopup
      ? popupContent[activePopup]
      : null;

  return (
    <>
      <footer className="mt-14 border-t border-[var(--border)] py-8">
        <div className="flex flex-col gap-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--ink)]">
              Open Hands Relief
            </p>

            <p className="mt-1">
              Sample organization · UI preview
            </p>
          </div>

          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setActivePopup("about")
                  }
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  About
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    setActivePopup("contact")
                  }
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  Contact
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    setActivePopup("privacy")
                  }
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  Privacy
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    setActivePopup("terms")
                  }
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  Terms
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    setActivePopup("refund")
                  }
                  className="underline decoration-[var(--border)] underline-offset-4 transition hover:text-[var(--accent)]"
                >
                  Refund policy
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]">
          <LockKeyhole
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--success)]"
          />

          Secure payments are processed by
          Stripe.
        </p>
      </footer>

      {activeContent && (
        <div
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-end
            justify-center
            bg-black/35
            p-3
            backdrop-blur-[2px]

            sm:items-center
            sm:p-5
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-popup-title"
          onClick={() =>
            setActivePopup(null)
          }
        >
          <div
            className="
              relative
              max-h-[82vh]
              w-full
              max-w-lg
              overflow-y-auto
              rounded-[22px]
              border
              border-[var(--border)]
              bg-white
              p-6
              shadow-[0_24px_80px_rgba(0,0,0,.2)]

              sm:p-7
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              aria-label="Close popup"
              onClick={() =>
                setActivePopup(null)
              }
              className="
                absolute
                right-4
                top-4
                grid
                size-10
                place-items-center
                rounded-full
                border
                border-[var(--border)]
                bg-white
                text-[var(--muted)]
                transition

                hover:text-[var(--ink)]
              "
            >
              <X
                aria-hidden="true"
                className="size-4"
              />
            </button>

            <h3
              id="footer-popup-title"
              className="pr-12 text-xl font-semibold tracking-tight text-[var(--ink)]"
            >
              {activeContent.title}
            </h3>

            <div className="mt-5 text-sm leading-7 text-[var(--muted)] sm:text-base">
              {activeContent.content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}