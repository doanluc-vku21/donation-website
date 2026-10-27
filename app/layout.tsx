import type { Metadata } from "next";
import Script from "next/script";
import { MetaAttribution } from "@/components/analytics/meta-attribution";
import { metaBrowserPixelIds } from "@/lib/meta/config";

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
        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {
                if(f.fbq)return;

                n=f.fbq=function()
                {
                  n.callMethod
                    ? n.callMethod.apply(n,arguments)
                    : n.queue.push(arguments);
                };

                if(!f._fbq)f._fbq=n;

                n.push=n;
                n.loaded=!0;
                n.version='2.0';
                n.queue=[];

                t=b.createElement(e);
                t.async=!0;
                t.src=v;

                s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s);
              }
              (
                window,
                document,
                'script',
                'https://connect.facebook.net/en_US/fbevents.js'
              );

              ${metaBrowserPixelIds.map((pixelId) => `fbq('init', ${JSON.stringify(pixelId)});`).join("\n")}
              fbq('track', 'PageView');
            `,
          }}
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
