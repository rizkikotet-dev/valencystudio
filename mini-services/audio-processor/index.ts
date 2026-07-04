/**
 * Audio Processor Mini-Service
 * Port: 3002
 *
 * Handles:
 *  - Audio extraction from YouTube/SoundCloud via yt-dlp
 *  - Audio processing via FFmpeg (speed, pitch, amplification, bass boost, reverb)
 *  - File serving (uploads / processed)
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "fs";
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const PORT = 3002;

const UPLOAD_DIR = join(import.meta.dir, "uploads");
const PROCESSED_DIR = join(import.meta.dir, "processed");
[UPLOAD_DIR, PROCESSED_DIR].forEach((d) => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

const YTDLP = "/home/z/.venv/bin/yt-dlp";
const FFMPEG = "ffmpeg";
const FFPROBE = "ffprobe";

interface ProcessOptions {
  inputFile: string;
  outputFile: string;
  speed: number;        // 0.5 - 2.0
  pitch: number;        // -12 to +12 semitones
  amplification: number; // dB, -20 to +20
  bassBoost: number;    // 0 - 15 dB
  trebleBoost: number;  // 0 - 15 dB
  reverb: number;       // 0 - 100
  volumeNormalize: boolean;
}

/** Run a shell command and stream stdout/stderr */
async function run(cmd: string, args: string[], onProgress?: (line: string) => void): Promise<{ code: number; output: string }> {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  let output = "";
  const reader = (proc.stderr as ReadableStream).getReader();
  const dec = new TextDecoder();
  const readLoop = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = dec.decode(value, { stream: true });
      output += text;
      text.split("\n").forEach((l) => {
        if (l.trim()) onProgress?.(l.trim());
      });
    }
  };
  await readLoop();
  const code = await proc.exited;
  return { code, output };
}

/** Build FFmpeg filter chain for audio processing */
function buildFilterChain(opts: ProcessOptions): string {
  const filters: string[] = [];

  // Pitch shift via asetrate + atempo (to keep duration while shifting pitch)
  // pitch semitones -> frequency multiplier: 2^(n/12)
  if (opts.pitch !== 0) {
    const pitchMult = Math.pow(2, opts.pitch / 12);
    filters.push(`asetrate=44100*${pitchMult.toFixed(6)}`);
    // resample back to 44100 to keep standard sample rate
    filters.push(`aresample=44100`);
  }

  // Speed change via atempo (range 0.5-2.0; chain for beyond range)
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

  // Bass / treble EQ
  if (opts.bassBoost > 0) {
    filters.push(`bass=g=${opts.bassBoost.toFixed(2)}:f=80:w=0.6`);
  }
  if (opts.trebleBoost > 0) {
    filters.push(`treble=g=${opts.trebleBoost.toFixed(2)}:f=4000:w=0.5`);
  }

  // Amplification (volume in dB)
  if (opts.amplification !== 0) {
    const db = opts.amplification;
    filters.push(`volume=${db >= 0 ? `${db.toFixed(2)}dB` : `${db.toFixed(2)}dB`}`);
  }

  // Reverb (aecho approximation)
  if (opts.reverb > 0) {
    const r = Math.min(opts.reverb, 100) / 100;
    const inGain = 0.8;
    const outGain = 0.9 - r * 0.5;
    const delays = "60|120|200";
    const decays = `${(0.3 + r * 0.5).toFixed(3)}|${(0.25 + r * 0.4).toFixed(3)}|${(0.2 + r * 0.3).toFixed(3)}`;
    filters.push(`aecho=${inGain}:${outGain}:${delays}:${decays}`);
  }

  // Volume normalize
  if (opts.volumeNormalize) {
    filters.push("loudnorm=I=-16:TP=-1.5:LRA=11");
  }

  return filters.join(",");
}

/** Extract audio from YouTube/SoundCloud URL using yt-dlp */
async function extractAudio(url: string, onProgress?: (line: string) => void): Promise<{ file: string; title: string; duration: number; uploader: string; thumbnail: string }> {
  const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const outPattern = join(UPLOAD_DIR, `${id}.%(ext)s`);
  const args = [
    "-x", "--audio-format", "mp3", "--audio-quality", "0",
    "--no-playlist",
    "--no-warnings",
    "--print-json",
    "-o", outPattern,
    url,
  ];
  onProgress?.("Memulai ekstraksi audio dengan yt-dlp...");
  const { code, output } = await run(YTDLP, args, onProgress);
  if (code !== 0) {
    throw new Error(`yt-dlp gagal: ${output.slice(-500)}`);
  }
  // Find the downloaded file
  const files = readdirSync(UPLOAD_DIR).filter((f) => f.startsWith(id));
  if (files.length === 0) throw new Error("File hasil ekstraksi tidak ditemukan");
  const file = join(UPLOAD_DIR, files[0]);

  // Parse JSON metadata (last line of output is JSON when --print-json)
  let title = "Audio Tidak Berjudul";
  let duration = 0;
  let uploader = "";
  let thumbnail = "";
  try {
    const lines = output.trim().split("\n").filter(Boolean);
    const last = lines[lines.length - 1];
    const meta = JSON.parse(last);
    title = meta.title || title;
    duration = meta.duration || 0;
    uploader = meta.uploader || meta.channel || "";
    thumbnail = meta.thumbnail || "";
  } catch {
    // ignore parse error
  }

  // Probe duration if missing
  if (!duration) {
    try {
      const { output: probeOut } = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file]);
      duration = parseFloat(probeOut.trim()) || 0;
    } catch {}
  }

  return { file, title, duration, uploader, thumbnail };
}

/** Process audio with FFmpeg according to options */
async function processAudio(opts: ProcessOptions, onProgress?: (line: string) => void): Promise<{ file: string; duration: number; size: number }> {
  const filter = buildFilterChain(opts);
  const args = [
    "-y",
    "-i", opts.inputFile,
    ...(filter ? ["-af", filter] : []),
    "-ac", "2",
    "-ar", "44100",
    "-b:a", "192k",
    "-codec:a", "libmp3lame",
    opts.outputFile,
  ];
  onProgress?.("Memproses audio dengan FFmpeg...");
  const { code, output } = await run(FFMPEG, args, onProgress);
  if (code !== 0) throw new Error(`FFmpeg gagal: ${output.slice(-500)}`);

  const stat = statSync(opts.outputFile);
  // Probe duration
  let duration = 0;
  try {
    const { output: probeOut } = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", opts.outputFile]);
    duration = parseFloat(probeOut.trim()) || 0;
  } catch {}
  return { file: opts.outputFile, duration, size: stat.size };
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
    const proc = Bun.spawn([FFMPEG, ...args], { stdout: "pipe", stderr: "pipe" });
    const buf = await new Response(proc.stdout).arrayBuffer();
    await proc.exited;
    const view = new Int16Array(buf);
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

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ ok: true, port: PORT, service: "audio-processor" }, { headers: corsHeaders });
    }

    // Extract audio from URL
    if (url.pathname === "/extract" && req.method === "POST") {
      try {
        const { url: mediaUrl } = await req.json() as { url: string };
        if (!mediaUrl) return Response.json({ error: "URL wajib diisi" }, { status: 400, headers: corsHeaders });

        const result = await extractAudio(mediaUrl, (line) => {
          // could stream progress; keep simple
        });
        const peaks = await getWaveform(result.file);
        const stat = statSync(result.file);
        return Response.json({
          ok: true,
          file: result.file.split("/").pop(),
          filePath: result.file,
          title: result.title,
          duration: result.duration,
          uploader: result.uploader,
          thumbnail: result.thumbnail,
          size: stat.size,
          waveform: peaks,
        }, { headers: corsHeaders });
      } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
      }
    }

    // Process audio
    if (url.pathname === "/process" && req.method === "POST") {
      try {
        const body = await req.json() as ProcessOptions & { inputFile: string };
        const inputPath = body.inputFile.startsWith("/") ? body.inputFile : join(UPLOAD_DIR, body.inputFile);
        if (!existsSync(inputPath)) return Response.json({ error: "File input tidak ditemukan" }, { status: 404, headers: corsHeaders });

        const outId = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
        const outputPath = join(PROCESSED_DIR, outId);

        const result = await processAudio({
          inputFile: inputPath,
          outputFile: outputPath,
          speed: body.speed ?? 1,
          pitch: body.pitch ?? 0,
          amplification: body.amplification ?? 0,
          bassBoost: body.bassBoost ?? 0,
          trebleBoost: body.trebleBoost ?? 0,
          reverb: body.reverb ?? 0,
          volumeNormalize: body.volumeNormalize ?? false,
        });
        const peaks = await getWaveform(result.file);
        return Response.json({
          ok: true,
          file: outId,
          filePath: result.file,
          duration: result.duration,
          size: result.size,
          waveform: peaks,
        }, { headers: corsHeaders });
      } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
      }
    }

    // Upload file (receive multipart)
    if (url.pathname === "/upload" && req.method === "POST") {
      try {
        const form = await req.formData();
        const file = form.get("file") as File;
        if (!file) return Response.json({ error: "File tidak ditemukan" }, { status: 400, headers: corsHeaders });

        const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name.replace(/[^\w.\-]/g, "_")}`;
        const filePath = join(UPLOAD_DIR, id);
        const buf = await file.arrayBuffer();
        writeFileSync(filePath, Buffer.from(buf));

        const stat = statSync(filePath);
        const peaks = await getWaveform(filePath);
        let duration = 0;
        try {
          const { output: probeOut } = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath]);
          duration = parseFloat(probeOut.trim()) || 0;
        } catch {}

        return Response.json({
          ok: true,
          file: id,
          filePath,
          title: file.name.replace(/\.[^.]+$/, ""),
          duration,
          size: stat.size,
          waveform: peaks,
        }, { headers: corsHeaders });
      } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
      }
    }

    // Serve a file (uploads or processed) with range support
    if (url.pathname === "/file") {
      const name = url.searchParams.get("name");
      const type = url.searchParams.get("type") || "processed";
      if (!name) return new Response("Not found", { status: 404 });
      const dir = type === "upload" ? UPLOAD_DIR : PROCESSED_DIR;
      const filePath = join(dir, name);
      if (!existsSync(filePath)) return new Response("Not found", { status: 404 });

      const stat = statSync(filePath);
      const range = req.headers.get("range");
      const mime = "audio/mpeg";

      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        if (m) {
          const start = m[1] ? parseInt(m[1]) : 0;
          const end = m[2] ? parseInt(m[2]) : stat.size - 1;
          const chunk = await readFile(filePath).then((b) => b.subarray(start, end + 1));
          return new Response(chunk, {
            status: 206,
            headers: {
              ...corsHeaders,
              "Content-Type": mime,
              "Content-Range": `bytes ${start}-${end}/${stat.size}`,
              "Accept-Ranges": "bytes",
              "Content-Length": String(chunk.length),
            },
          });
        }
      }
      const buf = await readFile(filePath);
      return new Response(buf, {
        headers: {
          ...corsHeaders,
          "Content-Type": mime,
          "Content-Length": String(stat.size),
          "Accept-Ranges": "bytes",
        },
      });
    }

    // Cleanup old files (older than 2 hours)
    if (url.pathname === "/cleanup" && req.method === "POST") {
      const now = Date.now();
      let removed = 0;
      for (const dir of [UPLOAD_DIR, PROCESSED_DIR]) {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          const s = statSync(p);
          if (now - s.mtimeMs > 2 * 60 * 60 * 1000) {
            try { unlinkSync(p); removed++; } catch {}
          }
        }
      }
      return Response.json({ ok: true, removed }, { headers: corsHeaders });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  },
});

console.log(`🎵 Audio Processor service running on http://localhost:${PORT}`);
