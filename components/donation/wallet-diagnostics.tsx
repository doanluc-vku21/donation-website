"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { subscribeWalletDiagnostics, walletDiagnosticSnapshot, walletDiagnosticServerSnapshot } from "@/lib/stripe/wallet-diagnostics";

const Panel = dynamic(() => import("./wallet-diagnostics-panel"), { ssr: false });

export function WalletDiagnostics() {
  const snapshot = useSyncExternalStore(subscribeWalletDiagnostics, walletDiagnosticSnapshot, walletDiagnosticServerSnapshot);
  return snapshot.enabled ? <Panel events={snapshot.events} /> : null;
}
