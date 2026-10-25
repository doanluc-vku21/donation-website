"use client";

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => void;
  }
}

function readCookie(name: string) {
  const value = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  try {
    return value ? decodeURIComponent(value.slice(name.length + 1)) : "";
  } catch {
    return "";
  }
}

function writeCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=7776000; SameSite=Lax${secure}`;
}

export function captureMetaAttribution() {
  // Analytics storage must never prevent a donation (e.g. blocked cookies).
  try {
    const clickId = new URL(location.href).searchParams.get("fbclid");
    const existingFbc = readCookie("_fbc");
    if (clickId && /^[A-Za-z0-9_-]+$/.test(clickId) && clickId.length <= 450) {
      if (existingFbc.split(".").slice(3).join(".") !== clickId) {
        writeCookie("_fbc", `fb.1.${Date.now()}.${clickId}`);
      }
    }
    // A visitor ID, never a session/order ID or a fabricated Facebook click ID.
    if (!readCookie("_meta_external_id")) {
      writeCookie("_meta_external_id", crypto.randomUUID());
    }
    // _fbp is read from the actual Pixel cookie by the checkout API.
  } catch {
    // Storage may be unavailable in restricted browsers.
  }
}

export function metaCheckoutFetch(input: string, init?: RequestInit) {
  captureMetaAttribution();
  return fetch(input, init);
}
