// The primary browser Pixel remains the dataset used by the existing CAPI sender.
export const metaPixelId =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "2187720428848027";

// Initialize both before broadcasting events; load the Meta SDK only once.
export const metaBrowserPixelIds = [...new Set([metaPixelId, "1116237120993773"])];

export function metaPurchaseEventId(sessionId: string) {
  return `purchase_${sessionId}`;
}
