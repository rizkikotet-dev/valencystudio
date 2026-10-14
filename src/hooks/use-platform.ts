"use client";

import { useSyncExternalStore } from "react";
import type { Platform } from "./use-site-data";

function detectPlatform(): Platform {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Win(dows|32|64|NT)/.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/.test(ua)) return "macos";
  if (/Linux|X11/.test(ua) && !/Android/.test(ua)) return "linux";
  return "windows"; // Roblox Studio audience is Windows-first
}

const noopSubscribe = () => () => {};
const getServerSnapshot = (): Platform | null => null;

/**
 * Detects the visitor's desktop platform. Returns `null` during SSR and the
 * hydration render so markup stays consistent, then resolves on the client.
 */
export function usePlatform(): Platform | null {
  return useSyncExternalStore(noopSubscribe, detectPlatform, getServerSnapshot);
}

export const PLATFORM_META: Record<
  Platform,
  { label: string; fileExtension: string; sublabel: string }
> = {
  windows: { label: "Windows", fileExtension: ".exe", sublabel: "x64 installer" },
  macos: { label: "macOS", fileExtension: ".dmg", sublabel: "x64 disk image" },
  linux: { label: "Linux", fileExtension: ".AppImage", sublabel: "amd64 AppImage" },
};
