import { PortableText } from "@portabletext/react";

type Props = {
  value?: any[];
};

export function CampaignStoryContent({ value }: Props) {
  if (!value?.length) {
    return null;
  }

  return (
    <div className="space-y-5 text-[16px] leading-7 text-neutral-700">
      <PortableText
        value={value}
        components={{
          block: {
            normal: ({ children }) => (
              <p className="leading-7">{children}</p>
            ),

            h2: ({ children }) => (
              <h2 className="pt-4 text-2xl font-bold text-neutral-950">
                {children}
              </h2>
            ),

            h3: ({ children }) => (
              <h3 className="pt-3 text-xl font-bold text-neutral-950">
                {children}
              </h3>
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
              <strong className="font-bold text-neutral-950">
                {children}
              </strong>
            ),

            em: ({ children }) => (
              <em>{children}</em>
            ),
          },
        }}
      />
    </div>
  );
}