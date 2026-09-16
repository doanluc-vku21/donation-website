import { PortableText } from "@portabletext/react";

import type { Campaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

type StoryContent = Pick<
  SanityCampaign,
  | "story"
  | "storyEyebrow"
  | "storyHeading"
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

  return (
    <section aria-labelledby="story-title">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
        {editableText(
          content.storyEyebrow,
          "Why this matters",
        )}
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
  );
}