import type { Metadata } from "next";
import Script from "next/script";
import { MetaAttribution } from "@/components/analytics/meta-attribution";
import { metaBrowserPixelIds } from "@/lib/meta/config";
import { metaPixelLoaderScript, metaPixelQueueScript } from "@/lib/meta/pixel-bootstrap";
import { applePayBootstrapScript } from "@/lib/stripe/apple-pay-bootstrap";

import "./globals.css";

export const metadata: Metadata = {
  title: "Give a Child a Brighter Tomorrow | Open Hands Relief",
  description:
    "Join a caring community helping children learn, grow, and look toward a brighter future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
        <Script id="apple-pay-sdk-preload" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: applePayBootstrapScript }} />
        {/* Meta Pixel Code — queue immediately, load the SDK after window load. */}
        <Script
          id="meta-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: metaPixelQueueScript }}
        />
        <Script
          id="meta-pixel-loader"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: metaPixelLoaderScript }}
        />
        {/* End Meta Pixel Code */}
      </head>

      <body>
        <MetaAttribution />
        <noscript>
          {metaBrowserPixelIds.map((pixelId) => (
            // A tracking pixel must bypass Next.js image optimization.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={pixelId}
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          ))}
        </noscript>

        {children}
      </body>
    </html>
  );
}
