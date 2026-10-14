/**
 * Dynamic Open Graph image (1200×630) for the launch site.
 *
 * Rendered at request time with next/og (satori) and the site's real brand
 * assets — Space Grotesk + JetBrains Mono TTFs (checked into src/app/og-fonts)
 * and the exact hex values of the dark theme tokens. Live GitHub numbers
 * (stars / downloads / latest tag) come from the shared fail-safe client, so
 * the card degrades gracefully to fallback data when GitHub is unreachable.
 *
 * If rendering itself ever fails, the static public/og.png is served instead.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchLatestRelease, fetchRepoStats, fetchTotalDownloads } from "@/lib/github";

export const alt =
  "ValencyStudio — Spoofer · Every asset in your place, found and replaced in one pass";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Dark-theme tokens, converted from the oklch values in globals.css. */
const BG = "#0c0a09";
const SURFACE = "rgba(241, 240, 238, 0.03)";
const FG = "#f1f0ee";
const MUTED = "#9a9894";
const EMBER = "#f75700";
const EMBER_DIM = "rgba(247, 87, 0, 0.55)";
const LINE = "rgba(241, 240, 238, 0.09)";
const GRID_LINE = "rgba(241, 240, 238, 0.045)";

type FontData = { name: string; data: Buffer; weight: 400 | 500 | 600 | 700 };

let fontsPromise: Promise<FontData[]> | null = null;

function loadFonts(): Promise<FontData[]> {
  fontsPromise ??= Promise.all([
    readFile(path.join(process.cwd(), "src/app/og-fonts/space-grotesk-500.ttf")),
    readFile(path.join(process.cwd(), "src/app/og-fonts/space-grotesk-700.ttf")),
    readFile(path.join(process.cwd(), "src/app/og-fonts/jetbrains-mono-400.ttf")),
    readFile(path.join(process.cwd(), "src/app/og-fonts/jetbrains-mono-600.ttf")),
  ]).then(([sg500, sg700, jb400, jb600]) => [
    { name: "SpaceGrotesk", data: sg500, weight: 500 },
    { name: "SpaceGrotesk", data: sg700, weight: 700 },
    { name: "JetBrainsMono", data: jb400, weight: 400 },
    { name: "JetBrainsMono", data: jb600, weight: 600 },
  ]);
  return fontsPromise;
}

const compact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

function StatCard({
  label,
  value,
  mono = false,
  live = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  live?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: 10,
        padding: "18px 20px",
        borderRadius: 12,
        border: `1px solid ${LINE}`,
        background: SURFACE,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {live ? (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: "#10b981",
            }}
          />
        ) : null}
        <div
          style={{
            fontFamily: "JetBrainsMono",
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: 2.6,
            color: MUTED,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          fontFamily: mono ? "JetBrainsMono" : "SpaceGrotesk",
          fontWeight: mono ? 600 : 600,
          fontSize: mono ? 26 : 30,
          color: FG,
          letterSpacing: mono ? 0 : -0.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}

async function renderCard(): Promise<ImageResponse> {
  const [fonts, stats, release, totalDownloads] = await Promise.all([
    loadFonts(),
    fetchRepoStats(),
    fetchLatestRelease(),
    fetchTotalDownloads(),
  ]);

  const live = stats.source === "github";

  const tree = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "52px 64px 44px",
          position: "relative",
        }}
      >
        {/* Blueprint grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
        {/* Ember glow rising from the top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage:
              "radial-gradient(ellipse 62% 52% at 50% 0%, rgba(247, 87, 0, 0.16) 0%, rgba(247, 87, 0, 0.05) 42%, transparent 72%)",
          }}
        />
        {/* Top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 2,
            display: "flex",
            backgroundImage: `linear-gradient(to right, transparent, ${EMBER} 50%, transparent)`,
          }}
        />
        {/* Corner ticks (mirrors the site's .corner-ticks utility) */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            width: 14,
            height: 14,
            borderTop: `2px solid ${EMBER_DIM}`,
            borderLeft: `2px solid ${EMBER_DIM}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 26,
            right: 26,
            width: 14,
            height: 14,
            borderBottom: `2px solid ${EMBER_DIM}`,
            borderRight: `2px solid ${EMBER_DIM}`,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 11,
                background: "linear-gradient(135deg, #f75700 0%, #b93a00 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(247, 87, 0, 0.35)",
              }}
            >
              <span style={{ fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: 21, color: "#ffffff" }}>
                VS
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: 21, color: FG, letterSpacing: -0.2 }}>
                ValencyStudio — Spoofer
              </div>
              <div style={{ fontFamily: "JetBrainsMono", fontWeight: 400, fontSize: 12, letterSpacing: 2.4, color: MUTED }}>
                ASSET REPLACEMENT FOR ROBLOX STUDIO
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid rgba(247, 87, 0, 0.45)`,
              background: "rgba(247, 87, 0, 0.09)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 7,
                background: live ? "#10b981" : MUTED,
              }}
            />
            {/* display:flex is required: children compile to an array
                (expression + literal text) which trips satori's rule */}
            <div style={{ display: "flex", fontFamily: "JetBrainsMono", fontWeight: 600, fontSize: 14, letterSpacing: 1, color: EMBER }}>
              {release.tag} · LATEST
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 52,
            fontFamily: "SpaceGrotesk",
            fontWeight: 700,
            fontSize: 62,
            lineHeight: 1.08,
            letterSpacing: -2,
            color: FG,
          }}
        >
          <div style={{ display: "flex" }}>Every asset in your place,</div>
          <div style={{ display: "flex" }}>
            <span style={{ color: EMBER, marginRight: 18 }}>found and replaced</span>
            <span>in one pass.</span>
          </div>
        </div>

        {/* Subhead */}
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontFamily: "SpaceGrotesk",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.4,
            color: MUTED,
          }}
        >
          Preview R6/R15 animations and audio, then push replacements across the entire place — no manual instance editing.
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 14, marginTop: "auto" }}>
          <StatCard label="STARS" value={compact(stats.stars)} live={live} />
          <StatCard
            label="DOWNLOADS"
            value={totalDownloads !== null ? compact(totalDownloads) : "—"}
            live={live}
          />
          <StatCard label="LATEST" value={release.tag} mono />
          <StatCard label="LICENSE" value="GPL-3.0" mono />
        </div>

        {/* Footer line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${LINE}`,
          }}
        >
          <div style={{ display: "flex", fontFamily: "JetBrainsMono", fontWeight: 400, fontSize: 15, color: MUTED }}>
            github.com/valency-studio/valencystudio-spoofer
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ display: "flex", fontFamily: "JetBrainsMono", fontWeight: 400, fontSize: 15, color: MUTED }}>
              Open source
            </div>
            <div style={{ width: 4, height: 4, borderRadius: 4, background: EMBER, display: "flex" }} />
            <div style={{ display: "flex", fontFamily: "JetBrainsMono", fontWeight: 600, fontSize: 15, color: FG }}>
              Windows · macOS · Linux
            </div>
          </div>
        </div>
      </div>
  );
  return new ImageResponse(
    tree,
    {
      width: size.width,
      height: size.height,
      fonts,
    }
  );
}

export default async function OpengraphImage(): Promise<Response> {
  try {
    return await renderCard();
  } catch (error) {
    // Never break a social crawl — fall back to the static card.
    console.error("[opengraph-image] dynamic render failed, serving static og.png:", error);
    const png = await readFile(path.join(process.cwd(), "public", "og.png"));
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png" },
    });
  }
}
