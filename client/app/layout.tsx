import type { Metadata } from "next";
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
    default: "Endpoint Doctor",
    template: "%s | Endpoint Doctor",
  },

  description:
    "Endpoint Doctor is an advanced website and API diagnostics platform that analyzes performance, detects bottlenecks, monitors backend endpoints, and explains exactly why your website or API is slow.",

  keywords: [
    "website analyzer",
    "api monitoring",
    "website speed test",
    "performance analyzer",
    "backend diagnostics",
    "endpoint checker",
    "network analysis",
    "lighthouse alternative",
    "developer tools",
    "website optimization",
  ],

  authors: [{ name: "Kamdi Dev" }],

  creator: "Kamdi Dev",

  metadataBase: new URL("https://endpointdoctor.dev"),

  openGraph: {
    title: "Endpoint Doctor",
    description:
      "Analyze websites and APIs in real time. Detect slow endpoints, rendering issues, network bottlenecks, and performance problems instantly.",
    url: "https://endpointdoctor.dev",
    siteName: "Endpoint Doctor",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Endpoint Doctor",
    description:
      "Powerful website & API diagnostics platform for developers and businesses.",
    creator: "@kg8gz",
  },

  robots: {
    index: true,
    follow: true,
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
      </body>
    </html>
  );
}