type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

export type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

// Speculative Checkout Session warm-up creates a real Stripe Session, so it is
// pointless work for data-saver and 2G/3G visitors. Those visitors still warm
// the Session synchronously when they actually open the donation modal.
export function shouldDeferCheckoutWarmup(
  nav: Navigator = navigator,
): boolean {
  const connection = (nav as Navigator & { connection?: NetworkInformation })
    .connection;

  if (!connection) return false;
  if (connection.saveData) return true;

  return /^(slow-)?(2g|3g)$/.test(connection.effectiveType ?? "");
}
