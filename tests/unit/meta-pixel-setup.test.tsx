// @vitest-environment node
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({ default: ({ id, dangerouslySetInnerHTML }: {
  id: string; dangerouslySetInnerHTML: { __html: string };
}) => <script id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} /> }));
vi.mock("@/components/analytics/meta-attribution", () => ({ MetaAttribution: () => null }));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function bootstrap(primary?: string) {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", primary);
  const { default: RootLayout } = await import("@/app/layout");
  const markup = renderToStaticMarkup(RootLayout({ children: null }));
  const source = markup.match(/<script id="meta-pixel">([\s\S]*?)<\/script>/)?.[1];
  expect(source).toBeDefined();
  const insert = vi.fn();
  const context: Record<string, unknown> = {
    document: { createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore: insert } }] },
  };
  context.window = context;
  // Execute only the site's own bootstrap against an inert document: no Meta
  // network requests or fake production conversions are emitted by these tests.
  runInNewContext(source!, context);
  const queue = (context.fbq as { queue: Array<IArguments> }).queue.map((args) => Array.from(args));
  return { markup, queue, insert };
}

describe("primary Meta Pixel", () => {
  it("defaults to the deployed CAPI dataset before one PageView and loads one SDK", async () => {
    const { markup, queue, insert } = await bootstrap();
    expect(queue).toEqual([["init", "1116237120993773"], ["track", "PageView"]]);
    expect(insert).toHaveBeenCalledOnce();
    expect(markup).toContain("https://www.facebook.com/tr?id=1116237120993773&amp;ev=PageView&amp;noscript=1");
    expect(markup).not.toContain("2187720428848027");
    const { metaPixelId } = await import("@/lib/meta/config");
    expect(metaPixelId).toBe("1116237120993773");
  });
  it("uses an explicitly configured dataset without initializing another Pixel", async () => {
    const { queue, markup } = await bootstrap("2187720428848027");
    expect(queue).toEqual([["init", "2187720428848027"], ["track", "PageView"]]);
    expect(markup).not.toContain("1116237120993773");
  });
});
