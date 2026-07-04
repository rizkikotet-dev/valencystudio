"use client";

import * as React from "react";
import { Gauge, Music2, Volume2, Waves, AudioWaveform, RotateCcw, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { useConverter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SliderRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent?: string;
}

function SliderRow({ icon: Icon, label, value, min, max, step, unit, onChange, format, accent = "text-primary" }: SliderRowProps) {
  const display = format ? format(value) : `${value > 0 && (label.includes("Pitch") || label.includes("Bass") || label.includes("Treble") || label.includes("Amp")) ? "+" : ""}${value}${unit}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", accent)} />
          <Label className="text-xs font-medium">{label}</Label>
        </div>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export function ProcessingPanel() {
  const {
    sources, settings, setSettings, activePresetId,
    processedMap, processing, processingSourceId, processError,
    setProcessing, setProcessed, setProcessError, setProcessingSourceId, selectAllProcessed,
  } = useConverter();

  const selectedSources = sources.filter((s) => s.selected);
  const canProcess = selectedSources.length > 0 && !processing;
  const processedCount = selectedSources.filter((s) => processedMap[s.id]).length;

  const handleProcess = async () => {
    if (selectedSources.length === 0) return;
    setProcessing(true);
    setProcessError(null);
    let success = 0;
    let failed = 0;

    for (const source of selectedSources) {
      setProcessingSourceId(source.id);
      try {
        const res = await fetch("/api/audio/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputFile: source.inputFile, ...settings }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Gagal memproses");
        setProcessed(source.id, {
          sourceId: source.id,
          fileName: data.file,
          duration: data.duration,
          size: data.size,
          waveform: data.waveform,
          assetName: source.title.slice(0, 45),
          selectedForUpload: true, // auto-select for upload
        });
        success++;
      } catch (e) {
        failed++;
        toast.error(`Gagal: ${source.title}`, { description: (e as Error).message });
      }
    }

    setProcessingSourceId(null);
    setProcessing(false);
    if (success > 0) {
      toast.success(`${success} audio berhasil diproses`, {
        description: failed > 0 ? `${failed} gagal` : "Semua siap untuk upload",
      });
    }
  };

  const reset = () => {
    setSettings({ speed: 1, pitch: 0, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false });
  };

  const isModified =
    settings.speed !== 1 || settings.pitch !== 0 || settings.amplification !== 0 ||
    settings.bassBoost !== 0 || settings.trebleBoost !== 0 || settings.reverb !== 0 || settings.volumeNormalize;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AudioWaveform className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Kustomisasi & Proses Batch</h3>
        </div>
        {isModified && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={reset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      {/* Batch info */}
      {selectedSources.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{selectedSources.length} audio akan diproses</span>
          {processedCount > 0 && (
            <Badge variant="outline" className="ml-auto gap-1 text-[9px] text-emerald-500">
              <CheckCircle2 className="h-2.5 w-2.5" /> {processedCount} sudah diproses
            </Badge>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border bg-card/30 p-3">
        <SliderRow icon={Gauge} label="Kecepatan" value={settings.speed} min={0.25} max={4} step={0.01} unit="x" onChange={(v) => setSettings({ speed: v })} format={(v) => `${v.toFixed(2)}x`} />
        <SliderRow icon={Music2} label="Pitch" value={settings.pitch} min={-12} max={12} step={0.5} unit=" st" onChange={(v) => setSettings({ pitch: v })} format={(v) => `${v > 0 ? "+" : ""}${v} st`} accent="text-orange-500" />
        <SliderRow icon={Volume2} label="Amplifikasi" value={settings.amplification} min={-20} max={20} step={0.5} unit="dB" onChange={(v) => setSettings({ amplification: v })} format={(v) => `${v > 0 ? "+" : ""}${v} dB`} accent="text-emerald-500" />
        <SliderRow icon={Waves} label="Bass Boost" value={settings.bassBoost} min={0} max={20} step={0.5} unit="dB" onChange={(v) => setSettings({ bassBoost: v })} format={(v) => `+${v} dB`} accent="text-purple-500" />
        <SliderRow icon={Zap} label="Treble Boost" value={settings.trebleBoost} min={0} max={20} step={0.5} unit="dB" onChange={(v) => setSettings({ trebleBoost: v })} format={(v) => `+${v} dB`} accent="text-cyan-500" />
        <SliderRow icon={Waves} label="Reverb" value={settings.reverb} min={0} max={100} step={1} unit="%" onChange={(v) => setSettings({ reverb: v })} format={(v) => `${v}%`} accent="text-pink-500" />
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs font-medium">Normalisasi Volume</Label>
          </div>
          <Switch checked={settings.volumeNormalize} onCheckedChange={(c) => setSettings({ volumeNormalize: c })} />
        </div>
      </div>

      {processError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{processError}</div>
      )}

      <Button onClick={handleProcess} disabled={!canProcess} className="w-full gap-2" size="lg">
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {processingSourceId ? "Memproses..." : "Memulai..."}
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" /> Proses {selectedSources.length > 0 ? `${selectedSources.length} Audio` : "Audio"}
          </>
        )}
      </Button>
      {selectedSources.length === 0 && sources.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">Pilih minimal 1 audio di antrian untuk diproses</p>
      )}
      {sources.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">Tambahkan audio ke antrian terlebih dahulu</p>
      )}
    </div>
  );
}
