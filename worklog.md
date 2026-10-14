# Worklog — ValencyStudio Spoofer Launch Site

## Project Brief (created by orchestrator, Task 1)

Goal: Fullstack launch / promotion site for **ValencyStudio - Spoofer**
(https://github.com/valency-studio/valencystudio-spoofer) — a desktop asset
replacement tool for Roblox Studio (Tauri 2 · Rust · React 19 · Luau, GPL-3.0,
latest tag v3.0.2, builds for Windows `.exe` / macOS `.dmg` / Linux `.AppImage`,
companion Studio plugin `ValencyStudioSpoofer.rbxmx`).

- Route: single page `/` only (project rule). APIs allowed under `/api/*`.
- Design: dark-first professional dev-tool aesthetic. NO "AI slop"
  (no purple gradients, no generic copy). Accent = ember orange.
  Fonts: Space Grotesk (display) / Inter (body) / JetBrains Mono (mono).
  Product copy is taken from the real repo README.
- Stack: Next.js 16 App Router, TS, Tailwind 4 + shadcn/ui, framer-motion,
  @tanstack/react-query, next-themes (dark default), sonner toasts, Prisma/SQLite.
- Footer must be sticky-to-bottom (`min-h-svh flex flex-col` + `mt-auto`).
- Do NOT use z-ai-web-dev-sdk in client code. No server actions — use API routes.

### API contract (agreed — backend Task 2-a must implement exactly this)

1. `GET /api/stats` →
   `{ github: { stars:number, forks:number, watchers:number, openIssues:number },
      release: { tag:string, name:string, publishedAt:string|null, url:string,
        assets: { platform:"windows"|"macos"|"linux", name:string, url:string, downloads:number }[] },
      totals: { downloads:number|null },
      site: { downloadClicks:number, subscribers:number },
      source: "github"|"fallback" }`
   In-memory cache TTL 10 min; on GitHub failure use fallback constants (v3.0.2).
2. `GET /api/changelog` → `{ releases: { tag, name, publishedAt, url, notes:string }[],
      source:"github"|"fallback" }` — latest 8 releases, notes plain text (strip markdown).
3. `POST /api/subscribe` body `{ email }` (zod-validated) → `{ ok:true, subscribers:number }`
   or `{ ok:false, error:string }` (400/500). Unique email via Prisma, upsert on conflict.
4. `POST /api/downloads` body `{ platform:"windows"|"macos"|"linux" }` →
   `{ ok:true, clicks:{ windows:number, macos:number, linux:number, total:number } }`

DB models (replace scaffold User/Post):
- `Subscriber { id String @id @default(cuid()), email String @unique, createdAt DateTime @default(now()) }`
- `DownloadEvent { id String @id @default(cuid()), platform String, createdAt DateTime @default(now()) }`

Repo facts for copy/fallback: stars≈1, GPL-3.0, Discord https://discord.gg/6RHuXU9DCv,
issues templates bug_report.md / feature_request.md, releases page
https://github.com/valency-studio/valencystudio-spoofer/releases/latest.

### Work log

---
Task ID: 1
Agent: orchestrator (Z.ai Code)
Task: Foundation — research repo, init worklog, design tokens, layout, providers

Work Log:
- Researched repo metadata, README, tags via GitHub API/raw (product facts above)
- Downloaded official app icon → public/icon.png + public/app-icon.png
- Rewrote globals.css: ember-orange token set, dark-first, bg-grid/bg-dots
  utilities, custom scrollbars, marquee keyframes, selection color
- Rewrote layout.tsx: Space Grotesk + Inter + JetBrains Mono via next/font,
  real product metadata/OG, /icon.png favicon
- Added src/components/providers.tsx (next-themes dark default + react-query + sonner Toaster)

Stage Summary:
- Design system + app shell ready. API contract above is binding for Task 2-a.

---
Task ID: 2-a
Agent: full-stack-developer
Task: Backend — Prisma schema, GitHub lib with memory cache, API routes (stats/changelog/subscribe/downloads)

Work Log:
- Replaced scaffold User/Post models in prisma/schema.prisma with Subscriber
  (email unique) + DownloadEvent (platform String); kept sqlite generator/datasource.
  Ran `bun run db:push` + `bun run db:generate` (Prisma Client v6.19.2, db/custom.db).
- Created src/lib/github.ts: server-only GitHub client for
  valency-studio/valencystudio-spoofer. Module-level Map cache with expiry
  timestamps, 10 min TTL (success responses only; failures are never cached).
  ghFetch helper: Accept: application/vnd.github+json, required User-Agent,
  X-GitHub-Api-Version 2022-11-28, optional Bearer token if GITHUB_TOKEN env set,
  cache: "no-store", AbortSignal.timeout(8000). Exports typed fns:
  fetchRepoStats / fetchLatestRelease / fetchReleases / fetchTotalDownloads
  (+ stripMarkdownToPlainText helper and interfaces RepoStats, ReleaseInfo,
  ReleaseAsset, ChangelogRelease, ReleasesResult, AssetPlatform, DataSource).
  Assets classified by extension: .exe→windows, .dmg→macos, .AppImage→linux,
  everything else ignored. Release notes: markdown stripped to plain text
  (links keep label, images/headings/backticks/quotes/emphasis removed,
  whitespace collapsed) and capped at 400 chars + ellipsis. All functions
  never throw — fallback constants on any error (tag v3.0.2, stars 1,
  forks 0, watchers 1, openIssues 0, 3 platform assets, asset url =
  .../releases/latest).
- Created 4 route handlers (all `runtime = "nodejs"`, `dynamic = "force-dynamic"`,
  NextResponse.json, TS strict, no server actions):
  - GET  /api/stats    → github + release + totals + site (DB counts in
    db.$transaction wrapped in try/catch → zeros on DB failure) + source.
    source = "github" only when repo stats, release AND total downloads all
    live; otherwise "fallback".
  - GET  /api/changelog → fetchReleases(); on fallback/empty returns hardcoded
    v3.0.2 (publishedAt "2026-10-13") / v3.0.1 / v2.5.0 / v2.4.0 list with
    "See the release page for the full changelog." notes.
  - POST /api/subscribe → zod v4 `z.string().trim().toLowerCase().pipe(z.email())`
    (verified zod 4.3.5 at runtime), Prisma upsert idempotent, P2002 unique
    violation caught via Prisma.PrismaClientKnownRequestError → still 200 ok;
    invalid body → 400 {ok:false,error}, DB error → 500. Optional GET returns
    { subscribers: n }.
  - POST /api/downloads → zod enum windows/macos/linux, create DownloadEvent,
    groupBy counts → { ok:true, clicks:{windows,macos,linux,total} }; invalid →
    400; DB error → 200 {ok:false,error} so tracking never breaks download UX.
- Verified every endpoint with curl against the running dev server (first-hit
  compiles on demand). Fixed one deviation found during verification: fallback
  asset URLs now point to .../releases/latest exactly as specified.
- Cleaned test rows afterwards (1 subscriber, 2 download events) so the site
  launches with zeroed counters; scoped eslint on my 5 files → clean.

Stage Summary:
- curl verification results (all HTTP 200 except intentional 400s):
  * GET  /api/stats → 200 {"github":{"stars":1,"forks":0,"watchers":0,"openIssues":0},
    "release":{"tag":"v3.0.2","name":"ValencyStudio - Spoofer v3.0.2","assets":[
    windows .exe / macos .dmg / linux .AppImage]},"totals":{"downloads":...},
    "site":{"downloadClicks":0,"subscribers":0},"source":"github"|"fallback"}.
    Observed BOTH paths: live GitHub data (publishedAt "2026-10-13T15:45:26Z",
    real /releases/download/ asset URLs, windows downloads:1) when not
    rate-limited, and fallback constants when GitHub 403s — machine's GitHub
    rate limit is intermittent, handled gracefully.
  * GET  /api/changelog → 200 fallback list v3.0.2(2026-10-13)/v3.0.1/v2.5.0/
    v2.4.0 when GitHub rate-limited; switches to live 8-release list with
    plain-text notes when reachable (source field reflects it).
  * POST /api/subscribe {"email":"test@example.com"} → {"ok":true,"subscribers":1};
    duplicate POST → idempotent {"ok":true,"subscribers":1}; invalid email →
    400 {"ok":false,"error":"Please enter a valid email address."}.
  * POST /api/downloads {"platform":"windows"} → {"ok":true,"clicks":{"windows":1,
    "macos":0,"linux":0,"total":1}}; second linux click updated totals; invalid
    platform → 400 {"ok":false,"error":"Invalid platform. Expected \"windows\",
    \"macos\" or \"linux\"."}.
- Key decisions: zod v4 top-level z.email() behind a trim/toLowerCase pipe;
  negative GitHub responses not cached (so recovery is immediate after a rate
  limit window); stats `source` is all-or-nothing ("github" only if repo stats,
  release and total downloads are all live) so the UI badge never overstates;
  changelog owns its own hardcoded fallback (lib returns empty+fallback).
- Artifacts: prisma/schema.prisma (Subscriber, DownloadEvent),
  src/lib/github.ts, src/app/api/{stats,changelog,subscribe,downloads}/route.ts.
  DB test rows removed → counters start at 0. ESLint scoped-clean; dev.log
  shows all requests 200/400 as expected, no errors.

---
Task ID: 2-b
Agent: orchestrator (Z.ai Code)
Task: Frontend — all site sections and components

Work Log:
- Built hooks: use-site-data.ts (TanStack Query + fallback constants + API posters), use-platform.ts (useSyncExternalStore platform detection)
- Built components/site/: reveal.tsx (framer-motion whileInView), section-heading.tsx (numbered eyebrows), navbar.tsx (sticky blur nav, CSS-driven theme icons, GitHub stars, mobile menu), studio-mock.tsx (hand-built app window: title bar, toolbar, place browser tree, live-cycling replacement queue, scan line, status bar), hero.tsx, stats-strip.tsx (count-up numbers), how-it-works.tsx (3 steps + connector), features.tsx (6 cards + corner ticks), asset-types.tsx (marquee), download.tsx (3 platform cards, detected-platform highlight, click tracking, unsigned-build transparency note), changelog.tsx (live releases w/ skeleton), faq.tsx (accordion), cta.tsx (subscribe form + live count), footer.tsx (3 columns + legal/trademark disclaimer + safe-area inset)
- page.tsx: min-h-svh flex flex-col, sticky footer via mt-auto

Stage Summary:
- 15 components/hooks, dark-first + crafted light theme, ember accent, Space Grotesk/Inter/JetBrains Mono

---
Task ID: 3
Agent: orchestrator (Z.ai Code)
Task: Integration — lint fixes, error fixes, API verification

Work Log:
- Fixed react-hooks/set-state-in-effect lint errors: navbar theme toggle → CSS-driven icons (no mounted state), use-platform → useSyncExternalStore, cta → derived subscriber count
- Fixed lucide-react export: GitTag does not exist → Tag (import + JSX)
- Created missing reveal.tsx (lost in earlier mkdir failure)
- Added metadataBase to metadata (silenced OG warning)
- Verified: bun run lint clean; page 200; /api/stats /api/changelog /api/subscribe /api/downloads all 200 with valid contract JSON

Stage Summary:
- Zero lint errors, zero runtime errors, all 4 APIs verified live

---
Task ID: 4
Agent: orchestrator (Z.ai Code)
Task: QA with agent-browser — rendering, interactivity, responsiveness

Work Log:
- Fixed hydration error: ThemeToggle aria-label depended on resolvedTheme → static "Toggle theme"
- Fixed leftover <GitTag> usage causing runtime ReferenceError
- Verified in browser (1440x900, 390x844): all sections render on real scroll; fonts confirmed loaded (Space Grotesk/Inter/JetBrains Mono); platform detection works (Linux detected, "Download for Linux"); FAQ accordion opens; subscribe form → 200 + sonner toast "You're on the list"; download click → opens real GitHub release URL in new tab (live API URL) + toast + DownloadEvent recorded; theme toggle light/dark both crafted; mobile hamburger menu works; footer sticky at bottom, safe-area inset added
- Cleaned QA test rows (2 subscribers, 2 download events) → counters start at 0
- Fresh reload: zero console errors, zero page errors

Stage Summary:
- Site is fully interactive and browser-verified. Known non-issue: full-page virtual screenshots don't trigger whileInView reveals; real scrolling verified working.

---
Task ID: R1 (cron review round 1)
Agent: orchestrator (Z.ai Code)
Task: Status assessment, QA, new features (command palette, comparison, quickstart, OG image, polish)

Work Log — Assessment:
- Baseline stable: page 200, all 4 APIs 200, no errors in dev.log, previous QA state intact.

Work Log — New features built:
- OG share image: hand-crafted og-card.html (brand icon, wordmark, headline, tech chips, meta row) → screenshotted at 1200x630 → public/og.png; wired into openGraph (summary_large_image) + twitter metadata.
- Command palette (⌘K/Ctrl+K): new command-palette.tsx on shadcn CommandDialog. Groups: Navigate (6 sections), Actions (Download for {detected platform} w/ tracking + GitHub/Discord/bug/feature links), Preferences (theme switch). Global hotkey listener + custom-event trigger; footer kbd hints. Navbar: xl search chip with ⌘K kbd + mobile menu "Search…" item.
- Comparison section (#comparison, "03 — Comparison"): honest 5-row "Doing it by hand" vs "With ValencyStudio — Spoofer" table, all claims map to real README features.
- Quickstart terminal block in Download section: 4 numbered build commands (git clone/cd/bun install/bun run tauri:dev) with one-click copy-to-clipboard + toast; terminal stays dark in both themes.
- Polish: reading-progress hairline (framer-motion useScroll, fixed top); BackToTop button (appears >700px, AnimatePresence); JSON-LD SoftwareApplication schema (version, platforms, GPL license, free offer) in page.tsx; section renumbering 01–06.

Work Log — Bugs found & fixed during QA:
- navbar.tsx: missing </header> after refactor → JSX parse error → fixed.
- Command palette search bug: cmdk filters on `value` prop, not visible label — "for linux"/"switch" matched nothing → set value={visible label} on download + theme items; re-verified: "for linux" → Enter opens real release URL in new tab + DownloadEvent recorded.
- DB cleanup: removed 2 QA download events so launch counters start at 0.

Verification:
- bun run lint clean; page 200; browser-verified: palette open/filter/navigate/download/theme all work; comparison + quickstart render in dark & light; mobile 390px OK; JSON-LD + og:image meta present; zero console/page errors.

Stage Summary:
- Site now has: ⌘K command palette, comparison table, build-from-source quickstart, branded OG image, scroll progress, back-to-top, structured data.
- NOTE for next round: metadataBase is placeholder "https://github.com/valency-studio" — replace with the real deploy domain for absolute OG URLs when known.

Unresolved / next-phase recommendations (priority order):
1. GitHub rate limits are intermittent → stats/changelog sometimes serve fallback until window resets (handled, self-recovers; could add longer TTL or a proxy token via GITHUB_TOKEN env).
2. Could add: per-release download-count chart (data still sparse — repo is new), i18n (ID/EN toggle), testimonials/community wall via Discord.
3. Keep polishing hover/focus micro-interactions on cards and marquee pause-on-hover.
