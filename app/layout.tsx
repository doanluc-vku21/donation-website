import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Give a Child a Brighter Tomorrow | Open Hands Relief",
  description: "Join a caring community helping children learn, grow, and look toward a brighter future.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
