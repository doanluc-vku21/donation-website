import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isCurrency, type Currency } from "@/lib/currency";

export type WalletUpdateContext = {
  sessionId: string; productId: string; currency: Currency;
  frequency: "monthly" | "one_time"; coverFee: boolean; exchangeRate: number;
};
type SignedContext = WalletUpdateContext & { secretHash: string; expiresAt: number };
function signature(payload: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing wallet update signing key.");
  // Domain separation: this MAC cannot be used as a Stripe API credential.
  return createHmac("sha256", key).update("donation-wallet-amount-v1\0" + payload).digest();
}
const hash = (secret: string) => createHash("sha256").update(secret).digest("hex");

export function signWalletUpdateContext(context: WalletUpdateContext, clientSecret: string, sessionExpiresAt: number) {
  const data: SignedContext = { ...context, secretHash: hash(clientSecret),
    expiresAt: Math.min(sessionExpiresAt, Date.now() + 20 * 60_000) };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function verifyWalletUpdateContext(token: unknown, sessionId: string, clientSecret: string): WalletUpdateContext | null {
  if (typeof token !== "string" || token.length > 2048) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;
    const [payload, mac] = parts;
    const supplied = Buffer.from(mac, "base64url");
    const expected = signature(payload);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedContext;
    if (data.sessionId !== sessionId || !/^prod_[A-Za-z0-9]+$/.test(data.productId) ||
        !isCurrency(data.currency) || !["monthly", "one_time"].includes(data.frequency) ||
        typeof data.coverFee !== "boolean" || !Number.isFinite(data.exchangeRate) || data.exchangeRate <= 0 ||
        !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= Date.now() ||
        !/^[a-f0-9]{64}$/.test(data.secretHash) ||
        !timingSafeEqual(Buffer.from(data.secretHash, "hex"), Buffer.from(hash(clientSecret), "hex"))) return null;
    return { sessionId: data.sessionId, productId: data.productId, currency: data.currency,
      frequency: data.frequency, coverFee: data.coverFee, exchangeRate: data.exchangeRate };
  } catch { return null; }
}
