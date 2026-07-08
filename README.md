# VALENCY STUDIO

> **Konversi & Upload Audio ke Roblox** — By V.I.O.R

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.11-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Web app untuk mengekstrak audio dari YouTube / SoundCloud, memprosesnya dengan efek (speed, pitch, amplifikasi), dan meng-upload langsung ke Roblox via **Open Cloud API** — lengkap dengan sistem bypass anti-deteksi hak cipta.

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| **🎵 Multi-Source** | Tambah audio dari YouTube, SoundCloud, atau upload file (MP3, WAV, M4A, OGG, FLAC, AAC, WebM, Opus) |
| **⏩ Batch Processing** | Pilih banyak audio, proses sekali jalan dengan efek seragam |
| **🎛️ Efek Audio** | Speed (0.25x–4x), Pitch (±12 semitone), Volume (±20 dB) |
| **🛡️ Bypass Presets** | Preset rekomendasi (Pitch +2, Speed 1.08x, Nightcore, dll) untuk hindari deteksi copyright Roblox |
| **☁️ Upload Roblox** | Upload langsung ke akun Roblox via Open Cloud API |
| **⏳ Auto Polling** | Polling otomatis status operation + moderasi asset |
| **📜 Riwayat** | Semua aktivasi tersimpan di SQLite, status moderasi terpantau |
| **🍪 Cookie Support** | Support Netscape cookies.txt untuk bypass "not a bot" YouTube |

---

## Arsitektur

```
valencystudio/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Halaman utama (hero + 3 kolom grid)
│   │   ├── layout.tsx                # Root layout + metadata
│   │   ├── globals.css               # Tailwind + CSS variables
│   │   └── api/
│   │       ├── audio/
│   │       │   ├── extract/route.ts  # Ekstrak audio dari YT/SC/file
│   │       │   ├── process/route.ts  # Proses audio dgn ffmpeg
│   │       │   └── file/route.ts     # Stream file audio
│   │       ├── roblox/
│   │       │   ├── upload/route.ts   # Upload asset via Open Cloud
│   │       │   ├── status/route.ts   # Poll operation & moderasi
│   │       │   └── verify/route.ts   # Verifikasi API Key + UserID
│   │       └── history/route.ts      # CRUD riwayat upload
│   ├── components/
│   │   ├── source-input.tsx          # Input multi-source
│   │   ├── bypass-recommendations.tsx# Preset bypass anti-deteksi
│   │   ├── preview-list.tsx          # List audio + waveform + checkbox
│   │   ├── processing-panel.tsx      # Slider speed/pitch/vol + batch
│   │   ├── roblox-panel.tsx          # Auth + upload + polling
│   │   ├── history-list.tsx          # Riwayat + status moderasi
│   │   ├── waveform-player.tsx       # Player audio dgn waveform
│   │   └── theme-provider.tsx        # Dark/light mode
│   │   └── theme-toggle.tsx
│   └── lib/
│       ├── audio-processor.ts        # yt-dlp extract + ffmpeg process
│       ├── roblox-api.ts             # Open Cloud API client
│       ├── store.ts                  # Zustand client state
│       ├── db.ts                     # Prisma singleton
│       └── utils.ts                  # cn() helper
├── prisma/
│   └── schema.prisma                 # SQLite schema
├── scripts/
│   └── check-ytdlp.mjs              # Auto-update yt-dlp
├── mini-services/
│   └── audio-processor/              # Standalone audio processor (opsional)
├── .tmp-audio/                       # Audio files (gitignored)
│   ├── uploads/
│   └── processed/
├── Dockerfile                        # Multi-stage Docker build
├── Caddyfile                         # Reverse proxy config
├── render.yaml                       # Render deploy config
└── package.json
```

---

## Flow Aplikasi

```mermaid
flowchart LR
    A[Input URL YouTube/SoundCloud] --> B[yt-dlp extract MP3]
    C[Upload File Lokal] --> B
    
    B --> D[.tmp-audio/uploads/]
    D --> E[ffmpeg process speed/pitch/vol]
    E --> F[.tmp-audio/processed/]
    
    F --> G[Upload via Roblox Open Cloud API]
    G --> H{Poll Operation}
    H -->|done| I[Get Asset ID]
    H -->|pending| H
    
    I --> J{Poll Moderation}
    J -->|Approved| K[Selesai ✅]
    J -->|Rejected| L[Ditolak ❌]
    J -->|Pending/Reviewing| J
    
    D --> M[Preview + Waveform]
    F --> M
```

---

## Persiapan

### Prasyarat

- [Node.js](https://nodejs.org/) ≥ 18
- [Bun](https://bun.sh/) (runtime & package manager)
- [ffmpeg](https://ffmpeg.org/) (tersedia di PATH)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (binary di root project)

### Instalasi

```bash
# Clone
git clone https://github.com/rizkikotet-dev/valencystudio
cd valencystudio

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push DB schema (buat SQLite db)
bun run db:push
```

### yt-dlp

Download binary dan taruh di root project:

**Windows:** `yt-dlp.exe`  
**Linux/macOS:** `yt-dlp` (executable)

```bash
# Linux
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod a+rx yt-dlp

# Atau gunakan script auto-update (jalan tiap dev/start)
bun run dev  # otomatis check & update
```

### Environment

Buat `.env` di root:

```env
DATABASE_URL="file:./db/prod.db"
```

---

## Menjalankan

```bash
# Development
bun run dev

# Production build
bun run build

# Production start
bun run start
```

Akses di `http://localhost:3000`

---

## API Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/audio/extract` | POST | Ekstrak audio dari URL YT/SC atau upload file (multipart) |
| `/api/audio/process` | POST | Proses audio dengan efek (speed/pitch/amplify) |
| `/api/audio/file` | GET | Stream file audio (range support) |
| `/api/roblox/verify` | POST | Verifikasi API Key + User ID Roblox |
| `/api/roblox/upload` | POST | Upload asset audio ke Roblox |
| `/api/roblox/status` | GET | Poll operation / moderation status |
| `/api/history` | GET/POST/PATCH | CRUD riwayat upload |

---

## Roblox Open Cloud API Setup

1. Buka [create.roblox.com/credentials](https://create.roblox.com/credentials)
2. Buat API Key baru dengan scope **Assets (Read+Write)**
3. Masukkan API Key + User ID Roblox di panel **Roblox Upload**
4. Klik **Verify** — app akan fetch profil dan validasi key

> **Catatan:** API Key disimpan hanya di client session (Zustand), tidak dikirim ke server selain ke Roblox API.

### Roblox Studio Normalization Script

Setelah upload, paste script ini di Roblox Studio untuk menormalkan audio yang sudah di-bypass:

```lua
-- Normalkan audio bypass agar terdengar seperti aslinya
local sound = script.Parent

sound.PlaybackSpeed = <dihitung otomatis>
sound.Volume = <dihitung otomatis>
```

App menampilkan script siap-paste di panel processing.

---

## Bypass Presets

| Preset | Speed | Pitch | Volume | Efektivitas |
|--------|-------|-------|--------|-------------|
| Original | 1x | 0 | 0 dB | — |
| Pitch +2 | 1x | +2 st | 0 dB | ⭐ Recommended |
| Pitch -2 | 1x | -2 st | 0 dB | ⭐ Recommended |
| Speed 1.08x | 1.08x | 0 | 0 dB | ⭐ Recommended |
| Pitch +1.5 & Speed 1.05x | 1.05x | +1.5 st | 0 dB | 🎯 Paling efektif |
| Nightcore | 1.25x | +4 st | 0 dB | 🌙 Bypass kuat |
| Subtle Mix | 1.03x | +1 st | +2 dB | ⭐ Recommended |

---

## Deploy

### Docker

```bash
# Build
docker build -t valency-studio .

# Run
docker run -p 3000:3000 -e DATABASE_URL="file:./db/prod.db" valency-studio
```

### Render (render.yaml)

Project siap deploy ke Render via Docker. Konfigurasi di `render.yaml`:
- Region: Singapore
- Disk 1GB untuk SQLite (`/app/prisma/db`)
- Plan: Free

### Caddy (reverse proxy)

`Caddyfile` sudah siap dengan dukungan query parameter `?XTransformPort=` untuk development.

---

## Database

SQLite via Prisma. Schema di `prisma/schema.prisma`:

**Models:**
- `RobloxAccount` — Akun Roblox yang terverifikasi
- `AudioUpload` — Riwayat konversi/upload (source, parameter, status moderasi)

```bash
# Push schema ke DB
bun run db:push

# Migrasi (development)
bun run db:migrate

# Reset DB
bun run db:reset

# Open Prisma Studio
bunx prisma studio
```

---

## Struktur Penyimpanan File

```
.tmp-audio/
├── uploads/       # File hasil ekstrak/upload mentah
└── processed/     # File hasil ffmpeg (siap upload)
```

File otomatis dibersihkan setelah 2 jam (`cleanupOldFiles()`).

---

## Teknologi

| Stack | Pustaka |
|-------|---------|
| **Framework** | Next.js 14 (App Router) |
| **Bahasa** | TypeScript |
| **UI** | Tailwind CSS 4, shadcn/ui (Radix primitives) |
| **Ikon** | Lucide React |
| **State** | Zustand (persist) |
| **Database** | SQLite + Prisma |
| **Audio** | yt-dlp (extract), ffmpeg (process) |
| **Deploy** | Docker, Render |
| **Proxy** | Caddy |
| **Runtime** | Bun |

---

## Pengembangan

```bash
# Lint
bun run lint

# Build
bun run build

# Prisma Studio
bunx prisma studio
```

---

## Lisensi

MIT © V.I.O.R
