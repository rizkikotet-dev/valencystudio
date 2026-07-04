"use client";

import * as React from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface WaveformPlayerProps {
  waveform: number[];
  audioUrl: string;
  duration: number;
  label?: string;
  compact?: boolean;
  color?: string; // tailwind text color class for bars, e.g. "bg-primary"
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({
  waveform,
  audioUrl,
  duration,
  label,
  compact = false,
  color = "bg-primary",
}: WaveformPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [volume, setVolume] = React.useState(1);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [audioUrl]);

  React.useEffect(() => {
    setCurrent(0);
    setPlaying(false);
  }, [audioUrl]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch(() => {});
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setCurrent(v);
  };

  const onVol = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const progress = duration > 0 ? current / duration : 0;
  const bars = waveform.length > 0 ? waveform : Array.from({ length: 80 }, () => 0.4);

  return (
    <div className={cn("w-full rounded-xl border bg-card/40 p-3", compact && "p-2")}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" volume={volume} />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant={playing ? "secondary" : "default"}
          onClick={toggle}
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label={playing ? "Jeda" : "Putar"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
        </Button>

        <div className="min-w-0 flex-1">
          {label && <p className="mb-1 truncate text-xs font-medium text-muted-foreground">{label}</p>}
          <div
            className="flex h-10 items-center gap-[2px] overflow-hidden"
            role="slider"
            aria-label="Posisi audio"
            aria-valuenow={Math.floor(progress * 100)}
            tabIndex={0}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(ratio * duration);
            }}
          >
            {bars.map((h, i) => {
              const active = i / bars.length <= progress;
              return (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    active ? color : "bg-muted-foreground/30",
                  )}
                  style={{ height: `${Math.max(6, h * 100)}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="font-mono text-xs text-muted-foreground">
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="mt-2 flex items-center gap-3">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <Slider value={[volume]} min={0} max={1} step={0.01} onValueChange={(v) => onVol(v[0])} className="max-w-[120px]" />
          <a href={audioUrl} download className="ml-auto">
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> Unduh
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
