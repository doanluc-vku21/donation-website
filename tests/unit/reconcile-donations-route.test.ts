// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reconcilePaidSessions: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/reconciliation", () => ({
  reconcilePaidSessions: mocks.reconcilePaidSessions,
}));

import { GET } from "@/app/api/cron/reconcile-donations/route";

const authorizedRequest = () =>
  new Request("https://example.com/api/cron/reconcile-donations", {
    headers: { authorization: "Bearer cron-secret-test" },
  });

describe("reconcile-donations cron route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "cron-secret-test" };
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.reconcilePaidSessions.mockResolvedValue({
      scanned: 12,
      paid: 9,
      alreadyRecorded: 8,
      backfilled: 1,
      unattributed: [],
      skipped: [],
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("refuses a request without the cron secret configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(authorizedRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Cron secret is not configured.");
    expect(mocks.reconcilePaidSessions).not.toHaveBeenCalled();
  });

  it("rejects a request carrying the wrong bearer token", async () => {
    const response = await GET(
      new Request("https://example.com/api/cron/reconcile-donations", {
        headers: { authorization: "Bearer something-else" },
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.reconcilePaidSessions).not.toHaveBeenCalled();
  });

  it("backs up paid sessions over the last 48 hours", async () => {
    const response = await GET(authorizedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      windowHours: 48,
      scanned: 12,
      paid: 9,
      alreadyRecorded: 8,
      backfilled: 1,
      unattributed: 0,
      skipped: 0,
    });

    const call = mocks.reconcilePaidSessions.mock.calls[0][0] as { sinceSeconds: number; apply: boolean };
    expect(call.apply).toBe(true);
    expect(Date.now() / 1000 - call.sinceSeconds).toBeGreaterThan(47 * 60 * 60);
    expect(Date.now() / 1000 - call.sinceSeconds).toBeLessThan(49 * 60 * 60);
  });

  it("reports unattributed payments so an operator can attribute them", async () => {
    mocks.reconcilePaidSessions.mockResolvedValue({
      scanned: 1,
      paid: 1,
      alreadyRecorded: 0,
      backfilled: 0,
      unattributed: [
        {
          sessionId: "cs_live_orphan",
          chargedAmountMinor: 12900,
          currency: "SGD",
          donorEmail: "donor@example.com",
          createdAt: "2026-11-16T00:53:00.000Z",
        },
      ],
      skipped: [],
    });

    const response = await GET(authorizedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.unattributed).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(
      "Paid Checkout Session without campaign metadata:",
      "cs_live_orphan",
      12900,
      "SGD",
      "2026-11-16T00:53:00.000Z",
    );
  });

  it("returns an error response when the reconciliation throws", async () => {
    mocks.reconcilePaidSessions.mockRejectedValue(new Error("Stripe is down"));

    const response = await GET(authorizedRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Reconciliation failed.");
  });
});
