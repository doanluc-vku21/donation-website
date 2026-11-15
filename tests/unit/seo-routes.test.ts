import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const site = "https://donate.mealsupport.org";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", site);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("crawl metadata", () => {
  it("keeps the studio, the payment webhook, and the thank-you page out of the index", async () => {
    const { default: robots } = await import("@/app/robots");

    const rules = robots().rules as { userAgent: string; allow: string; disallow: string[] }[];

    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ userAgent: "*", allow: "/" });
    expect(rules[0].disallow).toEqual(
      expect.arrayContaining(["/studio", "/api/", "/thank-you"]),
    );
  });

  it("advertises the sitemap on the configured site URL", async () => {
    const { default: robots } = await import("@/app/robots");

    expect(robots().sitemap).toBe(`${site}/sitemap.xml`);
  });

  it("lists every public page once on absolute URLs", async () => {
    const { default: sitemap } = await import("@/app/sitemap");

    const urls = sitemap().map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(`${site}/`))).toBe(true);
    expect(urls).toEqual(
      expect.arrayContaining([
        `${site}/gaza-food`,
        `${site}/gaza-food/donate`,
        `${site}/akram-shake`,
        `${site}/help-mango-seller`,
        `${site}/privacy-policy`,
        `${site}/donation-refund-policy`,
      ]),
    );
    expect(urls.some((url) => /studio|thank-you|api/.test(url))).toBe(false);
  });

  it("falls back to the production domain when no site URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
    const { default: robots } = await import("@/app/robots");

    expect(robots().sitemap).toBe(`${site}/sitemap.xml`);
  });
});
