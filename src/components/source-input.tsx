"use client";

import * as React from "react";
import {
  Youtube, CloudUpload, Upload, Loader2, Link2, FileAudio, X,
  Settings2, ChevronDown, FileText, ExternalLink, AlertCircle,
  CheckSquare, Square, Trash2, Plus,
} from "lucide-react";
import { useConverter, type SourceType, type SourceItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const SOURCE_ICON: Record<string, React.ElementType> = {
  youtube: Youtube,
  soundcloud: CloudUpload,
  file: FileAudio,
};

export function SourceInput() {
  const {
    sources, sourceLoading, sourceError, cookies, setCookies,
    addSource, removeSource, toggleSourceSelected, selectAllSources, clearSources,
    setSourceLoading, setSourceError,
  } = useConverter();

  const [active, setActive] = React.useState<SourceType>("youtube");
  const [url, setUrl] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cookieFileRef = React.useRef<HTMLInputElement>(null);

  const selectedCount = sources.filter((s) => s.selected).length;

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
      addSource({
        type: active,
        url: url.trim(),
        title: data.title,
        duration: data.duration,
        size: data.size,
        waveform: data.waveform,
        inputFile: data.file,
      });
      toast.success("Audio ditambahkan ke antrian", { description: data.title });
      setUrl(""); // clear for next add
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
      addSource({
        type: "file",
        fileName: file.name,
        title: data.title || file.name.replace(/\.[^.]+$/, ""),
        duration: data.duration,
        size: data.size,
        waveform: data.waveform,
        inputFile: data.file,
      });
      toast.success("File ditambahkan ke antrian", { description: file.name });
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
    } catch {
      toast.error("Gagal membaca file cookies");
    }
  };

  React.useEffect(() => {
    if (sourceError && /bot|cookies|sign in/i.test(sourceError)) {
      setShowAdvanced(true);
    }
  }, [sourceError]);

  return (
    <div className="space-y-3">
      {/* Source type tabs */}
      <div className="grid grid-cols-3 gap-1.5">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { setActive(s.id); setUrl(""); setSourceError(null); }}
              className={cn(
                "group relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card/40 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? s.color : "text-muted-foreground")} />
              <span className={cn("text-[11px] font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
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
                placeholder={active === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://soundcloud.com/..."}
                className="h-10 pl-9"
                disabled={sourceLoading}
              />
            </div>
            <Button onClick={handleUrlSubmit} disabled={sourceLoading || !url.trim()} className="h-10 gap-1.5 px-4">
              {sourceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </Button>
          </div>

          {/* Advanced: YouTube cookies */}
          {active === "youtube" && (
            <div className="rounded-lg border border-border/60 bg-muted/20">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Opsi Lanjutan (Cookies YouTube)
                {cookies.trim() && (
                  <Badge variant="secondary" className="ml-1 gap-1 text-[9px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif
                  </Badge>
                )}
                <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
              </button>
              {showAdvanced && (
                <div className="space-y-2 border-t px-3 py-2.5">
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="space-y-1">
                      <p>YouTube kadang meminta login untuk verifikasi bot. Ekspor cookies YouTube dan tempel di sini.</p>
                      <p className="flex flex-wrap items-center gap-1">
                        Cara ekspor:
                        <a href="https://chromewebstore.google.com/detail/get-cookiestxt-locally" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
                          ekstensi "Get cookies.txt" <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-[11px]">
                        <FileText className="h-3 w-3" /> cookies.txt (Netscape / header / JSON)
                      </Label>
                      <button type="button" onClick={() => cookieFileRef.current?.click()} className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
                        <Upload className="h-3 w-3" /> Unggah
                      </button>
                      <input ref={cookieFileRef} type="file" accept=".txt,.json,text/plain,application/json" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCookieFile(f); e.target.value = ""; }}
                      />
                    </div>
                    <Textarea
                      value={cookies}
                      onChange={(e) => setCookies(e.target.value)}
                      placeholder={"# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tVISITOR_INFO1...\tvalue..."}
                      className="h-16 resize-none font-mono text-[10px] leading-relaxed"
                      spellCheck={false}
                    />
                    {cookies.trim() && (
                      <button type="button" onClick={() => setCookies("")} className="text-[10px] text-muted-foreground hover:text-destructive">
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
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30",
          )}
        >
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus,audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          {sourceLoading ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="text-xs font-medium">Klik atau seret file ke sini</p>
            <p className="text-[10px] text-muted-foreground">MP3, WAV, M4A, OGG — maks 100MB</p>
          </div>
        </div>
      )}

      {/* Error */}
      {sourceError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {sourceError}
        </div>
      )}

      {/* Queue list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Antrian Audio ({sources.length})</span>
            <Badge variant="secondary" className="text-[9px]">{selectedCount} terpilih</Badge>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => selectAllSources(true)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">
                Pilih Semua
              </button>
              <button onClick={() => selectAllSources(false)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">
                Kosongkan
              </button>
              <button onClick={clearSources} className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-destructive hover:bg-destructive/10">
                <Trash2 className="h-2.5 w-2.5" /> Bersihkan
              </button>
            </div>
          </div>
          <ScrollArea className="max-h-[280px] scrollbar-custom pr-1">
            <div className="space-y-1.5">
              {sources.map((item) => (
                <SourceQueueItem key={item.id} item={item} onToggle={() => toggleSourceSelected(item.id)} onRemove={() => removeSource(item.id)} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function SourceQueueItem({ item, onToggle, onRemove }: { item: SourceItem; onToggle: () => void; onRemove: () => void }) {
  const Icon = SOURCE_ICON[item.type] || FileAudio;
  return (
    <div className={cn("group flex items-center gap-2 rounded-lg border p-2 transition-colors", item.selected ? "border-primary/40 bg-primary/5" : "border-border bg-card/40")}>
      <Checkbox checked={item.selected} onCheckedChange={onToggle} className="shrink-0" />
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{item.title}</p>
        <p className="text-[10px] text-muted-foreground">
          {fmtDur(item.duration)} · {formatBytes(item.size)} · <span className="capitalize">{item.type}</span>
        </p>
      </div>
      <button onClick={onRemove} className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
