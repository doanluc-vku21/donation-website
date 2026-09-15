"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { formatUsd } from "@/lib/money";
import type { RecentDonation } from "@/lib/sample-data";

type RecentDonationsProps = {
  donations: RecentDonation[];
  className?: string;
  limit?: number;
};

export function RecentDonations({
  donations,
  className = "mt-12",
  limit,
}: RecentDonationsProps) {
  const sliderRef =
    useRef<HTMLUListElement>(null);

  const [canScrollLeft, setCanScrollLeft] =
    useState(false);

  const [canScrollRight, setCanScrollRight] =
    useState(false);

  const visibleDonations =
    typeof limit === "number"
      ? donations.slice(0, limit)
      : donations;

  function updateScrollState() {
    const slider =
      sliderRef.current;

    if (!slider) {
      return;
    }

    const maxScroll =
      slider.scrollWidth -
      slider.clientWidth;

    setCanScrollLeft(
      slider.scrollLeft > 4,
    );

    setCanScrollRight(
      maxScroll > 4 &&
        slider.scrollLeft <
          maxScroll - 4,
    );
  }

  useEffect(() => {
    updateScrollState();

    const handleResize = () => {
      updateScrollState();
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [visibleDonations.length]);

  if (visibleDonations.length === 0) {
    return null;
  }

  function scrollSlider(
    direction: "left" | "right",
  ) {
    const slider =
      sliderRef.current;

    if (!slider) {
      return;
    }

    const firstCard =
      slider.querySelector<HTMLElement>(
        "[data-donation-card]",
      );

    const cardWidth =
      firstCard?.getBoundingClientRect()
        .width ??
      slider.clientWidth * 0.86;

    slider.scrollBy({
      left:
        direction === "right"
          ? cardWidth + 12
          : -(cardWidth + 12),

      behavior: "smooth",
    });
  }

  return (
    <section
      className={`${className} w-full min-w-0 max-w-full overflow-hidden`}
      aria-labelledby="recent-supporters-title"
    >
      {/* HEADER */}
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            Community
          </p>

          <h2
            id="recent-supporters-title"
            className="mt-2 truncate text-[22px] font-semibold tracking-tight text-[var(--ink)] sm:text-2xl"
          >
            Recent supporters
          </h2>
        </div>

        {visibleDonations.length >
          1 && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous supporters"
              disabled={!canScrollLeft}
              onClick={() =>
                scrollSlider(
                  "left",
                )
              }
              className="grid size-10 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft
                aria-hidden="true"
                className="size-4"
              />
            </button>

            <button
              type="button"
              aria-label="Next supporters"
              disabled={!canScrollRight}
              onClick={() =>
                scrollSlider(
                  "right",
                )
              }
              className="grid size-10 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight
                aria-hidden="true"
                className="size-4"
              />
            </button>
          </div>
        )}
      </div>

      {/* LOCAL SLIDER VIEWPORT */}
      <div className="mt-5 w-full min-w-0 max-w-full overflow-hidden">
        <ul
          ref={sliderRef}
          onScroll={
            updateScrollState
          }
          className="
            flex
            w-full
            min-w-0
            max-w-full
            snap-x
            snap-mandatory
            gap-3
            overflow-x-auto
            overflow-y-hidden
            overscroll-x-contain
            scroll-smooth
            pb-2
            touch-pan-x

            [-webkit-overflow-scrolling:touch]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {visibleDonations.map(
            (donation) => (
              <li
                key={donation.id}
                data-donation-card
                className="
                  flex
                  min-h-[108px]
                  w-[86%]
                  min-w-0
                  shrink-0
                  snap-start
                  items-center
                  justify-between
                  gap-3
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-white
                  px-4
                  py-4
                  shadow-[0_8px_30px_rgba(24,44,72,.04)]

                  sm:w-[300px]
                  sm:gap-4
                  sm:px-5

                  lg:w-[calc(50%-6px)]
                "
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--soft-blue)] text-[var(--accent)]">
                    <Heart
                      aria-hidden="true"
                      className="size-4 fill-current"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {
                        donation.displayName
                      }
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-[var(--muted)]">
                      {donation.frequency ===
                      "monthly"
                        ? "Started a monthly gift"
                        : "Made a one-time gift"}

                      {" · "}

                      {
                        donation.relativeTime
                      }
                    </p>
                  </div>
                </div>

                <strong className="shrink-0 text-sm text-[var(--ink)]">
                  {formatUsd(
                    donation.amountUsd,
                  ).replace(
                    ".00",
                    "",
                  )}
                </strong>
              </li>
            ),
          )}
        </ul>
      </div>

      
    </section>
  );
}