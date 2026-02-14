import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const APP_URL = "https://mdview.quanna.dev";

export const metadata: Metadata = {
  title: {
    default: "MDView - Markdown & JSON Viewer | Live Preview, Tree View & TOON Export",
    template: "%s | MDView",
  },
  description:
    "Free online Markdown viewer, JSON formatter & TOON converter. Live preview, PDF export, JSON tree view, and JSON-to-TOON conversion for AI prompts. No signup required.",
  keywords: [
    "markdown viewer",
    "markdown editor",
    "json viewer",
    "json formatter",
    "json tree view",
    "json to toon",
    "toon format",
    "online markdown",
    "markdown preview",
    "markdown to html",
    "markdown to pdf",
    "free markdown editor",
    "md viewer",
    "mdview",
  ],
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MDView - Markdown & JSON Viewer | TOON Export",
    description:
      "Free online Markdown viewer, JSON formatter & TOON converter. Live preview, PDF export, tree view. No signup required.",
    url: APP_URL,
    siteName: "MDView",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MDView - Markdown & JSON Viewer | TOON Export",
    description:
      "Free online Markdown viewer, JSON formatter & TOON converter. Live preview, PDF export, tree view.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  other: {
    "google-site-verification": "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MDView",
              url: APP_URL,
              description:
                "Free online Markdown viewer, JSON formatter and TOON converter with live preview and PDF export.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              browserRequirements: "Requires a modern web browser",
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
