"use client";

export type WalletTimingStage =
  | "selection" | "invalid_amount" | "session_start" | "session_received"
  | "sdk_loading" | "sdk_ready" | "wallet_ready" | "wallet_unavailable" | "selection_ready"
  | "amount_sync_start" | "amount_api_start" | "amount_api_end" | "amount_sync_end"
  | "amount_sync_failed" | "session_failed";
export type WalletTiming = { sequence: number; selection: number; elapsedMs: number; stage: WalletTimingStage };
type Snapshot = { enabled: boolean; events: readonly WalletTiming[] };
const disabled: Snapshot = { enabled: false, events: [] };
const enabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("wallet_debug") === "1";
let snapshot: Snapshot = enabled ? { enabled: true, events: [] } : disabled;
const listeners = new Set<() => void>();
const starts = new Map<number, number>();
let selection = 0;
let selectionKey = "";
let sequence = 0;

// Local timings only: never record amounts, donor details, Session IDs/secrets,
// query strings or API bodies, and never transmit this report to a server.
export function recordWalletTiming(stage: WalletTimingStage, trace = selection) {
  if (!enabled) return;
  const elapsedMs = Math.round(performance.now() - (starts.get(trace) ?? performance.now()));
  snapshot = { enabled: true, events: [...snapshot.events, { sequence: ++sequence, selection: trace, elapsedMs, stage }].slice(-60) };
  for (const notify of listeners) notify();
}
export function beginWalletTiming(key: string, valid: boolean) {
  if (!enabled || key === selectionKey) return;
  selectionKey = key;
  starts.set(++selection, performance.now());
  if (starts.size > 60) starts.delete(starts.keys().next().value!);
  recordWalletTiming(valid ? "selection" : "invalid_amount");
}
export function currentWalletTiming() { return selection; }
export function walletDiagnosticSnapshot() { return snapshot; }
export function walletDiagnosticServerSnapshot() { return disabled; }
export function subscribeWalletDiagnostics(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}
