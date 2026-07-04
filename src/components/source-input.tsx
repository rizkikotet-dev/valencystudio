"use client";

import * as React from "react";
import { Youtube, CloudUpload, Upload, Loader2, Link2, FileAudio, X } from "lucide-react";
import { useConverter, type SourceType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { source, sourceLoading, sourceError, setSource, setSourceLoading, setSourceError, resetAll } = useConverter();
  const [active, setActive] = React.useState<SourceType>("youtube");
  const [url, setUrl] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ url: url.trim() }),
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
