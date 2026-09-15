import { BookOpen, Salad, ShieldCheck } from "lucide-react";
import type { Campaign } from "@/lib/sample-data";

const impacts = [
  { icon:Salad, title:"Nourishment", copy:"Consistent access to balanced meals and clean water." },
  { icon:BookOpen, title:"Learning", copy:"School materials and supportive places to learn." },
  { icon:ShieldCheck, title:"Steady care", copy:"Practical help shaped around each local community." },
];

export function CampaignStory({ campaign }: { campaign: Campaign }) {
  return <>
    <section aria-labelledby="story-title"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Why this matters</p><h2 id="story-title" className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">Care today becomes confidence tomorrow.</h2><div className="mt-6 space-y-5 text-[17px] leading-8 text-[var(--muted)]">{campaign.story.map((p)=><p key={p}>{p}</p>)}</div></section>
    <section className="mt-10 grid gap-3 sm:grid-cols-3" aria-label="Ways your gift helps">{impacts.map(({icon:Icon,title,copy})=><article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-5"><span className="grid size-10 place-items-center rounded-xl bg-[var(--mint)] text-[var(--success)]"><Icon aria-hidden="true" className="size-5" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p></article>)}</section>
  </>;
}
