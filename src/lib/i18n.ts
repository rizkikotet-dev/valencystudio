/**
 * ValencyStudio — Spoofer launch site: flat EN/ID dictionary.
 *
 * Conventions:
 * - Dot-namespaced keys, grouped by section (nav.*, hero.*, faq.*, ...).
 * - Dynamic values use `{placeholder}` tokens, resolved by `translate()`.
 * - `hero.title` uses `**...**` to mark the highlighted phrase so word order
 *   can differ per locale (split in hero.tsx).
 * - Not translated on purpose: brand names ("ValencyStudio — Spoofer", Roblox,
 *   GitHub, Discord, Luau), file extensions, shell commands, "⌘K", version
 *   numbers, JSON-LD content, `<html lang>`, layout metadata.
 */

export type Locale = "en" | "id";

const en = {
  /* Navbar */
  "nav.howItWorks": "How it works",
  "nav.features": "Features",
  "nav.download": "Download",
  "nav.changelog": "Changelog",
  "nav.faq": "FAQ",
  "nav.search": "Search",
  "nav.searchDots": "Search…",

  /* Accessibility labels */
  "a11y.toggleTheme": "Toggle theme",
  "a11y.openPalette": "Open command palette (Ctrl K)",
  "a11y.openMenu": "Open menu",
  "a11y.closeMenu": "Close menu",
  "a11y.primaryNav": "Primary",
  "a11y.mobileNav": "Mobile",
  "a11y.techStack": "Technology stack",
  "a11y.projectStats": "Project stats",
  "a11y.supportedAssetTypes": "Supported asset types",
  "a11y.copyBuildCommands": "Copy build commands",
  "a11y.transparencyNote": "Build transparency note",
  "a11y.downloadSplit": "Downloads per platform, latest release",
  "a11y.stayUpdated": "Stay updated",
  "a11y.subscribeForm": "Subscribe for updates",
  "a11y.backToTop": "Back to top",
  "a11y.copyReleaseLink": "Copy release link",
  "a11y.toggleNode": "Toggle {name}",

  /* Hero */
  "hero.title":
    "Every asset in your place, **found and replaced** in one pass.",
  "hero.subhead":
    "ValencyStudio — Spoofer connects to a running Roblox Studio session, scans the entire place, and lets you preview and replace animations, sounds, decals, meshes, and videos live — without hunting through instances or editing place files.",
  "hero.latestRelease": "latest release",
  "hero.openSourceBadge": "open source · GPL-3.0",
  "hero.downloadFor": "Download for {platform}",
  "hero.downloadLatest": "Download latest release",
  "hero.viewSource": "View source",
  "hero.microcopy": "Windows · macOS · Linux — free & open source, GPL-3.0",
  "hero.mockCaption":
    "ValencyStudio — Spoofer running against a live Roblox Studio session",

  /* Stats strip */
  "stats.latestRelease": "Latest release",
  "stats.recent": "recent",
  "stats.downloads": "Downloads",
  "stats.viaGithubReleases": "via GitHub releases",
  "stats.countingFromGithub": "counting from GitHub…",
  "stats.lastCommit": "Last commit",
  "stats.onMain": "on main",
  "stats.fetchingFromGithub": "fetching from GitHub…",
  "stats.assetTypes": "Asset types",
  "stats.assetTypesList": "Animations · Sounds · Decals · Meshes · Videos",
  "stats.license": "License",
  "stats.freeOss": "Free and open source",

  /* How it works */
  "hiw.title": "Three steps from install to replacement",
  "hiw.description":
    "The desktop app handles discovery, previews, profiles, and configuration. The companion Luau plugin performs the Studio-side operations — connected over a local bridge.",
  "hiw.step1Title": "Install the app",
  "hiw.step1Body":
    "Download the desktop app for your platform. On first launch it automatically syncs the bundled Studio plugin into your local Roblox Studio plugins directory.",
  "hiw.step1Snippet": "ValencyStudioSpoofer.rbxmx → Studio/plugins",
  "hiw.step2Title": "Connect to Studio",
  "hiw.step2Body":
    "Open a place in Roblox Studio and enable the plugin. The desktop app discovers the running session and keeps itself synchronized with the Studio side.",
  "hiw.step2Snippet": "desktop app ⇄ Luau plugin ⇄ Studio session",
  "hiw.step3Title": "Scan & replace",
  "hiw.step3Body":
    "Run a full place scan, preview every match — R6/R15 animations and audio included — then push replacements while the place is still running.",
  "hiw.step3Snippet": "1,284 instances · 96 matches · applied live",

  /* Features */
  "features.title": "Built for the way you actually ship places",
  "features.description":
    "Discovery, previews, profiles, and replacement configuration live in the desktop app. Studio-side execution happens in the plugin. Everything stays in sync.",
  "features.f1Title": "Full-place replacement",
  "features.f1Body":
    "Replace animations, sounds, decals, meshes, and videos across a complete place scan — applied in real time while Studio is open.",
  "features.f2Title": "Live preview",
  "features.f2Body":
    "Watch R6 and R15 animations and listen to audio assets before you commit a replacement. What you hear and see is what gets applied.",
  "features.f3Title": "Profiles",
  "features.f3Body":
    "Manage Roblox users and groups with isolated profile data. Credentials stay in your operating system's secure storage — never in plain files.",
  "features.f4Title": "Place browser",
  "features.f4Body":
    "Explore the asset tree, inspect instance properties, locate references, and copy asset IDs with a click. The whole place, navigable.",
  "features.f5Title": "Plugin sync",
  "features.f5Body":
    "The bundled Studio plugin is synchronized into supported plugin directories automatically on every launch. No manual installs, no version drift.",
  "features.f6Title": "No place-file surgery",
  "features.f6Body":
    "The app works against the running session through the plugin bridge — no need to manually search instances or modify place files.",

  /* Asset types marquee */
  "assets.animations": "Animations",
  "assets.sounds": "Sounds",
  "assets.decals": "Decals",
  "assets.meshes": "Meshes",
  "assets.videos": "Videos",
  "assets.hoverToPause": "Hover to pause",
  "assets.srOnly": "Supports animations, sounds, decals, meshes, and videos.",

  /* Comparison */
  "comparison.eyebrow": "Comparison",
  "comparison.title": "Manual work vs. one pass",
  "comparison.description":
    "The same replacement job, two ways. Everything on the right maps to a real feature — nothing invented.",
  "comparison.manualHeader": "Doing it by hand",
  "comparison.valencyHeader": "With ValencyStudio — Spoofer",
  "comparison.r1Manual":
    "Hunt through the Explorer tree and open every instance to find asset IDs",
  "comparison.r1Valency":
    "One full place scan discovers every animation, sound, decal, mesh, and video",
  "comparison.r2Manual":
    "Copy-paste new IDs into dozens of properties, one instance at a time",
  "comparison.r2Valency":
    "Pick the replacement once — apply it to every match in the place",
  "comparison.r3Manual": "Swap blind and hope the new asset looks right in game",
  "comparison.r3Valency":
    "Preview R6/R15 animations and listen to audio before committing",
  "comparison.r4Manual":
    "Reconfigure everything from scratch after each reupload",
  "comparison.r4Valency":
    "Profiles keep Roblox users and groups isolated with saved settings",
  "comparison.r5Manual":
    "Missed references surface later, in playtests — or in production",
  "comparison.r5Valency":
    "The place browser locates references and lets you copy any asset ID",

  /* Download section */
  "download.title": "Get ValencyStudio — Spoofer",
  "download.description":
    "Free and open source under GPL-3.0. Download the latest build for your platform — the Roblox Studio plugin (ValencyStudioSpoofer.rbxmx) is included with every release and syncs itself on first launch.",
  "download.detected": "Detected",
  "download.platformBuild": "{platform} build",
  "download.downloadFile": "Download {ext}",
  "download.buildFromSourceNote":
    "build from source — requires Rust + Bun + Node.js 20",
  "download.unsignedTitle": "Unsigned builds — read before installing",
  "download.unsignedBody":
    "Windows Defender and other antivirus software may flag unsigned builds. ValencyStudio — Spoofer is not currently code signed. Builds can be independently verified by compiling the project from source.",
  "download.compileFromSource": "Compile from source",
  "download.allReleases": "All releases",
  "download.assetDownloads": "{count} downloads",
  "download.splitTitle": "Download split",
  "download.splitHint": "Per-platform asset downloads for {tag}",
  "download.splitTotal": "{count} total downloads",

  /* Changelog */
  "changelog.title": "Release history",
  "changelog.description":
    "Pulled live from GitHub releases. The Studio plugin ships inside every desktop release, so one download always matches one plugin version.",
  "changelog.latest": "Latest",
  "changelog.viewRelease": "View release",
  "changelog.copyLink": "Copy link",
  "changelog.linkCopied": "Release link copied to clipboard",
  "changelog.copyFailed": "Couldn't copy the link",
  "changelog.chartTitle": "Downloads by release",
  "changelog.chartSubtitle":
    "All-time asset downloads across the last 8 releases",
  "changelog.downloadsUnit": "downloads",
  "changelog.byPlatform": "stacked by platform",
  "changelog.cachedNote": "last synced data — refreshes automatically",

  /* Contributors / community */
  "contributors.eyebrow": "Community",
  "contributors.title": "Built in the open",
  "contributors.description":
    "ValencyStudio — Spoofer is GPL-3.0 and developed in public. These are the people behind the commits — code, docs, and bug reports all count.",
  "contributors.contributions": "{count} contributions",
  "contributors.commitsTotal": "{count} commits",
  "contributors.people": "{count} contributors",
  "contributors.viewAll": "View all contributors",
  "contributors.becomeOne": "Become a contributor",
  "contributors.fallbackTitle": "Shaped by its community",
  "contributors.fallbackBody":
    "Contributor data is unavailable right now — the repository, issues, and discussions are always open. Start with a bug report or a docs patch.",
  "contributors.readmeHint": "See CONTRIBUTING in the repo for the full guide",
  "a11y.contributors": "Contributor list",

  /* FAQ */
  "faq.title": "Questions, answered honestly",
  "faq.description":
    "Straight answers — including the awkward ones about unsigned builds.",
  "faq.q1": "Is ValencyStudio — Spoofer free?",
  "faq.a1a": "Yes. The project is open source under the",
  "faq.a1l1": "GPL-3.0 license",
  "faq.a1b": ". You can grab prebuilt binaries from the",
  "faq.a1l2": "releases page",
  "faq.a1c": " or compile it yourself from source.",
  "faq.q2": "Why does my antivirus flag the installer?",
  "faq.a2":
    "Windows Defender and other antivirus software may flag unsigned builds — ValencyStudio — Spoofer is not currently code signed. The builds can be independently verified by compiling the project directly from source. Nothing is hidden in the repository.",
  "faq.q3": "Which platforms are supported?",
  "faq.a3a": "Windows (",
  "faq.a3b": "), macOS (",
  "faq.a3c": "), and Linux (",
  "faq.a3d": "). The Roblox Studio plugin, ",
  "faq.a3e":
    ", is included with every release and is synced into your local Studio plugins directory automatically when the app starts.",
  "faq.q4": "Does it modify my place file?",
  "faq.a4":
    "No manual place-file editing is required. The desktop app connects to a running Roblox Studio session through the companion Luau plugin and performs replacements live. Discovery, previews, profiles, and replacement configuration live in the app; the plugin handles Studio-side operations while your place is running.",
  "faq.q5": "Which asset types can be replaced?",
  "faq.a5":
    "Animations, sounds, decals, meshes, and videos. Before applying a replacement you can preview R6 and R15 animations and listen to audio assets, so you know exactly what you are pushing into the place.",
  "faq.q6": "How do I report a bug or request a feature?",
  "faq.a6a": "Use the GitHub issue templates — ",
  "faq.a6l1": "report a bug",
  "faq.a6b": " or ",
  "faq.a6l2": "request a feature",
  "faq.a6c": " — or join the ",
  "faq.a6l3": "Discord community",
  "faq.a6d": ". Maintainers respond on both channels.",

  /* CTA / subscribe */
  "cta.title": "Ship day, shipped to your inbox",
  "cta.body":
    "Get release notes, plugin updates, and new feature announcements for ValencyStudio — Spoofer. No spam, unsubscribe anytime.",
  "cta.successTitle": "You're on the list",
  "cta.successBody": "Watch your inbox for release notes and plugin updates.",
  "cta.addAnother": "Add another",
  "cta.emailLabel": "Email address",
  "cta.subscribe": "Subscribe",
  "cta.joinedOne": "Joined by {count} developer",
  "cta.joinedMany": "Joined by {count} developers",
  "cta.beFirst": "Be among the first on the list",
  "cta.starOnGithub": "Star on GitHub",
  "cta.joinDiscord": "Join the Discord",
  "cta.copyLink": "Copy link",

  /* Footer */
  "footer.description":
    "A desktop asset replacement tool for Roblox Studio. Preview, replace, and push assets across an entire place — without manually editing instances.",
  "footer.resources": "Resources",
  "footer.linkRepo": "GitHub repository",
  "footer.linkReleases": "Releases",
  "footer.linkBug": "Report a bug",
  "footer.linkFeature": "Request a feature",
  "footer.linkDiscord": "Discord community",
  "footer.linkRss": "RSS feed",
  "footer.linkJson": "JSON feed",
  "footer.explore": "Explore",
  "footer.liveFromApi": "Live from GitHub API",
  "footer.cachedData": "Serving cached data — refreshes automatically",
  "footer.releaseMeta": "release {tag} · {date}",
  "footer.disclaimer":
    "Not affiliated with or endorsed by Roblox Corporation. “Roblox” and “Roblox Studio” are trademarks of Roblox Corporation.",

  /* Command palette */
  "palette.description": "Search sections and quick actions",
  "palette.placeholder": "Type a command or search…",
  "palette.noResults": "No results found.",
  "palette.navigate": "Navigate",
  "palette.actions": "Actions",
  "palette.preferences": "Preferences",
  "palette.comparison": "Manual vs ValencyStudio",
  "palette.yourPlatform": "your platform",
  "palette.switchTheme": "Switch to {theme} theme",
  "palette.themeLight": "light",
  "palette.themeDark": "dark",
  "palette.hintNavigate": "navigate",
  "palette.hintSelect": "select",
  "palette.hintClose": "close",

  /* Studio mock (fake app UI chrome) */
  "mock.studioConnected": "STUDIO CONNECTED",
  "mock.searchAssets": "Search assets…",
  "mock.scanPlace": "Scan place",
  "mock.replaceAll": "Replace all",
  "mock.placeBrowser": "Place browser",
  "mock.type": "Type",
  "mock.currentId": "Current ID",
  "mock.newId": "New ID",
  "mock.status": "Status",
  "mock.statusApplied": "Applied",
  "mock.statusQueued": "Queued",
  "mock.statusPending": "Pending",
  "mock.instancesScanned": "{count} instances scanned",
  "mock.assetsMatched": "{count} assets matched",
  "mock.scanTook": "scan took {time}",
  "mock.bridgeActive": "plugin bridge active",

  /* Singular asset type names (studio mock labels) */
  "type.animation": "Animation",
  "type.sound": "Sound",
  "type.decal": "Decal",
  "type.mesh": "Mesh",
  "type.video": "Video",

  /* Shared bits */
  "common.copy": "Copy",
  "common.copied": "Copied",

  /* Toasts */
  "toast.copiedToClipboard": "Copied to clipboard",
  "toast.pasteToBuild": "Paste it in your terminal to build from source.",
  "toast.clipboardError": "Couldn't access the clipboard.",
  "toast.openingDownload": "Opening the {platform} download…",
  "toast.releaseIncludesPlugin":
    "Every release ships with the Studio plugin included.",
  "toast.onTheList": "You're on the list.",
  "toast.onTheListDesc":
    "Release notes and plugin updates will land in your inbox.",
  "toast.linkCopied": "Link copied",
  "toast.linkCopiedDesc": "Share it with your studio team.",
  "toast.invalidEmail": "Please enter a valid email address.",
  "toast.genericError": "Something went wrong. Try again.",
};

/** `typeof en` on `id` makes the compiler enforce an identical key set. */
const id: typeof en = {
  /* Navbar */
  "nav.howItWorks": "Cara kerja",
  "nav.features": "Fitur",
  "nav.download": "Unduh",
  "nav.changelog": "Changelog",
  "nav.faq": "FAQ",
  "nav.search": "Cari",
  "nav.searchDots": "Cari…",

  /* Accessibility labels */
  "a11y.toggleTheme": "Ganti tema",
  "a11y.openPalette": "Buka command palette (Ctrl K)",
  "a11y.openMenu": "Buka menu",
  "a11y.closeMenu": "Tutup menu",
  "a11y.primaryNav": "Navigasi utama",
  "a11y.mobileNav": "Menu seluler",
  "a11y.techStack": "Teknologi yang digunakan",
  "a11y.projectStats": "Statistik proyek",
  "a11y.supportedAssetTypes": "Jenis aset yang didukung",
  "a11y.copyBuildCommands": "Salin perintah build",
  "a11y.transparencyNote": "Catatan transparansi build",
  "a11y.downloadSplit": "Unduhan per platform, rilis terbaru",
  "a11y.stayUpdated": "Dapatkan info terbaru",
  "a11y.subscribeForm": "Berlangganan pembaruan",
  "a11y.backToTop": "Kembali ke atas",
  "a11y.copyReleaseLink": "Salin tautan rilis",
  "a11y.toggleNode": "Buka/tutup {name}",

  /* Hero */
  "hero.title":
    "Setiap aset di place kamu, **ditemukan dan diganti** dalam sekali jalan.",
  "hero.subhead":
    "ValencyStudio — Spoofer terhubung ke sesi Roblox Studio yang sedang berjalan, memindai seluruh place, dan memungkinkan kamu mempratinjau serta mengganti animasi, suara, decal, mesh, dan video secara langsung — tanpa harus berburu di antara instance atau mengedit file place.",
  "hero.latestRelease": "rilis terbaru",
  "hero.openSourceBadge": "open source · GPL-3.0",
  "hero.downloadFor": "Unduh untuk {platform}",
  "hero.downloadLatest": "Unduh rilis terbaru",
  "hero.viewSource": "Lihat source",
  "hero.microcopy": "Windows · macOS · Linux — gratis & open source, GPL-3.0",
  "hero.mockCaption":
    "ValencyStudio — Spoofer berjalan di atas sesi Roblox Studio yang aktif",

  /* Stats strip */
  "stats.latestRelease": "Rilis terbaru",
  "stats.recent": "baru-baru ini",
  "stats.downloads": "Unduhan",
  "stats.viaGithubReleases": "via rilis GitHub",
  "stats.countingFromGithub": "menghitung dari GitHub…",
  "stats.lastCommit": "Commit terakhir",
  "stats.onMain": "di main",
  "stats.fetchingFromGithub": "mengambil dari GitHub…",
  "stats.assetTypes": "Jenis aset",
  "stats.assetTypesList": "Animasi · Suara · Decal · Mesh · Video",
  "stats.license": "Lisensi",
  "stats.freeOss": "Gratis dan open source",

  /* How it works */
  "hiw.title": "Tiga langkah dari install hingga penggantian",
  "hiw.description":
    "Aplikasi desktop menangani penemuan aset, pratinjau, profil, dan konfigurasi. Plugin Luau pendamping menjalankan operasi di sisi Studio — terhubung lewat bridge lokal.",
  "hiw.step1Title": "Install aplikasi",
  "hiw.step1Body":
    "Unduh aplikasi desktop untuk platform kamu. Saat pertama dijalankan, plugin Studio bawaan otomatis disinkronkan ke direktori plugin Roblox Studio lokal kamu.",
  "hiw.step1Snippet": "ValencyStudioSpoofer.rbxmx → Studio/plugins",
  "hiw.step2Title": "Hubungkan ke Studio",
  "hiw.step2Body":
    "Buka sebuah place di Roblox Studio dan aktifkan pluginnya. Aplikasi desktop akan menemukan sesi yang berjalan dan selalu tersinkron dengan sisi Studio.",
  "hiw.step2Snippet": "aplikasi desktop ⇄ plugin Luau ⇄ sesi Studio",
  "hiw.step3Title": "Pindai & ganti",
  "hiw.step3Body":
    "Jalankan pemindaian place menyeluruh, pratinjau setiap kecocokan — termasuk animasi R6/R15 dan audio — lalu terapkan penggantinya saat place masih berjalan.",
  "hiw.step3Snippet": "1.284 instance · 96 kecocokan · diterapkan langsung",

  /* Features */
  "features.title": "Dibangun untuk cara kamu benar-benar menyelesaikan place",
  "features.description":
    "Penemuan aset, pratinjau, profil, dan konfigurasi penggantian ada di aplikasi desktop. Eksekusi di sisi Studio terjadi di plugin. Semuanya tetap tersinkron.",
  "features.f1Title": "Penggantian seluruh place",
  "features.f1Body":
    "Ganti animasi, suara, decal, mesh, dan video dalam satu pemindaian place menyeluruh — diterapkan secara real time selama Studio terbuka.",
  "features.f2Title": "Pratinjau langsung",
  "features.f2Body":
    "Tonton animasi R6 dan R15 serta dengarkan audionya sebelum menerapkan penggantian. Apa yang kamu lihat dan dengar itulah yang diterapkan.",
  "features.f3Title": "Profil",
  "features.f3Body":
    "Kelola user dan grup Roblox dengan data profil yang terisolasi. Kredensial tersimpan di secure storage sistem operasi — tidak pernah di file biasa.",
  "features.f4Title": "Peramban place",
  "features.f4Body":
    "Jelajahi pohon aset, periksa properti instance, temukan referensi, dan salin ID aset sekali klik. Seluruh place bisa dinavigasi.",
  "features.f5Title": "Sinkronisasi plugin",
  "features.f5Body":
    "Plugin Studio bawaan otomatis disinkronkan ke direktori plugin yang didukung setiap kali aplikasi dijalankan. Tanpa install manual, tanpa perbedaan versi.",
  "features.f6Title": "Tanpa modifikasi file place",
  "features.f6Body":
    "Aplikasi bekerja pada sesi yang sedang berjalan lewat bridge plugin — tidak perlu mencari instance secara manual atau memodifikasi file place.",

  /* Asset types marquee */
  "assets.animations": "Animasi",
  "assets.sounds": "Suara",
  "assets.decals": "Decal",
  "assets.meshes": "Mesh",
  "assets.videos": "Video",
  "assets.hoverToPause": "Arahkan kursor untuk jeda",
  "assets.srOnly": "Mendukung animasi, suara, decal, mesh, dan video.",

  /* Comparison */
  "comparison.eyebrow": "Perbandingan",
  "comparison.title": "Kerja manual vs. sekali jalan",
  "comparison.description":
    "Pekerjaan penggantian yang sama, dua cara. Semua di kolom kanan merujuk ke fitur nyata — tidak ada yang dibuat-buat.",
  "comparison.manualHeader": "Cara manual",
  "comparison.valencyHeader": "Dengan ValencyStudio — Spoofer",
  "comparison.r1Manual":
    "Buru-buru lewat pohon Explorer dan buka setiap instance untuk mencari ID aset",
  "comparison.r1Valency":
    "Satu pemindaian place menyeluruh menemukan setiap animasi, suara, decal, mesh, dan video",
  "comparison.r2Manual":
    "Copy-paste ID baru ke puluhan properti, satu instance per waktu",
  "comparison.r2Valency":
    "Pilih penggantinya sekali — terapkan ke setiap kecocokan di place",
  "comparison.r3Manual":
    "Tukar buta dan berharap aset barunya terlihat pas di dalam game",
  "comparison.r3Valency":
    "Pratinjau animasi R6/R15 dan dengarkan audio sebelum diterapkan",
  "comparison.r4Manual":
    "Atur ulang semuanya dari nol setiap kali reupload",
  "comparison.r4Valency":
    "Profil menjaga user dan grup Roblox tetap terisolasi dengan pengaturan tersimpan",
  "comparison.r5Manual":
    "Referensi yang terlewat baru muncul saat playtest — atau di production",
  "comparison.r5Valency":
    "Peramban place menemukan referensi dan memungkinkan kamu menyalin ID aset apa pun",

  /* Download section */
  "download.title": "Dapatkan ValencyStudio — Spoofer",
  "download.description":
    "Gratis dan open source di bawah lisensi GPL-3.0. Unduh build terbaru untuk platform kamu — plugin Roblox Studio (ValencyStudioSpoofer.rbxmx) disertakan di setiap rilis dan menyiapkan dirinya sendiri saat pertama dijalankan.",
  "download.detected": "Terdeteksi",
  "download.platformBuild": "Build {platform}",
  "download.downloadFile": "Unduh {ext}",
  "download.buildFromSourceNote":
    "build dari source — butuh Rust + Bun + Node.js 20",
  "download.unsignedTitle": "Build tanpa tanda tangan — baca dulu sebelum install",
  "download.unsignedBody":
    "Windows Defender dan antivirus lain bisa menandai build tanpa tanda tangan. ValencyStudio — Spoofer saat ini belum di-code sign. Build dapat diverifikasi secara independen dengan mengompilasi proyek dari source.",
  "download.compileFromSource": "Kompilasi dari source",
  "download.allReleases": "Semua rilis",
  "download.assetDownloads": "{count} unduhan",
  "download.splitTitle": "Distribusi unduhan",
  "download.splitHint": "Unduhan aset per platform untuk {tag}",
  "download.splitTotal": "total {count} unduhan",

  /* Changelog */
  "changelog.title": "Riwayat rilis",
  "changelog.description":
    "Diambil langsung dari rilis GitHub. Plugin Studio disertakan di setiap rilis desktop, jadi satu unduhan selalu cocok dengan satu versi plugin.",
  "changelog.latest": "Terbaru",
  "changelog.viewRelease": "Lihat rilis",
  "changelog.copyLink": "Salin tautan",
  "changelog.linkCopied": "Tautan rilis disalin ke papan klip",
  "changelog.copyFailed": "Tautan gagal disalin",
  "changelog.chartTitle": "Unduhan per rilis",
  "changelog.chartSubtitle": "Total unduhan aset di 8 rilis terakhir",
  "changelog.downloadsUnit": "unduhan",
  "changelog.byPlatform": "bertumpuk per platform",
  "changelog.cachedNote": "data tersinkron terakhir — diperbarui otomatis",

  /* Kontributor / komunitas */
  "contributors.eyebrow": "Komunitas",
  "contributors.title": "Dibangun secara terbuka",
  "contributors.description":
    "ValencyStudio — Spoofer berlisensi GPL-3.0 dan dikembangkan secara publik. Inilah orang-orang di balik setiap commit — kode, dokumentasi, dan laporan bug sama-sama berarti.",
  "contributors.contributions": "{count} kontribusi",
  "contributors.commitsTotal": "{count} commit",
  "contributors.people": "{count} kontributor",
  "contributors.viewAll": "Lihat semua kontributor",
  "contributors.becomeOne": "Jadi kontributor",
  "contributors.fallbackTitle": "Dibentuk oleh komunitasnya",
  "contributors.fallbackBody":
    "Data kontributor sedang tidak tersedia — repositori, issue, dan diskusi selalu terbuka. Mulai dari laporan bug atau perbaikan dokumentasi.",
  "contributors.readmeHint": "Lihat CONTRIBUTING di repositori untuk panduan lengkap",
  "a11y.contributors": "Daftar kontributor",

  /* FAQ */
  "faq.title": "Pertanyaan, dijawab dengan jujur",
  "faq.description":
    "Jawaban lugas — termasuk yang kurang nyaman soal build tanpa tanda tangan.",
  "faq.q1": "Apakah ValencyStudio — Spoofer gratis?",
  "faq.a1a": "Ya. Proyek ini open source di bawah",
  "faq.a1l1": "lisensi GPL-3.0",
  "faq.a1b": ". Kamu bisa mengunduh binari siap pakai dari",
  "faq.a1l2": "halaman rilis",
  "faq.a1c": " atau kompilasi sendiri dari source.",
  "faq.q2": "Kenapa antivirus saya menandai installer-nya?",
  "faq.a2":
    "Windows Defender dan antivirus lain bisa menandai build tanpa tanda tangan — ValencyStudio — Spoofer saat ini belum di-code sign. Build dapat diverifikasi secara independen dengan mengompilasi proyek langsung dari source. Tidak ada yang disembunyikan di repositorinya.",
  "faq.q3": "Platform apa saja yang didukung?",
  "faq.a3a": "Windows (",
  "faq.a3b": "), macOS (",
  "faq.a3c": "), dan Linux (",
  "faq.a3d": "). Plugin Roblox Studio, ",
  "faq.a3e":
    ", disertakan di setiap rilis dan otomatis disinkronkan ke direktori plugin Studio lokal kamu saat aplikasi dijalankan.",
  "faq.q4": "Apakah file place saya ikut dimodifikasi?",
  "faq.a4":
    "Tidak perlu mengedit file place secara manual. Aplikasi desktop terhubung ke sesi Roblox Studio yang berjalan lewat plugin Luau pendamping dan melakukan penggantian secara langsung. Penemuan aset, pratinjau, profil, dan konfigurasi penggantian ada di aplikasi; plugin menangani operasi di sisi Studio selama place kamu berjalan.",
  "faq.q5": "Jenis aset apa saja yang bisa diganti?",
  "faq.a5":
    "Animasi, suara, decal, mesh, dan video. Sebelum menerapkan penggantian, kamu bisa mempratinjau animasi R6 dan R15 serta mendengarkan audionya, jadi kamu tahu persis apa yang kamu masukkan ke place.",
  "faq.q6": "Bagaimana cara melaporkan bug atau mengusulkan fitur?",
  "faq.a6a": "Gunakan template issue GitHub — ",
  "faq.a6l1": "laporkan bug",
  "faq.a6b": " atau ",
  "faq.a6l2": "usulkan fitur",
  "faq.a6c": " — atau gabung ke ",
  "faq.a6l3": "komunitas Discord",
  "faq.a6d": ". Maintainer merespons di kedua saluran tersebut.",

  /* CTA / subscribe */
  "cta.title": "Hari rilis, langsung ke inbox kamu",
  "cta.body":
    "Dapatkan catatan rilis, pembaruan plugin, dan pengumuman fitur baru untuk ValencyStudio — Spoofer. Tanpa spam, berhenti berlangganan kapan saja.",
  "cta.successTitle": "Kamu sudah terdaftar",
  "cta.successBody":
    "Pantau inbox kamu untuk catatan rilis dan pembaruan plugin.",
  "cta.addAnother": "Tambah lagi",
  "cta.emailLabel": "Alamat email",
  "cta.subscribe": "Berlangganan",
  "cta.joinedOne": "Sudah {count} developer bergabung",
  "cta.joinedMany": "Sudah {count} developer bergabung",
  "cta.beFirst": "Jadilah salah satu yang pertama di daftar",
  "cta.starOnGithub": "Star di GitHub",
  "cta.joinDiscord": "Gabung ke Discord",
  "cta.copyLink": "Salin tautan",

  /* Footer */
  "footer.description":
    "Aplikasi desktop pengganti aset untuk Roblox Studio. Pratinjau, ganti, dan terapkan aset di seluruh place — tanpa mengedit instance secara manual.",
  "footer.resources": "Sumber daya",
  "footer.linkRepo": "Repositori GitHub",
  "footer.linkReleases": "Rilis",
  "footer.linkBug": "Laporkan bug",
  "footer.linkFeature": "Usulkan fitur",
  "footer.linkDiscord": "Komunitas Discord",
  "footer.linkRss": "Feed RSS",
  "footer.linkJson": "Feed JSON",
  "footer.explore": "Jelajahi",
  "footer.liveFromApi": "Langsung dari API GitHub",
  "footer.cachedData": "Menyajikan data cache — diperbarui otomatis",
  "footer.releaseMeta": "rilis {tag} · {date}",
  "footer.disclaimer":
    "Tidak berafiliasi dengan maupun didukung oleh Roblox Corporation. “Roblox” dan “Roblox Studio” adalah merek dagang milik Roblox Corporation.",

  /* Command palette */
  "palette.description": "Cari bagian dan aksi cepat",
  "palette.placeholder": "Ketik perintah atau cari…",
  "palette.noResults": "Tidak ada hasil.",
  "palette.navigate": "Navigasi",
  "palette.actions": "Aksi",
  "palette.preferences": "Preferensi",
  "palette.comparison": "Manual vs ValencyStudio",
  "palette.yourPlatform": "platform kamu",
  "palette.switchTheme": "Ganti ke tema {theme}",
  "palette.themeLight": "terang",
  "palette.themeDark": "gelap",
  "palette.hintNavigate": "navigasi",
  "palette.hintSelect": "pilih",
  "palette.hintClose": "tutup",

  /* Studio mock (fake app UI chrome) */
  "mock.studioConnected": "STUDIO TERHUBUNG",
  "mock.searchAssets": "Cari aset…",
  "mock.scanPlace": "Pindai place",
  "mock.replaceAll": "Ganti semua",
  "mock.placeBrowser": "Peramban place",
  "mock.type": "Tipe",
  "mock.currentId": "ID saat ini",
  "mock.newId": "ID baru",
  "mock.status": "Status",
  "mock.statusApplied": "Diterapkan",
  "mock.statusQueued": "Di antrean",
  "mock.statusPending": "Menunggu",
  "mock.instancesScanned": "{count} instance dipindai",
  "mock.assetsMatched": "{count} aset cocok",
  "mock.scanTook": "pemindaian selesai dalam {time}",
  "mock.bridgeActive": "bridge plugin aktif",

  /* Singular asset type names (studio mock labels) */
  "type.animation": "Animasi",
  "type.sound": "Suara",
  "type.decal": "Decal",
  "type.mesh": "Mesh",
  "type.video": "Video",

  /* Shared bits */
  "common.copy": "Salin",
  "common.copied": "Tersalin",

  /* Toasts */
  "toast.copiedToClipboard": "Tersalin ke clipboard",
  "toast.pasteToBuild": "Tempel di terminal kamu untuk build dari source.",
  "toast.clipboardError": "Tidak bisa mengakses clipboard.",
  "toast.openingDownload": "Membuka unduhan {platform}…",
  "toast.releaseIncludesPlugin":
    "Setiap rilis sudah menyertakan plugin Studio.",
  "toast.onTheList": "Kamu sudah terdaftar.",
  "toast.onTheListDesc":
    "Catatan rilis dan pembaruan plugin akan masuk ke inbox kamu.",
  "toast.linkCopied": "Tautan tersalin",
  "toast.linkCopiedDesc": "Bagikan dengan tim studio kamu.",
  "toast.invalidEmail": "Masukkan alamat email yang valid.",
  "toast.genericError": "Terjadi kesalahan. Coba lagi.",
};

export const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  id,
};

/**
 * Look up `key` in the locale dictionary with fallback chain:
 * current locale → English → the key itself. `{name}` tokens in the string
 * are replaced with entries from `vars`.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  let str = dict[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.split(`{${name}}`).join(String(value));
    }
  }
  return str;
}

/** Locale-aware number formatting (1,234 vs 1.234). */
export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(n);
}

/** Locale-aware short date ("Oct 13, 2026" vs "13 Okt 2026"); "—" when invalid. */
export function formatDate(
  iso: string | null | undefined,
  locale: Locale
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
