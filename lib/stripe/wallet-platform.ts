type WalletDevice = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
};

export function getWalletPlatform(
  device: WalletDevice | undefined = typeof navigator === "undefined" ? undefined : navigator,
): "ios" | "android" | "desktop" {
  if (!device) return "desktop";
  if (/iPhone|iPad|iPod/i.test(device.userAgent) || (device.platform === "MacIntel" && device.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(device.userAgent)) return "android";
  return "desktop";
}

export function shouldPrewarmApplePay() {
  return getWalletPlatform() === "ios";
}
