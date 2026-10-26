// @vitest-environment node
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({ default: ({ id, dangerouslySetInnerHTML }: {
  id: string; dangerouslySetInnerHTML: { __html: string };
}) => <script id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} /> }));
vi.mock("@/components/analytics/meta-attribution", () => ({ MetaAttribution: () => null }));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function bootstrap(primary = "2187720428848027") {
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

describe("multiple Meta Pixels", () => {
  it("initializes both before one PageView and loads one SDK", async () => {
    const { markup, queue, insert } = await bootstrap();
    expect(queue).toEqual([["init", "2187720428848027"], ["init", "1116237120993773"], ["track", "PageView"]]);
    expect(insert).toHaveBeenCalledOnce();
    for (const id of ["2187720428848027", "1116237120993773"]) {
      expect(markup).toContain(`https://www.facebook.com/tr?id=${id}&amp;ev=PageView&amp;noscript=1`);
    }
    const { metaPixelId } = await import("@/lib/meta/config");
    expect(metaPixelId).toBe("2187720428848027");
  });
  it("deduplicates initialization if the configured primary already equals the additional Pixel", async () => {
    const { queue } = await bootstrap("1116237120993773");
    expect(queue).toEqual([["init", "1116237120993773"], ["track", "PageView"]]);
  });
});
