// Keep browser and server events on the same dataset.
export const metaPixelId =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "2187720428848027";

export function metaPurchaseEventId(sessionId: string) {
  return `purchase_${sessionId}`;
}
