"use client";

import { useEffect } from "react";
import { Bug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const BUG_REPORT_URL =
  "https://github.com/valency-studio/valencystudio-spoofer/issues/new?template=bug_report.md";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in server/browser logs for debugging; never shown raw to users.
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Bug className="size-6" />
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          Runtime error · Galat
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
            Terjadi kesalahan
        </p>
        <p className="mt-5 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
          The page failed to render — retrying usually fixes it. If it keeps
          happening, please open a bug report. / Halaman gagal dimuat — coba
          lagi. Jika terus terjadi, buka laporan bug.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-md border bg-surface/60 px-3 py-1.5 font-mono text-[10px] tabular-nums text-muted-foreground/80">
            digest: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            Try again · Coba lagi
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
              <Bug className="size-4" />
              Report a bug
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
