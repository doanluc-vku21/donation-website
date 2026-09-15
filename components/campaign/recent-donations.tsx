import { Heart } from "lucide-react";
import { formatUsd } from "@/lib/money";
import type { RecentDonation } from "@/lib/sample-data";

export function RecentDonations({ donations }: { donations: RecentDonation[] }) {
  return (
    <section className="mt-12" aria-labelledby="recent-supporters-title">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Community</p><h2 id="recent-supporters-title" className="mt-2 text-2xl font-semibold tracking-tight">Recent supporters</h2></div>
        <span className="text-sm text-[var(--muted)]">Live data connects later</span>
      </div>
      <ul className="mt-5 space-y-3">
        {donations.map((donation) => (
          <li key={donation.id} className="flex items-center justify-between gap-5 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(24,44,72,.04)]">
            <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--soft-blue)] text-[var(--accent)]"><Heart aria-hidden="true" className="size-4 fill-current" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{donation.displayName}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{donation.frequency === "monthly" ? "Started a monthly gift" : "Made a one-time gift"} · {donation.relativeTime}</p></div></div>
            <strong className="shrink-0 text-sm">{formatUsd(donation.amountUsd).replace(".00", "")}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
