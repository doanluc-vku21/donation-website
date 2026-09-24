"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  LockKeyhole,
  X,
} from "lucide-react";

import {
  PortableText,
} from "@portabletext/react";

import type {
  FooterPopupContent,
  SanityCampaign,
} from "@/sanity/types/campaign";

type PopupKey =
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "refund";

type SiteFooterProps = {
  content: SanityCampaign;
};

type FooterLink = {
  key: PopupKey;
  fallbackLabel: string;
  fallbackTitle: string;
  data?: FooterPopupContent;
};

export function SiteFooter({
  content,
}: SiteFooterProps) {
  const [
    activePopup,
    setActivePopup,
  ] =
    useState<PopupKey | null>(
      null,
    );

  // =========================================
  // FOOTER LINKS
  // =========================================

  const links: FooterLink[] = [
    {
      key: "about",
      fallbackLabel: "About",
      fallbackTitle: "About",
      data: content.footerAbout,
    },

    {
      key: "contact",
      fallbackLabel: "Contact",
      fallbackTitle: "Contact",
      data: content.footerContact,
    },

    {
      key: "privacy",
      fallbackLabel: "Privacy",
      fallbackTitle:
        "Privacy Policy",
      data: content.footerPrivacy,
    },

    {
      key: "terms",
      fallbackLabel: "Terms",
      fallbackTitle:
        "Terms & Conditions",
      data: content.footerTerms,
    },

    {
      key: "refund",
      fallbackLabel:
        "Refund policy",

      fallbackTitle:
        "Donation / Refund Policy",

      data: content.footerRefund,
    },
  ];

  const activeLink =
    activePopup
      ? links.find(
          (item) =>
            item.key === activePopup,
        )
      : null;

  const activeContent =
    activeLink?.data;

  // =========================================
  // CLOSE WITH ESC
  // =========================================

  useEffect(() => {
    if (!activePopup) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setActivePopup(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [activePopup]);

  return (
    <>
      {/* =====================================
          FOOTER
      ====================================== */}

      <footer className="mt-14 border-t border-[var(--border)] py-8">
        <div className="flex flex-col gap-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          {/* ORGANIZATION */}

          <div>
            <p className="font-semibold text-[var(--ink)]">
              {content.footerOrganizationName ||
                content.organizationName ||
                "Open Hands Relief"}
            </p>

            
          </div>

          {/* LEGAL LINKS */}

          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {links.map(
                ({
                  key,
                  data,
                  fallbackLabel,
                }) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePopup(
                          key,
                        )
                      }
                      className="
                        underline
                        decoration-[var(--border)]
                        underline-offset-4
                        transition

                        hover:text-[var(--accent)]
                      "
                    >
                      {data?.label ||
                        fallbackLabel}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </div>

        {/* SECURE PAYMENT */}

        <p className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]">
          <LockKeyhole
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--success)]"
          />

          {content.footerSecureText ||
            "Secure payments are processed by Stripe."}
        </p>
      </footer>

      {/* =====================================
          POPUP
      ====================================== */}

      {activePopup &&
        activeLink && (
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
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              {/* CLOSE */}

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

              {/* TITLE */}

              <h3
                id="footer-popup-title"
                className="pr-12 text-xl font-semibold tracking-tight text-[var(--ink)]"
              >
                {activeContent
                  ?.title ||
                  activeLink.fallbackTitle}
              </h3>

              {/* CONTENT */}

              <div className="mt-5 text-sm leading-7 text-[var(--muted)] sm:text-base">
                {activeContent
                  ?.content
                  ?.length ? (
                  <PortableText
                    value={
                      activeContent.content
                    }
                    components={{
                      block: {
                        normal: ({
                          children,
                        }) => (
                          <p className="mb-4 last:mb-0">
                            {
                              children
                            }
                          </p>
                        ),

                        h2: ({
                          children,
                        }) => (
                          <h2 className="mb-3 mt-6 text-lg font-semibold text-[var(--ink)]">
                            {
                              children
                            }
                          </h2>
                        ),

                        h3: ({
                          children,
                        }) => (
                          <h3 className="mb-2 mt-5 font-semibold text-[var(--ink)]">
                            {
                              children
                            }
                          </h3>
                        ),

                        blockquote: ({
                          children,
                        }) => (
                          <blockquote className="my-4 border-l-4 border-[var(--accent)] pl-4 italic">
                            {
                              children
                            }
                          </blockquote>
                        ),
                      },

                      list: {
                        bullet: ({
                          children,
                        }) => (
                          <ul className="mb-4 list-disc space-y-1 pl-5">
                            {
                              children
                            }
                          </ul>
                        ),

                        number: ({
                          children,
                        }) => (
                          <ol className="mb-4 list-decimal space-y-1 pl-5">
                            {
                              children
                            }
                          </ol>
                        ),
                      },

                      marks: {
                        strong: ({
                          children,
                        }) => (
                          <strong className="font-semibold text-[var(--ink)]">
                            {
                              children
                            }
                          </strong>
                        ),

                        em: ({
                          children,
                        }) => (
                          <em>
                            {
                              children
                            }
                          </em>
                        ),
                      },
                    }}
                  />
                ) : (
                  <p>
                    Content
                    coming soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
}