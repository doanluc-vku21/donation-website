import { act, fireEvent, render } from "@testing-library/react";
import { Suspense, use, useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignAutoRefresh } from "@/components/campaign/campaign-auto-refresh";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
const refreshProps = { campaignId: "909d80f9-2f2d-430f-a411-5f826e9a58c6", contributionCount: 0 };
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.refresh.mockReset();
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("campaign live updates", () => {
  it("refreshes visible campaign data every 15 seconds and releases timers/listeners on navigation", () => {
    const { unmount } = render(<CampaignAutoRefresh {...refreshProps} />);
    expect(mocks.refresh).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(14_999); });
    expect(mocks.refresh).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    unmount();
    act(() => { vi.advanceTimersByTime(30_000); });
    fireEvent.focus(window);
    fireEvent.online(window);
    fireEvent(document, new Event("visibilitychange"));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses hidden and offline visits, then reloads on visibility, focus and network recovery", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const online = vi.spyOn(navigator, "onLine", "get");
    render(<CampaignAutoRefresh {...refreshProps} />);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(mocks.refresh).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    online.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(mocks.refresh).not.toHaveBeenCalled();
    online.mockReturnValue(true);
    fireEvent.online(window);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    fireEvent.focus(window);
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
    fireEvent(document, new Event("visibilitychange"));
    expect(mocks.refresh).toHaveBeenCalledTimes(3);
  });

  it("does not overlap a slow server refresh and resumes after it finishes", async () => {
    let finish!: () => void;
    const response = new Promise<void>(resolve => { finish = resolve; });
    function ServerPayload({ pending }: { pending: Promise<void> | null }) {
      if (pending) use(pending);
      return <p>Campaign data</p>;
    }
    function RouterHarness() {
      const [pending, setPending] = useState<Promise<void> | null>(null);
      useEffect(() => { mocks.refresh.mockImplementation(() => setPending(response)); }, []);
      return <><CampaignAutoRefresh {...refreshProps} /><Suspense fallback={<p>Loading</p>}><ServerPayload pending={pending} /></Suspense></>;
    }
    render(<RouterHarness />);
    await act(async () => { vi.advanceTimersByTime(15_000); });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      fireEvent.focus(window);
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); await response; });
    await act(async () => { vi.advanceTimersByTime(15_000); });
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it("reacts to confirmed-count events without navigation and ignores current or malformed values", () => {
    const sources: Array<{ url: string; onmessage: ((event: MessageEvent<string>) => void) | null; close: ReturnType<typeof vi.fn> }> = [];
    vi.stubGlobal("EventSource", class {
      onmessage = null;
      close = vi.fn();
      constructor(public url: string) { sources.push(this); }
    });
    const { rerender, unmount } = render(<CampaignAutoRefresh {...refreshProps} />);
    expect(sources).toHaveLength(1);
    expect(sources[0].url).toBe(`/api/campaigns/${refreshProps.campaignId}/contribution-events`);
    const send = (data: string) => act(() => { sources[0].onmessage?.(new MessageEvent("message", { data })); });
    for (const data of ['{"count":0}', 'invalid', '{"count":-1}', '{"count":"1"}']) send(data);
    expect(mocks.refresh).not.toHaveBeenCalled();
    send('{"count":1}');
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    rerender(<CampaignAutoRefresh {...refreshProps} contributionCount={1} />);
    send('{"count":1}');
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    send('{"count":2}');
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
    unmount();
    expect(sources[0].close).toHaveBeenCalledExactlyOnceWith();
  });

  it("closes the live stream while hidden and opens one fresh connection on resume", () => {
    const closes: Array<ReturnType<typeof vi.fn>> = [];
    vi.stubGlobal("EventSource", class {
      onmessage = null;
      close = vi.fn();
      constructor() { closes.push(this.close); }
    });
    const visibility = vi.spyOn(document, "visibilityState", "get");
    render(<CampaignAutoRefresh {...refreshProps} />);
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(closes[0]).toHaveBeenCalledOnce();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    fireEvent.focus(window);
    expect(closes).toHaveLength(2);
  });
});
