"use client";

import * as React from "react";
import {
  Youtube, CloudUpload, Upload, Loader2, Link2, FileAudio, X,
  Settings2, ChevronDown, FileText, ExternalLink, AlertCircle,
} from "lucide-react";
import { useConverter, type SourceType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SOURCES: { id: SourceType; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: "youtube", label: "YouTube", icon: Youtube, desc: "Link video YouTube", color: "text-red-500" },
  { id: "soundcloud", label: "SoundCloud", icon: CloudUpload, desc: "Link track SoundCloud", color: "text-orange-500" },
  { id: "file", label: "Upload File", icon: Upload, desc: "MP3, WAV, M4A, dll", color: "text-emerald-500" },
];

function formatBytes(b: number) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function fmtDur(s: number) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SourceInput() {
  const { source, sourceLoading, sourceError, cookies, setCookies, setSource, setSourceLoading, setSourceError, resetAll } = useConverter();
  const [active, setActive] = React.useState<SourceType>("youtube");
  const [url, setUrl] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const cookieFileRef = React.useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error("Masukkan URL terlebih dahulu");
      return;
    }
    setSourceLoading(true);
    setSourceError(null);
    try {
      const res = await fetch("/api/audio/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), cookies: cookies.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal mengekstrak audio");
      setSource({
        type: active,
        url: url.trim(),
        title: data.title,
        duration: data.duration,
        size: data.size,
        waveform: data.waveform,
        inputFile: data.file,
      });
      toast.success("Audio berhasil diekstrak", { description: data.title });
    } catch (e) {
      setSourceError((e as Error).message);
      toast.error("Ekstraksi gagal", { description: (e as Error).message });
    } finally {
      setSourceLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setSourceLoading(true);
    setSourceError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/audio/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal mengunggah file");
      setSource({
        type: "file",
        fileName: file.name,
        title: data.title || file.name.replace(/\.[^.]+$/, ""),
        duration: data.duration,
        size: data.size,
        waveform: data.waveform,
        inputFile: data.file,
      });
      toast.success("File berhasil diunggah", { description: file.name });
    } catch (e) {
      setSourceError((e as Error).message);
      toast.error("Upload gagal", { description: (e as Error).message });
    } finally {
      setSourceLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleCookieFile = async (file: File) => {
    try {
      const text = await file.text();
      setCookies(text);
      toast.success("Cookies dimuat", { description: `${file.name} (${text.length} karakter)` });
    } catch (e) {
      toast.error("Gagal membaca file cookies");
    }
  };

  // Auto-show advanced section if the last error was a bot-check
  React.useEffect(() => {
    if (sourceError && /bot|cookies|sign in/i.test(sourceError)) {
      setShowAdvanced(true);
    }
  }, [sourceError]);

  return (
    <div className="space-y-4">
      {/* Source type tabs */}
      <div className="grid grid-cols-3 gap-2">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s.id);
                setUrl("");
                setSourceError(null);
              }}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card/40 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors", isActive ? s.color : "text-muted-foreground")} />
              <span className={cn("text-xs font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              <span className="hidden text-[10px] text-muted-foreground/70 sm:block">{s.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Input area */}
      {active !== "file" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                placeholder={
                  active === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://soundcloud.com/..."
                }
                className="h-11 pl-9"
                disabled={sourceLoading}
              />
            </div>
            <Button onClick={handleUrlSubmit} disabled={sourceLoading || !url.trim()} className="h-11 px-5">
              {sourceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekstrak"}
            </Button>
          </div>

          {/* Advanced: YouTube cookies */}
          {active === "youtube" && (
            <div className="rounded-lg border border-border/60 bg-muted/20">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Opsi Lanjutan (Cookies YouTube)
                {cookies.trim() && (
                  <Badge variant="secondary" className="ml-1 gap-1 text-[9px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Cookies aktif
                  </Badge>
                )}
                <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
              </button>
              {showAdvanced && (
                <div className="space-y-2 border-t px-3 py-3">
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="space-y-1">
                      <p>
                        YouTube kadang meminta login untuk memverifikasi bahwa Anda bukan bot. Untuk
                        melewati verifikasi ini, ekspor cookies YouTube Anda dan tempel/diunggah di sini.
                      </p>
                      <p className="flex flex-wrap items-center gap-1">
                        Cara ekspor cookies:
                        <a
                          href="https://chromewebstore.google.com/detail/get-cookiestxt-locally"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                        >
                          ekstensi "Get cookies.txt" <ExternalLink className="h-3 w-3" />
                        </a>
                        lalu buka youtube.com yang sudah login → klik ekstensi → export.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-[11px]">
                        <FileText className="h-3 w-3" /> Konten cookies.txt (Netscape / header / JSON)
                      </Label>
                      <button
                        type="button"
                        onClick={() => cookieFileRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                      >
                        <Upload className="h-3 w-3" /> Unggah file
                      </button>
                      <input
                        ref={cookieFileRef}
                        type="file"
                        accept=".txt,.json,text/plain,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCookieFile(f);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <Textarea
                      value={cookies}
                      onChange={(e) => setCookies(e.target.value)}
                      placeholder={"# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tVISITOR_INFO1...\tvalue..."}
                      className="h-20 resize-none font-mono text-[10px] leading-relaxed"
                      spellCheck={false}
                    />
                    {cookies.trim() && (
                      <button
                        type="button"
                        onClick={() => setCookies("")}
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        Hapus cookies
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {sourceLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Klik atau seret file ke sini</p>
            <p className="text-xs text-muted-foreground">MP3, WAV, M4A, OGG, FLAC — maks 100MB</p>
          </div>
        </div>
      )}

      {/* Error */}
      {sourceError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {sourceError}
        </div>
      )}

      {/* Source info */}
      {source && (
        <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileAudio className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{source.title}</p>
            <p className="text-xs text-muted-foreground">
              {fmtDur(source.duration)} · {formatBytes(source.size)} ·{" "}
              <span className="capitalize">{source.type}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              resetAll();
              setUrl("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
