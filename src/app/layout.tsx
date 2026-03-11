import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
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
    default: "MDView - Markdown Viewer | View Large Files, Excel & Doc to Markdown",
    template: "%s | MDView",
  },
  description:
    "Free online Markdown viewer and JSON formatter. View large files, convert Excel to Markdown, and Doc to Markdown instantly. Live preview and PDF export.",
  keywords: [
    "markdown viewer",
    "markdown editor",
    "view large files",
    "excel to markdown",
    "doc to markdown",
    "csv to markdown",
    "pdf to markdown",
    "large markdown viewer",
    "json viewer",
    "json formatter",
    "json tree view",
    "json to toon",
    "online markdown",
    "markdown preview",
    "md viewer",
    "mdview",
  ],
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MDView - Markdown Viewer | View Large Files & Convert Docs",
    description:
      "Free online Markdown viewer and JSON formatter. View large files, convert Excel to Markdown, and Doc to Markdown instantly. Live preview and PDF export.",
    url: APP_URL,
    siteName: "MDView",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MDView - Markdown Viewer | View Large Files & Convert Docs",
    description:
      "Free online Markdown viewer and JSON formatter. View large files, convert Excel to Markdown, and Doc to Markdown instantly. Live preview and PDF export.",
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
                "Free online Markdown viewer and JSON formatter. Effortlessly view large files, convert Excel to Markdown, and Doc to Markdown. Includes live preview, PDF export, and TOON conversion for AI.",
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
