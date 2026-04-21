import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { League_Spartan } from "next/font/google";
import { ThemeProvider } from "next-themes";
import CookieConsent from "@/components/ads/CookieConsent";
import Script from "next/script";
import AppBackground from "@/components/layout/AppBackground";
import { APP_URL } from "@/lib/utils/constants";
import QueryProvider from "@/lib/tanstack/query-provider";
import "./globals.css";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin", "latin-ext"],
//   display: "swap",
// });

const league_spartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lingdb – Master Any Language",
    template: "%s | Lingdb",
  },
  description:
    "Create flashcards, take quizzes, and learn with AI-powered tools. Lingdb is your personal language learning companion.",
  keywords: [
    "language learning",
    "flashcards",
    "quiz",
    "dictionary",
    "vocabulary",
  ],
  authors: [{ name: "Lingdb" }],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Lingdb – Master Any Language",
    description:
      "Create flashcards, take quizzes, and learn with AI-powered tools.",
    type: "website",
    locale: "en_US",
    url: "https://lingdb.com",
    siteName: "Lingdb",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4652276005943804" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.1/css/flag-icons.min.css"
        />
      </head>
      <body className={`${league_spartan.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppBackground />
            {children}
          </ThemeProvider>
        </QueryProvider>

        {/* AdSense will only activate ads if the CookieConsent sets the accepted cookie value */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
        />
      </body>
    </html>
  );
}
