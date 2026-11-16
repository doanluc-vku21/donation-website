import { metaBrowserPixelIds } from "@/lib/meta/config";

// Queue only: this script never requests anything over the network. fbevents.js
// replays window.fbq's queue once it arrives, so init/PageView order and the
// event payloads stay exactly as the single-snippet bootstrap produced them.
export const metaPixelQueueScript = `!function(f){
  if (f.fbq) return;
  var n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = '2.0';
  n.queue = [];
}(window);
${metaBrowserPixelIds.map((pixelId) => `fbq('init', ${JSON.stringify(pixelId)});`).join("\n")}
fbq('track', 'PageView');
`;

// 246 KB of Pixel SDK plus remote configuration used to compete with the first
// paint and hydration wave on slow mobile connections. Load it after the window
// load event instead; the queue above keeps every event.
export const metaPixelLoaderScript = `!function(w, d){
  if (w.__metaPixelSdkRequested) return;
  w.__metaPixelSdkRequested = true;
  var t = d.createElement('script');
  t.async = !0;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  var s = d.getElementsByTagName('script')[0];
  if (s && s.parentNode) s.parentNode.insertBefore(t, s);
  else (d.head || d.body).appendChild(t);
}(window, document);
`;
