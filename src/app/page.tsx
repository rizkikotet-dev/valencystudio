"use client";

import * as React from "react";
import { Music4, Zap, ShieldCheck, UploadCloud, Github, AudioLines, ChevronRight, Crown } from "lucide-react";
import { SourceInput } from "@/components/source-input";
import { BypassRecommendations } from "@/components/bypass-recommendations";
import { ProcessingPanel } from "@/components/processing-panel";
import { RobloxPanel } from "@/components/roblox-panel";
import { HistoryList } from "@/components/history-list";
import { PreviewList } from "@/components/preview-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export default function Home() {
  const hydrated = useHydrated();

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary pulse-glow">
              <AudioLines className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <h1 className="text-sm font-bold tracking-tight">
                VALENCY <span className="gradient-text">STUDIO</span>
              </h1>
              <p className="hidden text-[10px] text-muted-foreground sm:block">By V.I.O.R — Konversi & Upload Audio ke Roblox</p>
            </div>
          </div>
          <nav className="ml-auto flex items-center gap-1">
            <Badge variant="outline" className="hidden gap-1 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> FFmpeg Ready
            </Badge>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:py-12">
          <Badge variant="secondary" className="mb-3 gap-1">
            <Crown className="h-3 w-3" /> VALENCY STUDIO · By V.I.O.R
          </Badge>
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Konversi Audio ke{" "}
            <span className="gradient-text">Roblox</span>{" "}
            dengan Bypass Cerdas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
            Tambahkan multiple audio dari YouTube, SoundCloud, atau upload file. Pilih bebas audio mana yang
            akan diproses dengan bypass, lalu upload batch langsung ke akun Roblox dengan rekomendasi anti-deteksi.
          </p>
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Music4 className="h-3.5 w-3.5 text-primary" /> YouTube & SoundCloud</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Pitch & Speed Bypass</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Upload Langsung</span>
            <span className="flex items-center gap-1.5"><UploadCloud className="h-3.5 w-3.5 text-primary" /> Auto History</span>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left column: source + bypass */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">1</div>
                <h2 className="text-sm font-semibold">Pilih Sumber Audio</h2>
              </div>
              {hydrated ? <SourceInput /> : <SourceInputSkeleton />}
            </Card>

            <Card className="p-4">
              <BypassRecommendations />
            </Card>
          </div>

          {/* Center column: preview list + processing */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">2</div>
                <h2 className="text-sm font-semibold">Preview & Proses Batch</h2>
              </div>
              {hydrated ? <PreviewList /> : <PreviewSkeleton />}
            </Card>

            <Card className="p-4">
              {hydrated ? <ProcessingPanel /> : <Skeleton className="h-64 w-full" />}
            </Card>
          </div>

          {/* Right column: roblox + history */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">3</div>
                <h2 className="text-sm font-semibold">Upload ke Roblox</h2>
              </div>
              {hydrated ? <RobloxPanel /> : <Skeleton className="h-64 w-full" />}
            </Card>

            <Card className="flex min-h-[300px] flex-1 flex-col p-4">
              <HistoryList />
            </Card>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-10">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold sm:text-xl">Cara Kerja</h3>
            <p className="text-xs text-muted-foreground sm:text-sm">Tiga langkah sederhana dari link ke Roblox</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { n: "1", icon: Music4, title: "Tambah Multiple Audio", desc: "Tempel link YouTube/SoundCloud atau upload file — tambah sebanyak yang diinginkan ke antrian.", color: "text-red-500" },
              { n: "2", icon: Zap, title: "Pilih & Proses Batch", desc: "Pilih bebas audio mana yang akan diproses, terapkan bypass pitch/speed/bass ke semua sekaligus.", color: "text-orange-500" },
              { n: "3", icon: UploadCloud, title: "Upload Multi Roblox", desc: "Pilih audio yang akan diupload, beri nama per aset, upload batch ke akun/grup Roblox.", color: "text-emerald-500" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.n} className="relative overflow-hidden p-4">
                  <div className="absolute right-3 top-3 text-5xl font-black text-primary/5">{s.n}</div>
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10")}>
                    <Icon className={cn("h-4 w-4", s.color)} />
                  </div>
                  <h4 className="text-sm font-semibold">{s.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features grid */}
        <section className="mt-8">
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-2 divide-x divide-y border-l border-t sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
              {[
                { label: "Format Output", value: "MP3 192k" },
                { label: "Sample Rate", value: "44.1 kHz" },
                { label: "Pitch Range", value: "±12 st" },
                { label: "Speed Range", value: "0.25–4x" },
                { label: "Bass Boost", value: "0–20 dB" },
                { label: "Max Size", value: "100 MB" },
              ].map((f) => (
                <div key={f.label} className="border-b border-r p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-bold">{f.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Disclaimer */}
        <section className="mt-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <p className="font-semibold">⚠️ Catatan Penting</p>
            <p className="mt-1 text-amber-600/90 dark:text-amber-400/80">
              Gunakan untuk konten yang Anda miliki haknya atau yang berlisensi bebas royalti. Bypass deteksi
              hak cipta dapat melanggar ketentuan Roblox & hukum hak cipta. API Key Roblox Open Cloud hanya
              disimpan di sesi browser Anda dan hanya digunakan untuk upload — tidak dikirim ke server pihak ketiga.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AudioLines className="h-3.5 w-3.5 text-primary" />
            <span><b className="font-semibold text-foreground">VALENCY STUDIO</b> · By V.I.O.R · Dibuat dengan FFmpeg & Next.js</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#how" className="hover:text-foreground">Cara Kerja</a>
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <span>Bukan afiliasi resmi Roblox</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SourceInputSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-[88px] w-full rounded-xl" />
      <Skeleton className="h-[88px] w-full rounded-xl" />
    </div>
  );
}
