import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

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
  metadataBase: new URL("https://github.com/valency-studio"),
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
    images: [{ url: "/app-icon.png", width: 512, height: 512, alt: "ValencyStudio — Spoofer" }],
  },
  twitter: {
    card: "summary",
    title: "ValencyStudio — Spoofer for Roblox Studio",
    description:
      "Scan an entire place, preview animations and audio, and replace assets in real time.",
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
