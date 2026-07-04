"use client";

import * as React from "react";
import { FileAudio, Loader2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { useConverter, type SourceItem } from "@/lib/store";
import { WaveformPlayer } from "@/components/waveform-player";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function fmtDur(s: number) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PreviewList() {
  const { sources, processedMap, processingSourceId, toggleSourceSelected, selectAllSources } = useConverter();
  const selectedSources = sources.filter((s) => s.selected);
  const processedCount = sources.filter((s) => processedMap[s.id]).length;

  if (sources.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
        <FileAudio className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs font-medium text-muted-foreground">Belum ada audio di antrian</p>
        <p className="text-[10px] text-muted-foreground/70">Tambahkan audio dari panel kiri untuk mulai</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">Preview Audio ({selectedSources.length} terpilih)</span>
        {processedCount > 0 && (
          <Badge variant="secondary" className="gap-1 text-[9px]">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {processedCount} diproses
          </Badge>
        )}
        <div className="ml-auto flex gap-1">
          <button onClick={() => selectAllSources(true)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">
            Semua
          </button>
          <button onClick={() => selectAllSources(false)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">
            Kosongkan
          </button>
        </div>
      </div>

      <ScrollArea className="max-h-[400px] scrollbar-custom pr-1">
        <div className="space-y-2">
          {sources.map((item) => (
            <PreviewItem key={item.id} item={item} onToggle={() => toggleSourceSelected(item.id)} isProcessing={processingSourceId === item.id} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PreviewItem({ item, onToggle, isProcessing }: { item: SourceItem; onToggle: () => void; isProcessing: boolean }) {
  const { processedMap, uploadMap } = useConverter();
  const processed = processedMap[item.id];
  const upload = uploadMap[item.id];

  return (
    <div className={cn("rounded-lg border p-2.5 transition-colors", item.selected ? "border-primary/30 bg-card/60" : "border-border bg-card/30 opacity-60")}>
      <div className="mb-2 flex items-center gap-2">
        <Checkbox checked={item.selected} onCheckedChange={onToggle} className="shrink-0" />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">{item.title}</p>
        <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDur(item.duration)}</span>
        {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        {upload?.status === "uploaded" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        {upload?.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
      </div>

      {/* Original waveform */}
      <WaveformPlayer
        waveform={item.waveform}
        audioUrl={`/api/audio/file?name=${encodeURIComponent(item.inputFile)}&type=upload`}
        duration={item.duration}
        compact
        color="bg-muted-foreground/50"
      />

      {/* Processed waveform */}
      {processed ? (
        <div className="mt-1.5">
          <WaveformPlayer
            waveform={processed.waveform}
            audioUrl={`/api/audio/file?name=${encodeURIComponent(processed.fileName)}&type=processed`}
            duration={processed.duration}
            compact
            color="bg-primary"
          />
        </div>
      ) : isProcessing ? (
        <div className="mt-1.5 flex h-[44px] items-center justify-center rounded-lg border border-primary/30 bg-primary/5">
          <span className="flex items-center gap-1.5 text-[10px] text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> Memproses...
          </span>
        </div>
      ) : (
        <div className="mt-1.5 flex h-[44px] items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/5">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3" /> Klik "Proses Audio" untuk bypass
          </span>
        </div>
      )}
    </div>
  );
}
