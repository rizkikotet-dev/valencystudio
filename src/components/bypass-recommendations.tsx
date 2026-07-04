"use client";

import * as React from "react";
import { Check, Sparkles, Wand2 } from "lucide-react";
import { useConverter, BYPASS_PRESETS } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function BypassRecommendations() {
  const { activePresetId, applyPreset } = useConverter();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Rekomendasi Bypass</h3>
        <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
          <Sparkles className="h-3 w-3" /> Preset cepat
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Pilih preset untuk menghindari deteksi hak cipta Roblox. Kombinasi perubahan pitch & kecepatan adalah metode paling efektif.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BYPASS_PRESETS.map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={cn(
                "group relative flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-all",
                isActive
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card/40 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{p.icon}</span>
                {p.recommended && (
                  <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> Hot
                  </Badge>
                )}
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold leading-tight">{p.name}</span>
              <span className="line-clamp-2 text-[10px] text-muted-foreground">{p.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
