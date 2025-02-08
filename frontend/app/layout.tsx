import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "Titan AI – Empowering Your Business with AI",
    template: "%s | Titan AI",
  },
  description: "From ideation to deployment, Titan AI helps you create, develop, and launch your business with confidence.",

  metadataBase: new URL("https://titanassist.vercel.app/"),

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },

  // Open Graph configuration:
  openGraph: {
    // The canonical URL for this site or page
    url: "https://titanassist.vercel.app/",
    title: "Titan AI – Build Your Business with AI",
    description:
      "Titan AI is your all-in-one platform for research, development, security, deployment, and marketing – powered by leading large language models.",
    siteName: "Titan AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/titan-ai-hero.webp",
        width: 1200,
        height: 630,
        alt: "Titan AI – Hero Banner",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Titan AI – Empowering Your Business with AI",
    description:
      "Seamlessly integrate advanced AI workflows to build, deploy, and scale your projects.",
    images: ["/titan-ai-hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <link rel="icon" href="/favicon.ico" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
