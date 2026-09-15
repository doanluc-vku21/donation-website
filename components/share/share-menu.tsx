"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const title = "Give a Child a Brighter Tomorrow";

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
      className={className}
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
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function ShareMenu() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window === "undefined"
      ? "https://example.org"
      : window.location.href;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} — ${url}`);

  async function copyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Unable to copy link:", error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        <Share2
          aria-hidden="true"
          className="size-4"
        />

        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0b1c33]/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  Spread the word
                </p>

                <h2
                  id="share-title"
                  className="mt-2 text-2xl font-semibold tracking-tight"
                >
                  Share this campaign
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close share dialog"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <X
                  aria-hidden="true"
                  className="size-5"
                />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <ShareLink
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                label="Facebook"
                icon={<FacebookIcon className="size-4" />}
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
                icon={<XTwitterIcon className="size-4" />}
              />

              <ShareLink
                href={`mailto:?subject=${encodeURIComponent(
                  title
                )}&body=${encodedText}`}
                label="Email"
                icon={
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              />
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
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

              {copied ? "Link copied" : "Copy link"}
            </button>

            <div className="mt-6 flex items-center gap-5 rounded-2xl bg-[var(--surface)] p-4">
              <div className="rounded-xl bg-white p-2">
                <QRCodeSVG
                  value={url}
                  size={92}
                  bgColor="#ffffff"
                  fgColor="#10233f"
                />
              </div>

              <div>
                <p className="font-semibold">
                  Scan to open this campaign
                </p>

                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                  Use your phone camera to share the campaign in person.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function ShareLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--soft-blue)] px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[#dce8ff]"
    >
      {icon}
      {label}
    </a>
  );
}