"use client";

import * as React from "react";

/**
 * Returns true once the Zustand persist store has hydrated from localStorage.
 * Use this to avoid hydration mismatches between server (empty) and client (hydrated).
 *
 * Pattern:
 *   const hydrated = useHydrated();
 *   if (!hydrated) return <Skeleton />;
 *   return <ActualComponent />;
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    // zustand persist hydrates synchronously on mount via storage event,
    // but to be safe we wait one tick
    setHydrated(true);
  }, []);
  return hydrated;
}
