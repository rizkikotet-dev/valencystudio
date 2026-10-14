import Link from "next/link";
import { ArrowRight, Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/valency-studio/valencystudio-spoofer";
const RELEASES_URL = `${REPO_URL}/releases/latest`;

/**
 * Static bilingual strings — server component without locale hooks, so no
 * runtime dictionary here (the rest of the site translates client-side).
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-20 text-foreground">
      {/* Same blueprint grid as the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          Error · Galat
        </p>
        <p aria-hidden className="mt-4 font-display text-[7rem] font-bold leading-none tracking-tighter text-foreground/10 select-none sm:text-[9rem]">
          404
        </p>
        <h1 className="-mt-10 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman ini tidak ada
        </p>
        <p className="mt-5 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
          The link may be outdated — every release note and download lives on
          the home page. / Tautan ini mungkin sudah kedaluwarsa — semua info
          rilis ada di halaman utama.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2">
            <Link href="/">
              Back to home · Ke halaman utama
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
              Latest release
            </a>
          </Button>
          <Button asChild variant="ghost" className="gap-2 text-muted-foreground">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <Github className="size-4" />
              GitHub
            </a>
          </Button>
        </div>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          ValencyStudio — Spoofer · GPL-3.0
        </p>
      </div>
    </main>
  );
}
