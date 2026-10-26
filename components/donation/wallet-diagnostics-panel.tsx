"use client";

import { useState } from "react";
import type { WalletTiming, WalletTimingStage } from "@/lib/stripe/wallet-diagnostics";

const labels: Record<WalletTimingStage, string> = {
  selection: "Amount selected", invalid_amount: "Amount incomplete / below minimum",
  session_start: "Session preparation started", session_received: "Session available",
  sdk_loading: "Stripe SDK loading", sdk_ready: "Stripe SDK ready",
  wallet_ready: "Wallet button ready", wallet_unavailable: "No supported wallet / wallet failed",
  selection_ready: "Selected amount enabled for payment",
  amount_sync_start: "Stripe amount refresh started", amount_api_start: "Amount API started",
  amount_api_end: "Amount API returned", amount_sync_end: "Stripe amount refresh complete",
  amount_sync_failed: "Refresh failed; creating a fresh session", session_failed: "Session request failed",
};

export default function WalletDiagnosticsPanel({ events }: { events: readonly WalletTiming[] }) {
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const report = "Wallet timing report\n" + events.map(event =>
    `Selection ${event.selection} +${event.elapsedMs}ms: ${labels[event.stage]}`).join("\n");
  async function copy() {
    try { await navigator.clipboard.writeText(report); setCopied(true); }
    catch { setShowReport(true); }
  }
  return (
    <aside aria-label="Wallet timing diagnostics" className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3 text-left text-xs text-slate-800" dir="ltr">
      <p className="font-semibold">Wallet timing — diagnostic mode</p>
      <p className="mt-1">Open the donation form, enter a custom amount, then copy this report. No payment is required.</p>
      <ol className="my-2 max-h-40 space-y-1 overflow-y-auto font-mono" aria-live="polite">
        {events.slice(-12).map(event => <li key={event.sequence}>#{event.selection} +{event.elapsedMs}ms: {labels[event.stage]}</li>)}
      </ol>
      <button type="button" onClick={() => { void copy(); }} className="rounded border border-slate-400 bg-white px-3 py-2">{copied ? "Copied" : "Copy timing report"}</button>
      {showReport && <textarea readOnly aria-label="Timing report" value={report} className="mt-2 h-40 w-full border p-2" />}
    </aside>
  );
}
