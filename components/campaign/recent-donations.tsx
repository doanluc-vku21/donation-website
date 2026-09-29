"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  X,
} from "lucide-react";

import {
  formatUsd,
} from "@/lib/money";

import type {
  RecentDonation,
} from "@/lib/sample-data";

type RecentDonationsProps = {
  donations: RecentDonation[];
  className?: string;

  /**
   * Số contribution hiển thị ngoài trang.
   * Reference đang hiển thị 4.
   */
  previewLimit?: number;
};

type SortMode =
  | "recent"
  | "highest";

export function RecentDonations({
  donations,
  className = "mt-12",
  previewLimit = 4,
}: RecentDonationsProps) {
  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      "recent",
    );

  // =============================================
  // PREVIEW
  // =============================================

  const previewDonations =
    donations.slice(
      0,
      previewLimit,
    );

  // =============================================
  // SORTED MODAL LIST
  // =============================================

  const sortedDonations =
    useMemo(() => {
      const result = [
        ...donations,
      ];

      if (
        sortMode ===
        "highest"
      ) {
        result.sort(
          (a, b) =>
            b.amountUsd -
            a.amountUsd,
        );
      }

      /*
       * Với "recent" không cần sort lại vì
       * RPC hiện đã trả donation mới nhất trước.
       */
      return result;
    }, [
      donations,
      sortMode,
    ]);

  // =============================================
  // LOCK BODY WHEN MODAL OPEN
  // =============================================

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const originalOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setModalOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style
        .overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    modalOpen,
  ]);

  if (
    donations.length === 0
  ) {
    return null;
  }

  return (
    <>
      {/* =========================================
          CONTRIBUTIONS SECTION
      ========================================== */}

      <section
        className={`${className} w-full`}
        aria-labelledby="contributions-title"
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            border-t
            border-[#e3e8ee]
            pt-8
          "
        >
          <h2
            id="contributions-title"
            className="
              text-[26px]
              font-bold
              tracking-[-0.03em]
              text-[#07152d]
            "
          >
            Contributions
          </h2>

          <span
            className="
              shrink-0
              text-[14px]
              text-[#718096]
            "
          >
            {donations.length.toLocaleString(
              "en-US",
            )}{" "}
            {donations.length ===
            1
              ? "contribution"
              : "contributions"}
          </span>
        </div>

        {/* LIST */}

        <ul
          className="
            mt-5
            divide-y
            divide-[#e7ebef]
          "
        >
          {previewDonations.map(
            (donation) => (
              <ContributionRow
                key={
                  donation.id
                }
                donation={
                  donation
                }
              />
            ),
          )}
        </ul>

        {/* SEE ALL */}

        {donations.length >
          previewLimit && (
          <button
            type="button"
            onClick={() => {
              setSortMode(
                "recent",
              );

              setModalOpen(
                true,
              );
            }}
            className="
              mt-5
              flex
              min-h-[46px]
              w-full
              items-center
              justify-center
              rounded-full
              border
              border-[#d9e0e7]
              bg-white
              px-5
              text-[14px]
              font-medium
              text-[#101828]
              shadow-[0_2px_4px_rgba(15,23,42,.08)]
              transition

              hover:border-[#aeb8c5]
            "
          >
            See all
          </button>
        )}
      </section>

      {/* =========================================
          MODAL
      ========================================== */}

      {modalOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/60
            p-4
          "
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalOpen(
                false,
              );
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contributions-modal-title"
            className="
              flex
              max-h-[82vh]
              w-full
              max-w-[520px]
              flex-col
              overflow-hidden
              rounded-[20px]
              bg-white
              shadow-[0_24px_80px_rgba(0,0,0,.28)]
            "
          >
            {/* ================================
                MODAL HEADER
            ================================= */}

            <div
              className="
                shrink-0
                px-6
                pb-4
                pt-6
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <h2
                    id="contributions-modal-title"
                    className="
                      text-[20px]
                      font-bold
                      text-[#111827]
                    "
                  >
                    Contributions
                  </h2>

                  <p
                    className="
                      mt-3
                      text-[14px]
                      text-[#66758a]
                    "
                  >
                    Contributions
                    available for this
                    campaign.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close contributions"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="
                    -mr-2
                    -mt-2
                    grid
                    size-10
                    shrink-0
                    place-items-center
                    rounded-full
                    text-[#637083]
                    transition

                    hover:bg-[#f3f5f7]
                    hover:text-[#111827]
                  "
                >
                  <X
                    aria-hidden="true"
                    className="size-5"
                  />
                </button>
              </div>

              {/* SORT */}

              <label
                className="
                  mt-5
                  block
                "
              >
                <span
                  className="
                    block
                    text-[14px]
                    font-medium
                    text-[#111827]
                  "
                >
                  Sort by
                </span>

                <div
                  className="
                    relative
                    mt-2
                  "
                >
                  <select
                    value={
                      sortMode
                    }
                    onChange={(
                      event,
                    ) =>
                      setSortMode(
                        event.target
                          .value as SortMode,
                      )
                    }
                    className="
                      min-h-[50px]
                      w-full
                      appearance-none
                      rounded-[12px]
                      border
                      border-[#0e6c48]
                      bg-white
                      px-4
                      pr-11
                      text-[14px]
                      text-[#111827]
                      outline-none

                      focus:ring-2
                      focus:ring-[#ccebdd]
                    "
                  >
                    <option value="recent">
                      Most recent
                    </option>

                    <option value="highest">
                      Highest amount
                    </option>
                  </select>

                  <ChevronDown
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      right-4
                      top-1/2
                      size-4
                      -translate-y-1/2
                      text-[#111827]
                    "
                  />
                </div>
              </label>
            </div>

            {/* ================================
                SCROLLABLE LIST
            ================================= */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                px-6
                pb-6

                [scrollbar-width:thin]
              "
            >
              <ul
                className="
                  divide-y
                  divide-[#e7ebef]
                "
              >
                {sortedDonations.map(
                  (
                    donation,
                  ) => (
                    <ContributionRow
                      key={
                        donation.id
                      }
                      donation={
                        donation
                      }
                    />
                  ),
                )}
              </ul>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

// =================================================
// CONTRIBUTION ROW
// =================================================

function ContributionRow({
  donation,
}: {
  donation: RecentDonation;
}) {
  const initials =
    getInitials(
      donation.displayName,
    );

  return (
    <li
      className="
        flex
        min-h-[72px]
        items-center
        gap-3
        py-4
      "
    >
      {/* AVATAR */}

      <span
        className="
          grid
          size-10
          shrink-0
          place-items-center
          rounded-full
          bg-[#e7f6d7]
          text-[12px]
          font-medium
          text-[#09633f]
        "
      >
        {initials}
      </span>

      {/* NAME + TIME */}

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            truncate
            text-[14px]
            font-semibold
            text-[#07152d]
          "
        >
          {donation.displayName}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-[12px]
            text-[#6480a0]
          "
        >
          {donation.relativeTime}
        </p>
      </div>

      {/* AMOUNT */}

      <strong
        className="
          shrink-0
          rounded-full
          bg-[#edf6e7]
          px-3
          py-1.5
          text-[14px]
          font-semibold
          text-[#006341]
        "
      >
        {formatUsd(
          donation.amountUsd,
        ).replace(
          ".00",
          "",
        )}
      </strong>
    </li>
  );
}

// =================================================
// INITIALS
// =================================================

function getInitials(
  displayName: string,
) {
  if (
    !displayName ||
    displayName
      .toLowerCase() ===
      "anonymous"
  ) {
    return "A";
  }

  const words =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[
      words.length - 1
    ][0]
  ).toUpperCase();
}