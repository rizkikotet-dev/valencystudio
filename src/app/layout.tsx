import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ValencyStudio — Spoofer · Asset replacement for Roblox Studio",
  description:
    "Preview, replace, and push animations, sounds, decals, meshes, and videos across an entire Roblox Studio place — without manually editing a single instance.",
  keywords: [
    "ValencyStudio",
    "Spoofer",
    "Roblox Studio",
    "asset replacement",
    "Tauri",
    "Rust",
    "Luau",
    "game development tools",
  ],
  authors: [{ name: "valency-studio" }],
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "ValencyStudio — Spoofer for Roblox Studio",
    description:
      "Scan an entire place, preview R6/R15 animations and audio, and replace assets in real time through a companion Studio plugin.",
    siteName: "ValencyStudio — Spoofer",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ValencyStudio — Spoofer · Every asset in your place, found and replaced in one pass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ValencyStudio — Spoofer for Roblox Studio",
    description:
      "Scan an entire place, preview animations and audio, and replace assets in real time.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#101012" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
