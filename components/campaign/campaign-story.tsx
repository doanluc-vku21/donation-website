import {
  BookOpen,
  Salad,
  ShieldCheck,
} from "lucide-react";

import { PortableText } from "@portabletext/react";

import type { Campaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const defaultImpactCards = [
  {
    icon: Salad,
    title: "Nourishment",
    copy: "Consistent access to balanced meals and clean water.",
  },
  {
    icon: BookOpen,
    title: "Learning",
    copy: "School materials and supportive places to learn.",
  },
  {
    icon: ShieldCheck,
    title: "Steady care",
    copy: "Practical help shaped around each local community.",
  },
] as const;

type StoryContent = Pick<
  SanityCampaign,
  | "story"
  | "storyEyebrow"
  | "storyHeading"
  | "nourishmentCard"
  | "learningCard"
  | "steadyCareCard"
>;

function editableText(
  value: string | undefined,
  fallback: string,
) {
  return value?.trim() ? value : fallback;
}

type CampaignStoryProps = {
  campaign: Campaign;
  content: StoryContent;
};

export function CampaignStory({
  campaign,
  content,
}: CampaignStoryProps) {
  const { story } = content;
  const hasSanityStory =
    Array.isArray(story) &&
    story.length > 0;

  const impacts = [
    {
      icon: defaultImpactCards[0].icon,
      title: editableText(
        content.nourishmentCard?.title,
        defaultImpactCards[0].title,
      ),
      copy: editableText(
        content.nourishmentCard?.description,
        defaultImpactCards[0].copy,
      ),
    },
    {
      icon: defaultImpactCards[1].icon,
      title: editableText(
        content.learningCard?.title,
        defaultImpactCards[1].title,
      ),
      copy: editableText(
        content.learningCard?.description,
        defaultImpactCards[1].copy,
      ),
    },
    {
      icon: defaultImpactCards[2].icon,
      title: editableText(
        content.steadyCareCard?.title,
        defaultImpactCards[2].title,
      ),
      copy: editableText(
        content.steadyCareCard?.description,
        defaultImpactCards[2].copy,
      ),
    },
  ];

  return (
    <>
      <section aria-labelledby="story-title">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
          {editableText(content.storyEyebrow, "Why this matters")}
        </p>

        <h2
          id="story-title"
          className="
            mt-3
            max-w-xl
            text-3xl
            font-semibold
            leading-tight
            tracking-[-.035em]
            sm:text-4xl
          "
        >
          {editableText(
            content.storyHeading,
            "Care today becomes confidence tomorrow.",
          )}
        </h2>

        <div className="mt-6 space-y-5 text-[17px] leading-8 text-[var(--muted)]">
          {hasSanityStory ? (
            <PortableText
              value={story}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p>{children}</p>
                  ),

                  h2: ({ children }) => (
                    <h2 className="pt-3 text-2xl font-semibold leading-tight tracking-[-.025em] text-[var(--foreground)]">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="pt-2 text-xl font-semibold leading-tight text-[var(--foreground)]">
                      {children}
                    </h3>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[var(--accent)] pl-5 italic">
                      {children}
                    </blockquote>
                  ),
                },

                list: {
                  bullet: ({ children }) => (
                    <ul className="list-disc space-y-2 pl-6">
                      {children}
                    </ul>
                  ),

                  number: ({ children }) => (
                    <ol className="list-decimal space-y-2 pl-6">
                      {children}
                    </ol>
                  ),
                },

                marks: {
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[var(--foreground)]">
                      {children}
                    </strong>
                  ),

                  em: ({ children }) => (
                    <em>{children}</em>
                  ),
                },
              }}
            />
          ) : (
            campaign.story.map(
              (paragraph) => (
                <p key={paragraph}>
                  {paragraph}
                </p>
              ),
            )
          )}
        </div>
      </section>

      <section
        className="mt-10 grid gap-3 sm:grid-cols-3"
        aria-label="Ways your gift helps"
      >
        {impacts.map(
          ({
            icon: Icon,
            title,
            copy,
          }) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--border)] bg-white p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--mint)] text-[var(--success)]">
                <Icon
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <h3 className="mt-4 font-semibold">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {copy}
              </p>
            </article>
          ),
        )}
      </section>
    </>
  );
}