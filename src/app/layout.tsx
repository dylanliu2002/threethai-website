import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { company } from "@/content/company";
import { en } from "@/content/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: en.meta.defaultTitle,
    template: en.meta.titleTemplate,
  },
  description: en.meta.defaultDescription,
  applicationName: company.shortBrandEn,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.threethai.com"),
  // Search-console ownership verification (set once in Vercel env, no code edits):
  //   GOOGLE_SITE_VERIFICATION  -> <meta name="google-site-verification">  (Google Search Console)
  //   BING_SITE_VERIFICATION    -> <meta name="msvalidate.01">             (Bing Webmaster Tools)
  //   YANDEX_SITE_VERIFICATION  -> <meta name="yandex-verification">      (Yandex Webmaster)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  authors: [{ name: company.nameLegalZh }],
  creator: company.nameLegalZh,
  publisher: company.nameExportEn,
  category: "textile manufacturing",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a2151",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground [font-family:var(--font-geist-sans),'PingFang_SC','Hiragino_Sans_GB','Microsoft_YaHei',sans-serif]`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
