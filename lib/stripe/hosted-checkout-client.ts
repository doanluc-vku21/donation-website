"use client";

import { metaCheckoutFetch } from "@/lib/meta/client";

export type HostedCheckoutResponse = {
  url?: string;
  sessionId?: string;
  totalAmountMinor?: number;
  currency?: string;
  error?: string;
};

export async function requestHostedCheckout(
  body: Record<string, unknown>,
  deadline?: { timeoutMs: number; message: string; responseErrorMessage?: string },
): Promise<{ response: Response; data: HostedCheckoutResponse }> {
  const controller = deadline ? new AbortController() : undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async () => {
    const response = await metaCheckoutFetch("/api/stripe/hosted-checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller?.signal,
    });
    let data: HostedCheckoutResponse;
    try {
      const parsed: unknown = await response.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid checkout response.");
      data = parsed as HostedCheckoutResponse;
    } catch (error) {
      if (deadline?.responseErrorMessage && !controller?.signal.aborted) throw new Error(deadline.responseErrorMessage);
      throw error;
    }
    return { response, data };
  })();

  try {
    if (!deadline) return await operation;
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(deadline.message);
          error.name = "HostedCheckoutTimeoutError";
          reject(error);
          controller?.abort();
        }, deadline.timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
