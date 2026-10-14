"use client";

import { useCallback, useSyncExternalStore } from "react";
import { translate, type Locale } from "@/lib/i18n";

/**
 * Locale store, mirroring the proven external-store pattern in use-platform.ts:
 * module-level state + listener set + useSyncExternalStore. getServerSnapshot
 * always returns "en", so SSR markup and the hydration render match exactly;
 * the persisted/browser preference applies right after hydration.
 */

const STORAGE_KEY = "vs-locale";

let locale: Locale = "en";
const listeners = new Set<() => void>();

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "id";
}

// One-time client init: stored preference wins, then the browser language.
if (typeof window !== "undefined") {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      locale = stored;
    } else if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("id")
    ) {
      locale = "id";
    }
  } catch {
    // localStorage unavailable (privacy mode, etc.) — keep the default.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): Locale => locale;

const getServerSnapshot = (): Locale => "en";

/** Switch the site language, persist the choice, and notify every subscriber. */
export function setLocale(next: Locale) {
  const nextLocale: Locale = isLocale(next) ? next : "en";
  if (nextLocale === locale) return;
  locale = nextLocale;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  } catch {
    // Persistence is best-effort; the in-memory locale still updates.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Current locale + a memoized `t(key, vars?)` bound to it, with fallback
 * chain: current dictionary → English dictionary → raw key.
 */
export function useLocale() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(current, key, vars),
    [current]
  );

  return { locale: current, setLocale, t };
}
