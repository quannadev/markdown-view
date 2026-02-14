import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
});

const APP_URL = "https://mdview.quanna.dev";

export const metadata: Metadata = {
  title: {
    default: "MDView - Online Markdown Viewer & Editor | Live Preview & PDF Export",
    template: "%s | MDView",
  },
  description:
    "Free online Markdown viewer and editor with live preview, syntax highlighting, PDF export, and local storage. Paste or type Markdown and see rendered HTML instantly. No signup required.",
  keywords: [
    "markdown viewer",
    "markdown editor",
    "online markdown",
    "markdown preview",
    "markdown to html",
    "markdown to pdf",
    "markdown renderer",
    "live markdown preview",
    "free markdown editor",
    "markdown parser",
    "md viewer",
    "mdview",
  ],
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MDView - Online Markdown Viewer & Editor",
    description:
      "Free online Markdown viewer with live preview, syntax highlighting, and PDF export. No signup required.",
    url: APP_URL,
    siteName: "MDView",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MDView - Online Markdown Viewer & Editor",
    description:
      "Free online Markdown viewer with live preview, syntax highlighting, and PDF export.",
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
                "Free online Markdown viewer and editor with live preview, syntax highlighting, and PDF export.",
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
