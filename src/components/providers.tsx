"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useLocale } from "@/hooks/use-locale";

/**
 * Screen-reader live region: announces language switches in the language the
 * visitor switched TO. Deliberately silent on first mount (no announcement
 * for the initially-restored locale), then polite-announces every change.
 */
function LocaleAnnouncer() {
  const { locale } = useLocale();
  const [message, setMessage] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    // Defer past the effect tick: live regions announce more reliably when
    // the text lands in a separate frame from the change that triggered it.
    const raf = window.requestAnimationFrame(() => {
      setMessage(
        locale === "en"
          ? "Language switched to English"
          : "Bahasa diubah ke Bahasa Indonesia"
      );
    });
    return () => window.cancelAnimationFrame(raf);
  }, [locale]);

  // Auto-clear so a repeat switch to the same language re-announces.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <LocaleAnnouncer />
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
