// Primary Meta Pixel and Conversions API dataset.
export const metaPixelId =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1116237120993773";

// Initialize only the primary Pixel.
export const metaBrowserPixelIds = [metaPixelId];

export function metaPurchaseEventId(sessionId: string) {
  return `purchase_${sessionId}`;
}
