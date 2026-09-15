import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Campaign } from "@/lib/sample-data";
import { ProgressCard } from "./progress-card";
import { CampaignStory } from "./campaign-story";
import { RecentDonations } from "./recent-donations";
import { SiteFooter } from "./site-footer";
import { DonationPanel } from "@/components/donation/donation-panel";
import { MobileDonateBar } from "@/components/donation/mobile-donate-bar";
import { ShareMenu } from "@/components/share/share-menu";

export function CampaignPage({ campaign }: { campaign: Campaign }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(226,235,251,.9),transparent_28%),var(--page)]">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-6 lg:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)] lg:items-start lg:gap-x-16 lg:gap-y-12 lg:px-10 lg:py-8 xl:px-16">
        <div className="min-w-0">
          <header className="flex items-center justify-between gap-5">
            <a href="#top" className="inline-flex items-center gap-3 rounded-lg"><Image src="/sample-logo.svg" alt="" width={46} height={46} className="size-11" /><span><strong className="block text-[17px] tracking-tight">{campaign.organizationName}</strong><small className="text-xs text-[var(--muted)]">Care, made tangible</small></span></a>
            <ShareMenu />
          </header>
          <section id="top" className="pt-12 sm:pt-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--accent)] shadow-sm"><Sparkles aria-hidden="true" className="size-3.5" />{campaign.eyebrow}</p>
            <h1 className="mt-6 max-w-3xl text-[clamp(2.6rem,6vw,5.4rem)] font-semibold leading-[.98] tracking-[-.055em]">{campaign.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">{campaign.summary}</p>
            <div className="mt-8"><ProgressCard raisedAmountUsd={campaign.raisedAmountUsd} goalAmountUsd={campaign.goalAmountUsd} donorCount={campaign.donorCount} /></div>
            <figure className="relative mt-8 overflow-hidden rounded-[30px] bg-[#173d76] shadow-[0_26px_80px_rgba(22,54,92,.15)]"><Image src="/sample-campaign-hero.svg" alt="Children learning together in a bright community classroom" width={1200} height={760} priority className="h-auto w-full" /><figcaption className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur">A little support can open a lifetime of possibility.</figcaption></figure>
          </section>
        </div>
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Donation form"><div className="lg:sticky lg:top-8"><DonationPanel campaign={campaign} /></div></aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2"><CampaignStory campaign={campaign} /><RecentDonations donations={campaign.recentDonations} /><SiteFooter /></div>
      </div>
      <MobileDonateBar />
    </main>
  );
}
