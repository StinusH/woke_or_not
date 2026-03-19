import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"]
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "Woke or Not",
    template: "%s | Woke or Not"
  },
  description:
    "Check movies and TV shows for woke themes with manually curated scores, breakdowns, and details.",
  openGraph: {
    title: "Woke or Not",
    description:
      "Check movies and TV shows for woke themes with manually curated scores, breakdowns, and details.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        <SiteHeader />
        <main className="container py-8 md:py-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
