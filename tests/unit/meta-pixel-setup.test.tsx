// @vitest-environment node
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({ default: ({ id, dangerouslySetInnerHTML }: {
  id: string; dangerouslySetInnerHTML: { __html: string };
}) => <script id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} /> }));
vi.mock("@/components/analytics/meta-attribution", () => ({ MetaAttribution: () => null }));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

const PIXEL_SDK_URL = "https://connect.facebook.net/en_US/fbevents.js";

function readScript(markup: string, id: string) {
  return markup.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`))?.[1];
}

async function bootstrap(primary?: string) {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", primary);
  const { default: RootLayout } = await import("@/app/layout");
  const markup = renderToStaticMarkup(RootLayout({ children: null }));
  const queueSource = readScript(markup, "meta-pixel");
  const loaderSource = readScript(markup, "meta-pixel-loader");
  expect(queueSource).toBeDefined();
  expect(loaderSource).toBeDefined();

  const inserted: string[] = [];
  const inertDocument = {
    createElement: () => ({ set src(value: string) { inserted.push(value); } }),
    getElementsByTagName: () => [],
    head: { appendChild: () => undefined },
  };
  const queueContext: Record<string, unknown> = { document: inertDocument };
  queueContext.window = queueContext;
  // Execute only the site's own queue bootstrap against an inert document: no
  // Meta network requests or fake production conversions are emitted here.
  runInNewContext(queueSource!, queueContext);

  const loaderContext: Record<string, unknown> = {
    document: {
      createElement: () => ({ src: "" }),
      getElementsByTagName: () => [{ parentNode: { insertBefore: (node: { src: string }) => inserted.push(node.src) } }],
      head: { appendChild: () => undefined },
    },
  };
  loaderContext.window = loaderContext;

  const runLoader = () => runInNewContext(loaderSource!, loaderContext);
  const queue = (queueContext.fbq as { queue: Array<IArguments> }).queue.map((args) => Array.from(args));

  return { markup, queue, inserted, runLoader };
}

describe("primary Meta Pixel", () => {
  it("queues init and one PageView before any Pixel SDK request", async () => {
    const { markup, queue, inserted } = await bootstrap();
    expect(queue).toEqual([["init", "1116237120993773"], ["track", "PageView"]]);
    // The queue bootstrap must not fetch the SDK; that is deferred to window load.
    expect(inserted).toEqual([]);
    expect(markup).toContain("https://www.facebook.com/tr?id=1116237120993773&amp;ev=PageView&amp;noscript=1");
    expect(markup).not.toContain("2187720428848027");
    const { metaPixelId } = await import("@/lib/meta/config");
    expect(metaPixelId).toBe("1116237120993773");
  });

  it("loads the Pixel SDK exactly once when the deferred loader runs", async () => {
    const { inserted, runLoader } = await bootstrap();
    runLoader();
    runLoader();
    expect(inserted).toEqual([PIXEL_SDK_URL]);
  });

  it("uses an explicitly configured dataset without initializing another Pixel", async () => {
    const { queue, markup } = await bootstrap("2187720428848027");
    expect(queue).toEqual([["init", "2187720428848027"], ["track", "PageView"]]);
    expect(markup).not.toContain("1116237120993773");
  });
});
