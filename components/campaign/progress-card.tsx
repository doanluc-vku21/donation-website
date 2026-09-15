import { HeartHandshake } from "lucide-react";
import { formatUsd, progressPercent } from "@/lib/money";

type ProgressCardProps = {
  raisedAmountUsd: number;
  goalAmountUsd: number;
  donorCount: number;
};

export function ProgressCard({ raisedAmountUsd, goalAmountUsd, donorCount }: ProgressCardProps) {
  const progress = progressPercent(raisedAmountUsd, goalAmountUsd);

  return (
    <section aria-label="Campaign progress" className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <strong className="block text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {formatUsd(raisedAmountUsd)}
          </strong>
          <span className="text-sm text-[var(--muted)]">of {formatUsd(goalAmountUsd).replace(".00", "")} goal</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
          <HeartHandshake aria-hidden="true" className="size-4 text-[var(--accent)]" />
          {donorCount.toLocaleString("en-US")} supporters
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${progress}% funded`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-[var(--soft-blue)]"
      >
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </section>
  );
}
