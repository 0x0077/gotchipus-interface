import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./markdown.css";
import { Providers } from "@providers/providers";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: 'Gotchipus',
    template: '%s | Gotchipus ',
  },
  description: 'An AI-powered dNFT virtual pet platform! ',
  keywords: ['cryptocurrency', 'blockchain', 'gotchipus', 'gotchi', 'AIPet', 'pet', 'ai agent'],
  authors: [{ name: 'Gotchipus' }],
  creator: 'Gotchipus',
  publisher: 'Gotchipus',
  openGraph: {
    title: 'Gotchipus',
    description: 'An AI-powered dNFT virtual pet platform! ',
    images: "https://images.gotchipus.com/preview.png",
    type: 'website',
    url: 'https://gotchipus.com'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@gotchipus',
    creator: '@gotchipus',
    title: 'Gotchipus',
    description: 'An AI-powered dNFT virtual pet platform! ',
    images: "https://images.gotchipus.com/preview.png",
  },
  icons: {
    icon: 'https://images.gotchipus.com/favicon.ico',
    apple: 'https://images.gotchipus.com/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  metadataBase: new URL('https://gotchipus.com'),
  other: {
    'base:app_id': '69f9a1b342d4fe010f1c294d',
    'talentapp:project_verification': '6b05dec2b8439a8e37ce18cb7bbbdbdb3fbbdff14fea11e08692a7a6703b784b3924817f5997e6a3d6ce5d23ce588c20d84b0577fc7b89a164b9d6a2d2f0d0d3',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#008080',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#008080" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gotchipus" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="antialiased font-vt323">
        <GoogleAnalytics />
        <Script id="disable-context-menu" strategy="afterInteractive">{
          `document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, { capture: true });`
        }</Script>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
