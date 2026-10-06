"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

type ShareMenuProps = {
  title?: string;

  locale?: Locale;

  triggerVariant?:
    | "default"
    | "inline"
    | "solid";

  triggerLabel?: string;

  triggerClassName?: string;
};

function FacebookIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={
        className
      }
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function XTwitterIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={
        className
      }
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function ShareMenu({
  title,
  locale = "en",
  triggerVariant = "default",
  triggerLabel,
  triggerClassName = "",
}: ShareMenuProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  const campaignTitle =
    title ||
    t.shareThisCampaign;

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);

  const url =
    typeof window ===
    "undefined"
      ? ""
      : window.location.href;

  const encodedUrl =
    encodeURIComponent(
      url,
    );

  const encodedText =
    encodeURIComponent(
      `${campaignTitle} — ${url}`,
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
      "hidden";

    function handleEscape(
      event:
        KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style
        .overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    open,
  ]);

  async function copyLink() {
    try {
      if (
        navigator.clipboard
      ) {
        await navigator
          .clipboard
          .writeText(
            url,
          );
      } else {
        const textarea =
          document.createElement(
            "textarea",
          );

        textarea.value =
          url;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea,
        );

        textarea.select();

        document.execCommand(
          "copy",
        );

        document.body.removeChild(
          textarea,
        );
      }

      setCopied(
        true,
      );

      window.setTimeout(
        () => {
          setCopied(
            false,
          );
        },
        1800,
      );
    } catch (
      error
    ) {
      console.error(
        "Unable to copy link:",
        error,
      );
    }
  }

  const triggerBase =
    `
      inline-flex
      items-center
      justify-center
      gap-2
      transition
      focus-visible:outline
      focus-visible:outline-2
      focus-visible:outline-offset-2
      focus-visible:outline-[var(--focus)]
    `;

  const triggerVariantClass =
    triggerVariant ===
    "inline"
      ? `
          min-h-[38px]
          px-4
          text-[13px]
          font-medium
          text-[#44536a]
        `
      : triggerVariant ===
          "solid"
        ? `
            min-h-[50px]
            w-full
            rounded-full
            bg-[#214f38]
            px-4
            text-[16px]
            font-bold
            text-[#c7f985]
          `
        : `
            min-h-11
            rounded-full
            border
            border-[var(--border)]
            bg-white
            px-4
            text-sm
            font-semibold
            shadow-sm

            hover:border-[var(--accent)]
            hover:text-[var(--accent)]
          `;

  return (
    <>
      {/* =====================================
          TRIGGER
      ====================================== */}

      <button
        dir="ltr"
        type="button"
        onClick={() =>
          setOpen(
            true,
          )
        }
        className={`
          ${triggerBase}
          ${triggerVariantClass}
          ${triggerClassName}
        `}
      >
        <Share2
          aria-hidden="true"
          className={
            triggerVariant ===
            "solid"
              ? "size-[17px]"
              : "size-4"
          }
        />

        <span
          dir={
            textDirection
          }
        >
          {triggerLabel ??
            t.share}
        </span>
      </button>

      {/* =====================================
          MODAL
      ====================================== */}

      {open && (
        <div
          dir="ltr"
          className="
            fixed
            inset-0
            z-[200]
            grid
            place-items-center
            bg-[#0b1c33]/45
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpen(
                false,
              );
            }
          }}
        >
          <section
            dir="ltr"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="
              w-full
              max-w-md
              rounded-[28px]
              bg-white
              p-5
              shadow-2xl

              sm:p-6
            "
          >
            {/* =================================
                HEADER
            ================================== */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-5
              "
            >
              <div
                dir={
                  textDirection
                }
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-[var(--accent)]
                  "
                >
                  {
                    t.spreadTheWord
                  }
                </p>

                <h2
                  id="share-title"
                  className="
                    mt-2
                    text-2xl
                    font-semibold
                    tracking-tight
                    text-[var(--ink)]
                  "
                >
                  {
                    t.shareThisCampaign
                  }
                </h2>
              </div>

              <button
                type="button"
                aria-label={
                  t.closeShareDialog
                }
                onClick={() =>
                  setOpen(
                    false,
                  )
                }
                className="
                  grid
                  size-11
                  shrink-0
                  place-items-center
                  rounded-full
                  bg-[var(--surface)]
                  text-[var(--muted)]
                  transition

                  hover:text-[var(--ink)]
                "
              >
                <X
                  aria-hidden="true"
                  className="size-5"
                />
              </button>
            </div>

            {/* =================================
                SHARE LINKS
            ================================== */}

            <div
              dir="ltr"
              className="
                mt-6
                grid
                grid-cols-2
                gap-3
              "
            >
              <ShareLink
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                label="Facebook"
                icon={
                  <FacebookIcon className="size-4" />
                }
              />

              <ShareLink
                href={`https://wa.me/?text=${encodedText}`}
                label="WhatsApp"
                icon={
                  <MessageCircle
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              />

              <ShareLink
                href={`https://twitter.com/intent/tweet?text=${encodedText}`}
                label="X / Twitter"
                icon={
                  <XTwitterIcon className="size-4" />
                }
              />

              <ShareLink
                href={`mailto:?subject=${encodeURIComponent(
                  campaignTitle,
                )}&body=${encodedText}`}
                label={
                  t.email
                }
                labelDirection={
                  textDirection
                }
                icon={
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              />
            </div>

            {/* =================================
                COPY
            ================================== */}

            <button
              dir="ltr"
              type="button"
              onClick={
                copyLink
              }
              className="
                mt-3
                flex
                min-h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-[var(--border)]
                font-semibold
                transition

                hover:border-[var(--accent)]
                hover:text-[var(--accent)]
              "
            >
              {copied ? (
                <Check
                  aria-hidden="true"
                  className="size-4"
                />
              ) : (
                <Copy
                  aria-hidden="true"
                  className="size-4"
                />
              )}

              <span
                dir={
                  textDirection
                }
              >
                {copied
                  ? t.linkCopied
                  : t.copyLink}
              </span>
            </button>

            {/* =================================
                QR
            ================================== */}

            <div
              dir="ltr"
              className="
                mt-6
                flex
                items-center
                gap-4
                rounded-2xl
                bg-[var(--surface)]
                p-4
              "
            >
              <div
                className="
                  shrink-0
                  rounded-xl
                  bg-white
                  p-2
                "
              >
                <QRCodeSVG
                  value={url}
                  size={88}
                  bgColor="#ffffff"
                  fgColor="#10233f"
                />
              </div>

              <div
                dir={
                  textDirection
                }
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    font-semibold
                    text-[var(--ink)]
                  "
                >
                  {
                    t.scanToOpen
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-5
                    text-[var(--muted)]
                  "
                >
                  {
                    t.scanDescription
                  }
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

// =================================================
// SHARE LINK
// =================================================

function ShareLink({
  href,
  label,
  icon,
  labelDirection = "ltr",
}: {
  href: string;

  label: string;

  icon: ReactNode;

  labelDirection?:
    "ltr" | "rtl";
}) {
  return (
    <a
      dir="ltr"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        flex
        min-h-12
        items-center
        justify-center
        gap-2
        rounded-2xl
        bg-[var(--soft-blue)]
        px-3
        text-sm
        font-semibold
        text-[var(--accent)]
        transition

        hover:bg-[#dce8ff]
      "
    >
      {icon}

      <span
        dir={
          labelDirection
        }
      >
        {label}
      </span>
    </a>
  );
}