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

---
Task ID: R2 (cron review round 2)
Agent: orchestrator (Z.ai Code)
Task: Status assessment, QA, live commit data, micro-interactions, CTA share/success, footer freshness

Work Log — Assessment:
- Baseline stable (page 200, APIs 200, zero errors). Continued with feature + polish round per R1 recommendations.

Work Log — Features:
- Live commit data: github.ts gained fetchLatestCommit() (GET /commits?per_page=1, 10-min cache, null on failure, negative results never cached); /api/stats now returns lastCommit {sha,date,message}|null; StatsResponse type + fallback updated.
- StatsStrip: new 5th "Last commit" cell — relative time via date-fns formatDistanceToNowStrict, ember sha7 + "on main" sub with message tooltip; grid now lg:grid-cols-5; graceful "fetching from GitHub…" state during rate limits (verified live — GitHub was 403 during QA and UI degraded gracefully).
- CTA: inline success panel after subscribing (green "You're on the list" + "Add another" reset); new "Copy link" share button (clipboard + toast) next to Star on GitHub / Join the Discord.
- Footer: data-freshness line with Radio icon — "Live from GitHub API · release v3.0.2 · <date>" or "Serving cached data — refreshes automatically".

Work Log — Styling/micro-interactions:
- Marquee pause-on-hover: `.marquee-hover-pause:hover > .animate-marquee` utility in globals.css (Tailwind 4 arbitrary `hover:[animation-play-state:paused]` silently failed to compile — replaced with real CSS rule; verified computed style "paused" on hover).
- Navbar links: animated ember underline on hover (after: pseudo, origin-left scale-x).
- Stats cells: hover bg tint.
- BackToTop moved to bottom-24 to clear the toast stack.

Work Log — Bugs found & fixed:
- Tailwind arbitrary hover:animation-play-state class not compiling → replaced with globals.css utility (verified in browser).
- DB cleanup: removed 1 QA subscriber so counters start at 0.

Verification:
- bun run lint clean; page 200; browser-verified: 5-cell strip renders with graceful fallbacks, subscribe inline success + reset works, copy-link works, marquee pauses on hover, footer freshness line shows cached state, zero console/page errors.

Stage Summary:
- Site gained live commit signal, honest rate-limit UX, share affordances, and finer micro-interactions.
- metadataBase placeholder note from R1 still stands (set real domain at deploy).

Unresolved / next-phase recommendations (priority order):
1. When deploy domain known: update metadataBase in layout.tsx.
2. Optional: GITHUB_TOKEN env for higher rate limits; per-release download chart once data is non-trivial; i18n ID/EN; Discord community wall.
3. Continue accessibility pass (focus-visible ring tuning on custom chips/buttons).

---
Task ID: R3-a
Agent: full-stack-developer
Task: EN/ID bilingual toggle (i18n)

Work Log:
- Read worklog.md + mirrored the proven useSyncExternalStore pattern from
  use-platform.ts for the new locale store (hydration-safe: getServerSnapshot
  always returns "en", so SSR markup and the hydration render match; the stored
  preference applies right after hydration with no mismatch).
- Created src/lib/i18n.ts: `type Locale = "en" | "id"`, flat dot-namespaced
  dictionary (nav.*, a11y.*, hero.*, stats.*, hiw.*, features.*, assets.*,
  comparison.*, download.*, changelog.*, faq.*, cta.*, footer.*, palette.*,
  mock.*, type.*, common.*, toast.*) with 208 keys per locale. `const id:
  typeof en` makes TS enforce an identical key set (verified at runtime too:
  208/208, no missing/extra/empty). `translate(locale, key, vars?)` replaces
  `{name}` tokens with fallback chain current dict → en dict → key. Also
  exports `formatNumber(n, locale)` (Intl, id-ID/en-US) and `formatDate(iso,
  locale)` for short dates ("Oct 13, 2026" / "13 Okt 2026").
- Created src/hooks/use-locale.ts: module-level `locale` + listener Set,
  subscribe/getSnapshot/getServerSnapshot; client init reads localStorage key
  "vs-locale" (try/catch guarded) and falls back to navigator.language
 .startsWith("id"); `setLocale` clamps, persists, notifies; `useLocale()`
  returns { locale, setLocale, t } with t memoized via useCallback on locale.
- navbar.tsx: added LocaleSwitcher — desktop compact segmented control (EN|ID,
  h-9 chip matching the GitHub/theme chip language, ember highlight
  bg-primary/15 + inset ring for the active segment, aria-pressed) next to the
  theme toggle; mobile menu row with Globe icon + static bilingual "Language /
  Bahasa" label + the same switcher. Group aria-label is a single static
  bilingual string "Switch language · Ganti bahasa" (identical in both locales
  by design). Translated all nav links, search chip, menu labels, aria-labels.
- Translated every site component to t() calls: hero (headline uses **…
  ** markers in hero.title so the highlighted span + word order can differ per
  locale; download label interpolates the detected platform via
  PLATFORM_META), stats-strip (CountUp now locale-aware via formatNumber;
  commit relative time uses date-fns locale: `import { enUS, id as
  dateFnsId } from "date-fns/locale"`, `formatDistanceToNowStrict(...,
  { addSuffix: true, locale: locale === "id" ? dateFnsId : enUS })`;
  release dates via formatDate), how-it-works, features, asset-types
  (marquee + sr-only + hover title), comparison (5 rows), download (cards,
  Detected badge, unsigned-build note, quickstart copy/toasts), changelog
  (Latest badge, dates, view-release link), faq (all 6 Q&A rebuilt as
  t()-segments preserving inline links/<code> blocks; item keys now index-based
  so switching locale doesn't remount the accordion), cta (form, success
  panel, joined-count with formatted number + singular/plural keys, share
  buttons, all toasts), footer (columns, freshness line, license, trademark
  disclaimer), command-palette (placeholder, groups, all items; cmdk `value`
  props set to the visible translated label so search keeps working in both
  languages), studio-mock (app-UI chrome only: STUDIO CONNECTED, search
  placeholder, Scan place, Replace all, Place browser, table headers,
  Applied/Queued/Pending statuses, singular type labels, status bar counters
  with formatNumber, tree toggle aria-label), back-to-top.
- page.tsx needed no changes: it only renders components + JSON-LD, and
  JSON-LD/metadata are explicitly out of translation scope.

Stage Summary:
- 208 dictionary keys × 2 locales; files touched: src/lib/i18n.ts (new),
  src/hooks/use-locale.ts (new), and 14 site components (navbar, hero,
  stats-strip, how-it-works, features, asset-types, comparison, download,
  changelog, faq, cta, footer, command-palette, studio-mock, back-to-top).
- Keys pre-wired for the future chart agent: changelog.chartTitle,
  changelog.chartSubtitle, changelog.downloadsUnit.
- Left untranslated on purpose: "ValencyStudio — Spoofer", Roblox/Roblox
  Studio/GitHub/Discord/Luau, "Tauri 2 · Rust · React 19 · Luau", file
  extensions + example filenames, shell commands (git clone/bun install/
  tauri:dev), "⌘K"/"Ctrl K", "rbxassetid://", version numbers, fake instance
  names in the mock (Workspace/Lobby/Guard_Walk…), "you@studio.dev" placeholder,
  © line, "vs-spoofer", "open source", JSON-LD, <html lang>, layout metadata.
  Locale switcher aria-label is a static bilingual literal (not from dict) per
  hydration-safety instruction.
- Fixes made in passing: widened CellProps.sub to React.ReactNode (pre-existing
  tsc error in stats-strip when passing a JSX sub); removed unused imports
  (hero Image, mock FolderClosed).
- Verification: `bun run lint` exit 0 (zero errors/warnings); tsc --noEmit →
  0 errors in src (remaining hits are pre-existing in examples/ + skills/,
  outside the app graph); `curl http://localhost:3000/` → 200 (SSR HTML shows
  EN strings + switcher markup, as designed); dev.log clean, all API routes
  still 200. QA note for browser: switching locale updates the whole page
  instantly without reload; choice persists in localStorage ("vs-locale");
  first-visit Indonesian browsers (navigator.language id*) get ID after
  hydration; SSR always paints EN first by design.

---
Task ID: R3 (cron review round 3)
Agent: orchestrator (Z.ai Code)
Task: Status assessment, QA, EN/ID bilingual site, downloads chart, styling detail pass

Work Log — Assessment:
- Baseline stable at round start (lint clean, page 200, all 4 APIs 200). Chose the two top R1/R2 recommendations as this round's focus: i18n (ID/EN) + per-release downloads chart, plus the mandatory styling detail pass.

Work Log — Backend:
- github.ts: ChangelogRelease gained `downloads` (sum of all asset download_count per release, fetched in the same /releases?per_page=8 call); /api/changelog fallback entries include downloads: 0. Verified live: v3.0.2→5, v2.5.0→53, v2.4.0→35, v2.3.0→11, v2.2.0→32, v2.1.0→10, v2.0.0→6.

Work Log — i18n (delegated, Task R3-a, full-stack-developer):
- src/lib/i18n.ts (NEW): flat dictionary 208 keys × 2 locales (en/id), translate() with {placeholder} interpolation, formatNumber (Intl id-ID/en-US), formatDate (date-fns id locale), `const id: typeof en` compile-time key parity.
- src/hooks/use-locale.ts (NEW): external-store locale (mirrors use-platform.ts) — getServerSnapshot "en" for hydration safety, localStorage "vs-locale", navigator.language id* detection, memoized t() with en-fallback chain.
- 14 site components translated (navbar, hero, stats-strip, how-it-works, features, asset-types, comparison, download, changelog, faq, cta, footer, command-palette, studio-mock, back-to-top). Navbar gained LocaleSwitcher (desktop segmented EN|ID chip + mobile "Language / Bahasa" row with Globe). Palette item values = translated labels so ⌘K search works in both languages. Static bilingual aria-label on switcher (hydration-safe). Brand names/commands/extensions/JSON-LD deliberately untranslated.

Work Log — Downloads chart + platform counts:
- downloads-chart.tsx (NEW): CSS bar chart, oldest→newest, ember gradient bars, framer-motion height reveal, counts above bars, zero-stub for empty releases, role=img + aria-label. Renders when any release has downloads.
- Resilience: useChangelog now persists the last good live response to localStorage ("vs-changelog-cache", 7-day TTL) and serves it flagged `stale` during GitHub rate-limit windows; chart subtitle switches to "last synced data — refreshes automatically" note (new key changelog.cachedNote in both locales). Reason: rate limits are intermittent on this machine and historical release data is immutable.
- Changelog timeline entries show per-release download counts (Download icon + tabular-nums); download cards show per-platform asset download chips when stats.source === "github" (hidden gracefully on fallback).

Work Log — Styling detail pass:
- globals.css: global :focus-visible ring (ember 2px, offset 3px) for consistent a11y focus; .card-hover-glow utility (lift + ember border + soft glow); light-theme contrast bumps (muted-foreground 0.5→0.455, border/input 0.9→0.885).
- section-heading: index hairline upgraded to ember gradient; hero primary CTA: gradient fill + hover lift + stronger shadow; download cards now share card-hover-glow; chart bars brighten on hover; navbar: removed dead `xs:` class.

Work Log — Bugs/incidents:
- Dev server OOM-killed mid-round (kernel log: next-server killed, 2.3GB RSS; 4GB box with headless Chrome + Turbopack). NOT a code bug. Restarted via the official .zscripts/dev.sh; closed agent-browser between phases to keep RAM headroom. Watch for recurrence if QA sessions stay open long.
- Chart initially invisible during QA because GitHub was rate-limited → this drove the localStorage last-good design above.

Verification:
- bun run lint exit 0; tsc clean (via subagent); page 200; all 4 APIs healthy (GET /api/downloads 405 is correct POST-only).
- Browser QA (desktop 1280/1440 + mobile 390): locale switch EN→ID instant; persisted across reload (localStorage vs-locale); hero/download/changelog/faq/cta/footer/palette all translated; hero **highlight splits correctly for ID word order; Indonesian dates (13 Okt 2026) via date-fns id locale; chart renders 8 bars with counts (aria-label "Unduhan per rilis — 152 unduhan"); palette search "unduh" matches translated items; light + dark themes crafted; mobile menu language row works; subscribe end-to-end in ID ("Kamu sudah terdaftar" + TAMBAH LAGI reset); graceful fallbacks verified live (card counts hidden, cached-note path); zero console/page errors.
- DB cleaned: QA subscriber removed, download events 0.

Stage Summary:
- Site is now fully bilingual EN/ID with instant switching + persistence, has a real per-release downloads chart that survives GitHub rate limits via client-side last-good cache, and finer visual detail (focus rings, card glow, contrast, ornaments).
- NOTE: metadataBase placeholder from R1 still stands (set real deploy domain when known).

Unresolved / next-phase recommendations (priority order):
1. OOM risk: 4GB box; avoid keeping browser sessions open across long idle periods; consider `NODE_OPTIONS=--max-old-space-size` if recurrences.
2. Optional: GITHUB_TOKEN env for higher rate limits (would make live data the norm); per-platform download breakdown chart; Discord community wall; testimonial wall.
3. Accessibility: next pass could cover prefers-reduced-motion for marquee/scan-line/chart animations.

---
Task ID: R4-a
Agent: full-stack-developer
Task: GitHub Contributors "community" section (backend + hook + section + wiring)

Work Log:
- Read worklog.md (API contract + R2/R3 conventions: fail-safe github.ts
  cache pattern, t()-based i18n, Reveal/SectionHeading/card-hover-glow usage).
- src/lib/github.ts: exported the module-private `ghFetch<T>()` (behavior
  identical — same headers, Bearer token when GITHUB_TOKEN set, 8s timeout,
  no-store); added raw `GhContributor` interface + exported `Contributor` /
  `ContributorsResult` types; added `contributors` cache key to CACHE_KEYS;
  new `getContributors()` following the exact 10-min-TTL module cache pattern:
  GET /contributors?per_page=12, maps login/avatar_url(→profile .png
  fallback)/html_url/contributions, skips entries without login+html_url,
  totalCommits = Σ listed contributions. ANY failure (rate limit/network/
  parse/204-empty-body) → `{ contributors: [], totalCommits: 0,
  source: "fallback" }`, never throws. Non-positive results ARE cached like
  the other functions (10-min TTL bounds the fallback window).
- src/app/api/contributors/route.ts (NEW): mirrors stats/changelog route
  style (`runtime = "nodejs"`, `dynamic = "force-dynamic"`), GET returns
  NextResponse.json(getContributors()).
- src/hooks/use-site-data.ts: added `FALLBACK_CONTRIBUTORS: ContributorsResult`
  + `useContributors()` mirroring useStats() (queryKey ["contributors"],
  refetchInterval 300_000, returns `contributorsData = query.data ??
  FALLBACK_CONTRIBUTORS`). Type imported from @/lib/github (single source of
  truth for the contract).
- next.config.ts: added images.remotePatterns for
  https://avatars.githubusercontent.com.
- src/components/site/contributors.tsx (NEW): section#community, plain
  background (sits between changelog bg-surface/30 and plain-bg faq —
  rhythm matches). SectionHeading index="06" with contributors.* keys.
  Live branch: grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3/4,
  per-card Reveal delay={i*0.04}; card = <a> rounded-lg border bg-card p-4
  card-hover-glow, next/image avatar 56px unoptimized rounded-full
  ring-1 ring-foreground/10, font-mono login + tabular-nums contributions
  chip text. Footer row: people/commitsTotal mono chips (matches download.tsx
  chip style) + "View all contributors" ArrowUpRight link (matches changelog
  viewRelease link style) → graphs/contributors. Fallback branch
  (source==="fallback" OR empty): Reveal-wrapped CTA card (rounded-lg border
  bg-card/50 p-8 text-center) with ember Users icon square, fallbackTitle/
  fallbackBody, primary Button "Become a contributor" (GitFork icon → /fork)
  + outline Button "View all contributors" (→ graphs/contributors), mono
  readmeHint line. SSR renders the CTA until live data hydrates in.
- src/app/page.tsx: <Contributors /> between <Changelog /> and <Faq />.
- i18n.ts NOT touched: all 12 keys (contributors.* ×11 + a11y.contributors)
  already existed in BOTH en/id dicts; verified at runtime in SSR HTML.
- A11y: grid container aria-label={t("a11y.contributors")}, avatar alt
  `@{login} avatar`, external links rel="noopener noreferrer", next/image
  lazy by default; whole card is one 44px+ touch target on mobile.

Verification:
- bun x tsc --noEmit → 0 errors in src/ (only the 4 pre-existing errors in
  examples/ + skills/, outside the app graph).
- bun run lint → exit 0.
- curl /api/contributors → HTTP 200 `{"contributors":[],"totalCommits":0,
  "source":"fallback"}` — direct GitHub check from this machine returned 403
  (rate-limited, recurring condition per R2/R3), so fail-safe path verified
  live and working. Live path is the same ghFetch pipeline as 4 working
  functions.
- curl / → 200; SSR HTML contains id="community", fallbackTitle, both
  fallback buttons and readmeHint (correct branch for the current rate-limit
  window). dev.log: ✓ Compiled in 255ms, GET /api/contributors 200, no
  errors/warnings.

Stage Summary:
- Site gained a community section honoring contributors, with live
  contributor grid when GitHub is reachable and a never-broken fork CTA when
  rate-limited. API contract: GET /api/contributors →
  { contributors: [{ login, avatarUrl, profileUrl, contributions }],
  totalCommits, source: "github"|"fallback" }.
- Files touched: src/lib/github.ts (ghFetch exported + getContributors),
  src/app/api/contributors/route.ts (new), src/hooks/use-site-data.ts,
  src/components/site/contributors.tsx (new), next.config.ts (remotePatterns),
  src/app/page.tsx.
- Deviation from spec (minor): useContributors() exposes the fallback via
  `contributorsData` (mirroring `stats` in useStats) instead of merging raw
  query fields — same semantics, consistent naming with the existing hook.
  Also added avatar_url→github.com/{login}.png fallback mapping and skipped
  malformed entries for robustness; added GitFork icon on the primary CTA
  button for visual consistency with cta.tsx buttons.
- Unresolved: once a GITHUB_TOKEN env is set (R2/R3 recommendation), the grid
  will be the norm rather than the CTA; remotePatterns added so avatar
  optimization can be enabled later by dropping `unoptimized`.
---
Task ID: R4 (cron review round 4)
Agent: orchestrator (Z.ai Code)
Task: Status assessment, browser QA + bug fixes, contributors section, platform download split, reduced-motion audit, styling detail pass

Work Log — Assessment & QA (agent-browser):
- Baseline healthy at round start: lint exit 0, page 200, all 4 APIs healthy (stats/changelog/subscribe 200, GET /api/downloads 405 = correct POST-only).
- Full-page screenshot sweep + scrolled viewport screenshots (desktop 1280) + mobile 390 + light theme + ID locale. Zero console/page errors throughout.
- BUG FOUND (fixed): desktop navbar links wrapped at 1280px — "How it works" broke onto 3 lines after R3 added the LocaleSwitcher. Fixed by tightening the container (gap-6→gap-4/sm:gap-5), nav-link px-3→px-2.5 + whitespace-nowrap, search chip w-44→w-40. Verified on real screenshots.
- BUG FOUND (fixed): changelog timeline rendered a dangling "— " when a fallback release has publishedAt=null (formatDate returns "—"). Date span now renders only when publishedAt exists.
- BUG FOUND (fixed, latent tsc error): useChangelog() never returned the `stale` flag that DownloadsChart destructured — surfaced as TS2339 on the query-result union. Hook now returns `stale: query.data?.stale ?? false`. tsc src errors 0 after fix.
- PlatformSplit correctly renders nothing while GitHub is rate-limited (source=fallback) — verified via aria-label probe; verified WITH data by mocking /api/stats through `agent-browser network route` (81% Windows / 15% macOS / 4% Linux stacked bar + legend + total chip all correct); mocks unrouted after.
- Contributors live-grid branch verified the same way with a mocked /api/contributors (4 cards, avatars, "4 contributors · 267 commits" chips); fallback CTA branch verified live (GitHub 403). Mocks unrouted; DB still clean (0 subscribers / 0 download events).

Work Log — Features:
- Platform download split (download.tsx): `PlatformSplit` — stacked horizontal bar per-platform asset downloads for the latest release, ember/neutral/emerald segments, framer-motion scaleX reveal (reduced-motion aware), dl legend with counts + %, role=img + a11y.downloadSplit label. Renders only with live GitHub data and non-zero total.
- Contributors/community section (delegated, Task R4-a, full-stack-developer — see its entry above): GET /api/contributors (ghFetch exported, 10-min cache, fail-safe fallback), useContributors hook, contributors.tsx (#community, SectionHeading index 06, live avatar grid w/ card-hover-glow + staggered Reveal, fallback CTA card with Become-a-contributor → /fork), next.config remotePatterns for avatars.githubusercontent.com, wired between Changelog and Faq. FAQ heading index bumped 06→07.
- i18n: 15 new keys added to BOTH dicts (download.splitTitle/splitHint/splitTotal, contributors.* ×11, a11y.contributors, a11y.downloadSplit) — `const id: typeof en` parity holds, tsc clean.
- Reduced-motion audit COMPLETE: Reveal + CountUp + chart bars + split bar all respect useReducedMotion; globals.css @media block now kills looping animations (marquee, scan-line, pulse-dot) and smooth-scroll under prefers-reduced-motion.
- GITHUB_TOKEN support confirmed already present in github.ts (R2) — env var is the lever for making live data the norm on this box.

Work Log — Styling details:
- New `.bg-hatch` utility (45° engineering hatch, foreground @3%) applied to the stats strip with a fade-out mask — subtle texture, no contrast loss.
- Navbar spacing rhythm tightened (see bug fix); community section reuses card-hover-glow + mono chip language for cohesion.

Verification:
- bun run lint exit 0; tsc --noEmit → 0 errors in src/; page 200; /api/contributors 200 (fallback shape verified live); all other APIs still healthy; browser QA desktop 1280 + mobile 390, dark + light, EN + ID — zero console errors; mobile menu (search row, language row, links) works; DB clean.

Stage Summary:
- Site gained a real community signal (contributors grid w/ graceful CTA fallback), an honest per-platform download split, full prefers-reduced-motion coverage, and three bug fixes (navbar wrap, changelog dash, stale-flag type hole).
- metadataBase placeholder still stands (set real deploy domain when known).

Unresolved / next-phase recommendations (priority order):
1. OOM discipline: keep agent-browser sessions short (browser closed at round end; RAM 1.8GB/4GB in use).
2. Set GITHUB_TOKEN env to make live GitHub data the norm (rate limits hit every QA round this time).
3. Optional features: per-platform breakdown over TIME (multi-release stacked chart), Discord community wall, screenshot gallery of the real app, sitemap/robots.ts + OG image route.
4. Accessibility next pass: visible skip-to-content link; audit color contrast of muted text in light theme.
---
Task ID: R5 (cron review round 5)
Agent: orchestrator (Z.ai Code)
Task: Status assessment, browser QA, SEO pack (sitemap/robots/manifest), per-platform stacked downloads chart, skip-link a11y, styling detail pass

Work Log — Assessment & QA:
- Baseline healthy at round start (lint 0, page 200, APIs 200). GitHub was LIVE this round (not rate-limited) — real release data available for verification.
- og.png (1200×630) verified visually — already on-brand; kept static, no dynamic OG route needed.
- No new bugs found this round; one design flaw caught during verification (below).

Work Log — Features:
- SEO pack: src/lib/site.ts (SITE_URL single source of truth — replaces the layout's inline placeholder), src/app/robots.ts (User-Agent * allow / + sitemap ref), src/app/sitemap.ts (weekly, priority 1), src/app/manifest.ts (standalone PWA manifest, dark theme color #101012, icon.png any + app-icon.png maskable). Removed public/robots.txt (conflicted with the app route); metadataBase now imports SITE_URL.
- Per-platform stacked chart over time: github.ts ChangelogRelease gained `platforms {windows,macos,linux}` computed via the existing classifyAsset() (installers only — .rbxmx/.zip/checksums excluded); use-site-data.ts type mirrored; downloads-chart.tsx now stacks ember/neutral/emerald segments bottom→top inside each bar with a WINDOWS/MACOS/LINUX legend and a "stacked by platform" subtitle suffix (new i18n key changelog.byPlatform in EN+ID); falls back to the single ember-gradient bar when any release lacks the breakdown.
- DESIGN FLAW FOUND & FIXED during live-data QA: bar height encodes ALL-asset downloads but segments encoded installer counts → bars rendered mostly empty (e.g. v2.5.0: 53 total but 10 installer downloads). Fix: segments now show the RELATIVE installer share (share/installerSum) so bars always fill; counts above bars remain all-asset totals, consistent with timeline chips; comment in code documents the metric distinction.
- Accessibility: skip-to-content link as first focusable element (static bilingual "Skip to content · Lompat ke konten" — server-component-safe), main#main tabIndex=-1 target; verified on real focus (first Tab shows ember button top-left).

Work Log — Styling details:
- Changelog timeline: latest node gets a soft ember halo; other nodes brighten border on row hover (group/li).
- Contrast bumps: chart zero-labels /50→/65, PlatformSplit % text /60→/75.

Verification:
- bun run lint exit 0; tsc --noEmit 0 src errors (fixed one TS2459 during development: Platform type must import from use-site-data, not use-platform).
- All routes 200: /, /robots.txt (now app-generated with sitemap ref), /sitemap.xml, /manifest.webmanifest (+ auto <link rel="manifest"> in HTML), 3 APIs.
- Browser QA (desktop 1280 + mobile 390, dark): stacked chart verified against LIVE GitHub data — per-bar DOM dump (barPct 11/19/60/21/66/100/0/9 with 100%-fill segments), zero-stub for v3.0.1, legend correct, mobile layout clean; skip link verified; zero console errors; DB clean (0 subscribers / 0 download events).

Stage Summary:
- Site is now indexable (robots/sitemap/manifest), charts show WHERE downloads come from over time, and keyboard users get a visible skip link. Live GitHub data (no token needed this round) validated the stacked chart end-to-end.
- NOTE: SITE_URL in src/lib/site.ts is still the placeholder — set the real deploy domain there (single place) at launch.

Unresolved / next-phase recommendations (priority order):
1. Set real deploy domain in src/lib/site.ts when known (metadataBase + robots + sitemap all follow).
2. GITHUB_TOKEN env still recommended (rate-limit windows return without it).
3. Optional: Discord wall (needs server ID for the widget API), screenshot gallery, JSON feed of releases, "compare versions" tool.
4. A11y next: audit tab order through the command palette (focus trap), prefers-contrast media query.
