import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WalletDiagnosticsPanel from "@/components/donation/wallet-diagnostics-panel";

beforeEach(() => { window.history.replaceState({}, "", "/akram-shake"); vi.resetModules(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("opt-in wallet timings", () => {
  it("records nothing during an ordinary donation visit", async () => {
    const diagnostics = await import("@/lib/stripe/wallet-diagnostics");
    diagnostics.beginWalletTiming("internal-selection-key", true);
    diagnostics.recordWalletTiming("amount_api_start");
    expect(diagnostics.walletDiagnosticSnapshot()).toEqual({ enabled: false, events: [] });
  });
  it("measures network and SDK phases without exposing the internal selection or making requests", async () => {
    window.history.replaceState({}, "", "/akram-shake?wallet_debug=1");
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const d = await import("@/lib/stripe/wallet-diagnostics");
    d.beginWalletTiming("private-campaign:12345:USD", true);
    const trace = d.currentWalletTiming();
    now = 1200; d.recordWalletTiming("amount_api_start", trace);
    now = 2150; d.recordWalletTiming("amount_api_end", trace);
    now = 2400; d.recordWalletTiming("amount_sync_end", trace);
    expect(d.walletDiagnosticSnapshot().events.map(event => [event.stage, event.elapsedMs])).toEqual([
      ["selection", 0], ["amount_api_start", 200], ["amount_api_end", 1150], ["amount_sync_end", 1400],
    ]);
    expect(JSON.stringify(d.walletDiagnosticSnapshot())).not.toMatch(/private-campaign|12345|USD/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps late completions associated with their original selection", async () => {
    window.history.replaceState({}, "", "/?wallet_debug=1");
    let now = 1000; vi.spyOn(performance, "now").mockImplementation(() => now);
    const d = await import("@/lib/stripe/wallet-diagnostics");
    d.beginWalletTiming("first", true); const trace = d.currentWalletTiming();
    now = 1200; d.beginWalletTiming("second", true);
    now = 1500; d.recordWalletTiming("amount_sync_end", trace);
    expect(d.walletDiagnosticSnapshot().events.at(-1)).toMatchObject({ selection: 1, elapsedMs: 500 });
    for (let i = 0; i < 100; ++i) d.recordWalletTiming("selection_ready");
    expect(d.walletDiagnosticSnapshot().events).toHaveLength(60);
  });
  it("copies only a readable local timing report after the user taps Copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<WalletDiagnosticsPanel events={[{ sequence: 1, selection: 2, elapsedMs: 1150, stage: "amount_api_end" }]} />);
    expect(writeText).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy timing report" })); });
    expect(writeText).toHaveBeenCalledExactlyOnceWith("Wallet timing report\nSelection 2 +1150ms: Amount API returned");
  });
  it("shows a selectable report if Safari denies clipboard access", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<WalletDiagnosticsPanel events={[]} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy timing report" })); });
    expect(screen.getByRole("textbox", { name: "Timing report" })).toHaveValue("Wallet timing report\n");
  });
});
