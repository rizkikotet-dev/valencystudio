/**
 * Direct audio processor using child_process (ffmpeg + yt-dlp).
 * Files are stored in .tmp-audio/{uploads,processed}.
 *
 * This avoids the need for a separate mini-service, making the app
 * self-contained within the Next.js server.
 */

import { execFile } from "child_process";
import { existsSync, mkdirSync, statSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const TMP_ROOT = join(process.cwd(), ".tmp-audio");
const UPLOAD_DIR = join(TMP_ROOT, "uploads");
const PROCESSED_DIR = join(TMP_ROOT, "processed");

[UPLOAD_DIR, PROCESSED_DIR].forEach((d) => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

const YTDLP = process.platform === "win32" ? "./yt-dlp.exe" : "./yt-dlp";
const FFMPEG = "ffmpeg";
const FFPROBE = "ffprobe";

export interface ExtractResult {
  ok: boolean;
  file: string;
  filePath: string;
  title: string;
  duration: number;
  uploader?: string;
  thumbnail?: string;
  size: number;
  waveform: number[];
  error?: string;
}

export interface ProcessResult {
  ok: boolean;
  file: string;
  filePath: string;
  duration: number;
  size: number;
  waveform: number[];
  error?: string;
}

export interface ProcessOptions {
  inputFile: string; // file name in uploads dir
  speed?: number;
  pitch?: number;
  amplification?: number;
}

/** Build FFmpeg filter chain for audio processing */
function buildFilterChain(opts: Required<Omit<ProcessOptions, "inputFile">>): string {
  const filters: string[] = [];

  if (opts.pitch !== 0) {
    const pitchMult = Math.pow(2, opts.pitch / 12);
    filters.push(`asetrate=44100*${pitchMult.toFixed(6)}`);
    filters.push(`aresample=44100`);
  }

  if (opts.speed !== 1) {
    let speed = opts.speed;
    while (speed > 2.0) {
      filters.push("atempo=2.0");
      speed /= 2.0;
    }
    while (speed < 0.5) {
      filters.push("atempo=0.5");
      speed /= 0.5;
    }
    filters.push(`atempo=${speed.toFixed(4)}`);
  }

  if (opts.amplification !== 0) {
    filters.push(`volume=${opts.amplification.toFixed(2)}dB`);
  }

  return filters.join(",");
}

/** Probe duration of an audio file */
async function probeDuration(file: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

/** Get waveform peaks (downsampled amplitude data) for visualization */
async function getWaveform(file: string, samples = 120): Promise<number[]> {
  try {
    const args = [
      "-i", file,
      "-ac", "1",
      "-filter:a", `aresample=${samples * 100}`,
      "-map", "0:a",
      "-c:a", "pcm_s16le",
      "-f", "data", "-",
    ];
    const { stdout } = await execFileAsync(FFMPEG, args, { maxBuffer: 50 * 1024 * 1024 });
    const buf = Buffer.from(stdout);
    const view = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
    const peaks: number[] = [];
    const blockSize = Math.max(1, Math.floor(view.length / samples));
    for (let i = 0; i < samples; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const idx = i * blockSize + j;
        if (idx < view.length) {
          const v = Math.abs(view[idx]) / 32768;
          if (v > max) max = v;
        }
      }
      peaks.push(max);
    }
    return peaks;
  } catch {
    return Array.from({ length: samples }, () => Math.random() * 0.7 + 0.1);
  }
}

/** Extract audio from YouTube/SoundCloud URL using yt-dlp.
 *  Optionally accept a Netscape cookies.txt string to bypass YouTube's
 *  "Sign in to confirm you're not a bot" challenge.
 */
export async function extractAudioFromUrl(mediaUrl: string, cookies?: string): Promise<ExtractResult> {
  // Write cookies to a temp file if provided
  let cookieFile: string | null = null;
  if (cookies && cookies.trim()) {
    const normalized = normalizeCookies(cookies.trim());
    if (normalized) {
      cookieFile = join(UPLOAD_DIR, `.cookies_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`);
      writeFileSync(cookieFile, normalized, { mode: 0o600 });
    }
  }

  const cleanupCookie = () => {
    if (cookieFile && existsSync(cookieFile)) {
      try { unlinkSync(cookieFile); } catch {}
    }
  };

  try {
    const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const outPattern = join(UPLOAD_DIR, `${id}.%(ext)s`);

    const cookieArgs = cookieFile ? ["--cookies", cookieFile] : [];
    // Enable the node JS runtime so yt-dlp can solve YouTube's n-signature
    // and signature challenges. Without this, YouTube returns "Requested format
    // is not available" because only storyboards (images) are returned.
    const runtimeArgs = ["--js-runtimes", "node"];

    // First, get metadata
    let title = "Audio Tidak Berjudul";
    let duration = 0;
    let uploader = "";
    let thumbnail = "";
    try {
      const { stdout } = await execFileAsync(YTDLP, [
        ...runtimeArgs, "--no-playlist", "--no-warnings", "-J", ...cookieArgs, mediaUrl,
      ], { maxBuffer: 30 * 1024 * 1024, timeout: 90000 });
      const meta = JSON.parse(stdout);
      title = meta.title || title;
      duration = meta.duration || 0;
      uploader = meta.uploader || meta.channel || "";
      thumbnail = meta.thumbnail || "";
    } catch (e) {
      const msg = (e as Error).message || "";
      if (/sign in to confirm|not a bot|cookies/i.test(msg)) {
        cleanupCookie();
        return {
          ok: false,
          error: "YouTube memerlukan login untuk memverifikasi Anda bukan bot. Tambahkan cookies YouTube (format Netscape cookies.txt) di opsi lanjutan untuk melewati verifikasi ini.",
          file: "", filePath: "", title: "", duration: 0, size: 0, waveform: [],
        };
      }
    }

    // Download audio
    try {
      await execFileAsync(YTDLP, [
        ...runtimeArgs,
        "-x", "--audio-format", "mp3", "--audio-quality", "0",
        "--no-playlist", "--no-warnings",
        ...cookieArgs,
        "-o", outPattern,
        mediaUrl,
      ], { maxBuffer: 50 * 1024 * 1024, timeout: 180000 });
    } catch (e) {
      const msg = (e as Error).message || "";
      if (/sign in to confirm|not a bot|cookies/i.test(msg)) {
        cleanupCookie();
        return {
          ok: false,
          error: "YouTube memerlukan login untuk memverifikasi Anda bukan bot. Tambahkan cookies YouTube (format Netscape cookies.txt) di opsi lanjutan untuk melewati verifikasi ini.",
          file: "", filePath: "", title: "", duration: 0, size: 0, waveform: [],
        };
      }
      throw e;
    }

    // Find the downloaded file
    const files = readdirSync(UPLOAD_DIR).filter((f) => f.startsWith(id));
    if (files.length === 0) throw new Error("File hasil ekstraksi tidak ditemukan");
    const file = join(UPLOAD_DIR, files[0]);
    const stat = statSync(file);

    if (!duration) duration = await probeDuration(file);
    const waveform = await getWaveform(file);

    return {
      ok: true,
      file: files[0],
      filePath: file,
      title,
      duration,
      uploader,
      thumbnail,
      size: stat.size,
      waveform,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message, file: "", filePath: "", title: "", duration: 0, size: 0, waveform: [] };
  } finally {
    cleanupCookie();
  }
}

/**
 * Normalize a cookies input into Netscape cookies.txt format.
 * Accepts:
 *  - Raw Netscape format (starts with "# Netscape" or tab-separated lines)
 *  - Header-style "name=value" pairs (one per line, or comma-separated)
 *  - JSON array of {name, value}
 */
function normalizeCookies(input: string): string {
  const trimmed = input.trim();

  // Already Netscape format?
  if (/^# Netscape HTTP Cookie File/.test(trimmed) || /^#\s/m.test(trimmed)) {
    return trimmed;
  }

  // Try JSON array
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return jsonCookiesToNetscape(parsed);
    }
  } catch {}

  // Header-style: name=value (one per line or comma-separated)
  const lines = trimmed.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].includes("=")) {
    return headerCookiesToNetscape(lines);
  }

  // If it looks like tab-separated Netscape without header, return as is
  if (lines.some((l) => l.split("\t").length >= 7)) {
    return "# Netscape HTTP Cookie File\n" + trimmed + "\n";
  }

  return trimmed;
}

function headerCookiesToNetscape(lines: string[]): string {
  const out: string[] = ["# Netscape HTTP Cookie File", "# https://curl.se/docs/http-cookies.html"];
  const TAB = "\t";
  for (const line of lines) {
    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) continue;
    const name = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (!name) continue;
    // domain   FLAG    path    secure  expiration      name    value
    out.push([`.youtube.com`, `TRUE`, `/`, `TRUE`, `0`, name, value].join(TAB));
  }
  return out.join("\n") + "\n";
}

function jsonCookiesToNetscape(cookies: any[]): string {
  const out: string[] = ["# Netscape HTTP Cookie File"];
  const TAB = "\t";
  for (const c of cookies) {
    const name = c.name || "";
    const value = c.value || "";
    const domain = c.domain || ".youtube.com";
    const flag = String(domain).startsWith(".") ? "TRUE" : "FALSE";
    const path = c.path || "/";
    const secure = c.secure !== false ? "TRUE" : "FALSE";
    const exp = c.expirationDate || c.expires || Math.floor(Date.now() / 1000) + 86400 * 30;
    out.push([domain, flag, path, secure, String(Math.floor(exp)), name, value].join(TAB));
  }
  return out.join("\n") + "\n";
}

/** Save an uploaded file to the uploads dir */
export async function saveUploadedFile(file: File): Promise<ExtractResult> {
  try {
    const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name.replace(/[^\w.\-]/g, "_")}`;
    const filePath = join(UPLOAD_DIR, id);
    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buf);

    const stat = statSync(filePath);
    const duration = await probeDuration(filePath);
    const waveform = await getWaveform(filePath);

    return {
      ok: true,
      file: id,
      filePath,
      title: file.name.replace(/\.[^.]+$/, ""),
      duration,
      size: stat.size,
      waveform,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message, file: "", filePath: "", title: "", duration: 0, size: 0, waveform: [] };
  }
}

/** Process audio with FFmpeg according to options */
export async function processAudioFile(options: ProcessOptions): Promise<ProcessResult> {
  try {
    const inputPath = options.inputFile.startsWith("/")
      ? options.inputFile
      : join(UPLOAD_DIR, options.inputFile);
    if (!existsSync(inputPath)) {
      return { ok: false, error: "File input tidak ditemukan", file: "", filePath: "", duration: 0, size: 0, waveform: [] };
    }

    const fullOpts: Required<Omit<ProcessOptions, "inputFile">> = {
      speed: options.speed ?? 1,
      pitch: options.pitch ?? 0,
      amplification: options.amplification ?? 0,
    };

    const filter = buildFilterChain(fullOpts);
    const outId = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
    const outputPath = join(PROCESSED_DIR, outId);

    const args = [
      "-y",
      "-i", inputPath,
      ...(filter ? ["-af", filter] : []),
      "-ac", "2",
      "-ar", "44100",
      "-b:a", "192k",
      "-codec:a", "libmp3lame",
      outputPath,
    ];

    await execFileAsync(FFMPEG, args, { maxBuffer: 50 * 1024 * 1024, timeout: 120000 });

    const stat = statSync(outputPath);
    const duration = await probeDuration(outputPath);
    const waveform = await getWaveform(outputPath);

    return {
      ok: true,
      file: outId,
      filePath: outputPath,
      duration,
      size: stat.size,
      waveform,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message, file: "", filePath: "", duration: 0, size: 0, waveform: [] };
  }
}

/** Read a file from uploads or processed dir for streaming */
export async function readAudioFile(name: string, type: "upload" | "processed"): Promise<Buffer | null> {
  const dir = type === "upload" ? UPLOAD_DIR : PROCESSED_DIR;
  const filePath = join(dir, name);
  if (!existsSync(filePath)) return null;
  return readFile(filePath);
}

/** Get file stat */
export function getAudioFileStat(name: string, type: "upload" | "processed") {
  const dir = type === "upload" ? UPLOAD_DIR : PROCESSED_DIR;
  const filePath = join(dir, name);
  if (!existsSync(filePath)) return null;
  return statSync(filePath);
}

/** Cleanup old files (older than maxAgeMs) */
export function cleanupOldFiles(maxAgeMs = 2 * 60 * 60 * 1000): number {
  const now = Date.now();
  let removed = 0;
  for (const dir of [UPLOAD_DIR, PROCESSED_DIR]) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      try {
        const s = statSync(p);
        if (now - s.mtimeMs > maxAgeMs) {
          unlinkSync(p);
          removed++;
        }
      } catch {}
    }
  }
  return removed;
}
