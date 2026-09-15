import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="min-h-screen bg-[var(--page)] px-5 py-6 sm:py-10"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-3"><Image src="/sample-logo.svg" alt="" width={42} height={42} /><strong>Open Hands Relief</strong></Link><Link href="/" className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold">Back to campaign</Link></header><article className="mt-12 rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_rgba(20,43,78,.08)] sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Organization information</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{title}</h1><div className="mt-8 rounded-2xl bg-[var(--amber-soft)] p-4 text-sm font-medium leading-6 text-[var(--amber)]">Sample content — replace and obtain client/legal approval before accepting live donations.</div><div className="mt-8 space-y-5 text-[17px] leading-8 text-[var(--muted)]">{children}</div></article></div></main>;
}
