"use client";

import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type MobileStoryToggleProps = {
  children: ReactNode;
};

const COLLAPSED_HEIGHT = 300;

export function MobileStoryToggle({
  children,
}: MobileStoryToggleProps) {
  const contentRef =
    useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] =
    useState(false);

  const [contentHeight, setContentHeight] =
    useState(COLLAPSED_HEIGHT);

  const [canCollapse, setCanCollapse] =
    useState(false);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    function measure() {
      if (!content) {
        return;
      }

      const height =
        content.scrollHeight;

      setContentHeight(height);

      setCanCollapse(
        height >
          COLLAPSED_HEIGHT + 20,
      );
    }

    measure();

    const observer =
      new ResizeObserver(measure);

    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, []);

  function toggleStory() {
    setExpanded(
      (current) => !current,
    );
  }

  return (
    <div className="w-full min-w-0">
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{
          maxHeight:
            expanded ||
            !canCollapse
              ? `${contentHeight}px`
              : `${COLLAPSED_HEIGHT}px`,
        }}
      >
        <div
          ref={contentRef}
          className="
            min-w-0
            [&>*:first-child]:mt-0
          "
        >
          {children}
        </div>

        {!expanded &&
          canCollapse && (
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                h-20
                bg-gradient-to-t
                from-[var(--page)]
                via-[var(--page)]/90
                to-transparent
              "
            />
          )}
      </div>

      {canCollapse && (
        <button
          type="button"
          onClick={toggleStory}
          aria-expanded={expanded}
          className="
            mt-3
            flex
            min-h-11
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-[var(--border)]
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-[var(--ink)]
            shadow-sm
            transition

            active:scale-[.99]
          "
        >
          {expanded ? (
            <>
              Show less

              <ChevronUp
                aria-hidden="true"
                className="size-4"
              />
            </>
          ) : (
            <>
              Show more

              <ChevronDown
                aria-hidden="true"
                className="size-4"
              />
            </>
          )}
        </button>
      )}
    </div>
  );
}