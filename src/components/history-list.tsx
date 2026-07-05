"use client";

import * as React from "react";
import { History, Trash2, ExternalLink, Youtube, CloudUpload, FileAudio, Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { useConverter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  assetName: string;
  duration: number;
  fileSize: number;
  speed: number;
  pitch: number;
  amplification: number;
  bassBoost?: number;
  reverb?: number;
  bypassMode: string | null;
  robloxAssetId: string | null;
  uploadStatus: string;
  uploadError: string | null;
  moderationStatus: string | null;
  moderationReason: string | null;
  createdAt: string;
}

function fmtDur(s: number) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtSize(b: number) {
  if (!b) return "0 KB";
  return `${(b / 1024).toFixed(0)} KB`;
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  return `${days} hari lalu`;
}

const SOURCE_ICON: Record<string, React.ElementType> = {
  youtube: Youtube,
  soundcloud: CloudUpload,
  file: FileAudio,
};

export function HistoryList() {
  const { historyVersion, account } = useConverter();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load, historyVersion]);

  // Polling for pending/reviewing items
  React.useEffect(() => {
    const pendingItems = items.filter(
      (i) => i.uploadStatus === "uploaded" && i.robloxAssetId && (i.moderationStatus === "Pending" || i.moderationStatus === "Reviewing")
    );

    if (pendingItems.length === 0 || !account?.apiKey) return;

    const interval = setInterval(async () => {
      let updated = false;
      const newItems = [...items];

      for (const item of pendingItems) {
        try {
          const res = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(account.apiKey)}&assetId=${item.robloxAssetId}`);
          const data = await res.json();
          
          if (data.ok && data.moderationState && data.moderationState !== item.moderationStatus) {
            // Update DB
            await fetch(`/api/history?id=${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                moderationStatus: data.moderationState, 
                moderationReason: data.moderationReason || null 
              }),
            });
            
            // Update local state
            const idx = newItems.findIndex((i) => i.id === item.id);
            if (idx !== -1) {
              newItems[idx] = { 
                ...newItems[idx], 
                moderationStatus: data.moderationState,
                moderationReason: data.moderationReason || null
              };
              updated = true;
            }
          }
        } catch (e) {
          console.error("Failed to poll history item", e);
        }
      }

      if (updated) {
        setItems(newItems);
      }
    }, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, [items, account]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  };

  return (
    <div className="flex h-full flex-col space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Riwayat Konversi & Upload</h3>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {items.length} item
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Belum ada riwayat</p>
          <p className="text-xs text-muted-foreground">Konversi & upload audio akan muncul di sini</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)] min-h-[200px] scrollbar-custom pr-2">
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = SOURCE_ICON[item.sourceType] || FileAudio;
              const isUploaded = item.uploadStatus === "uploaded";
              const isFailed = item.uploadStatus === "failed";
              const modCfg = getModBadge(item.moderationStatus);
              return (
                <div
                  key={item.id}
                  className="group rounded-lg border bg-card/40 p-2.5 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-xs font-semibold">{item.assetName}</p>
                        {isUploaded && !item.moderationStatus && (
                          <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sukses
                          </Badge>
                        )}
                        {isUploaded && item.moderationStatus && (
                          <Badge variant="outline" className={cn("h-4 gap-0.5 px-1 text-[9px]", modCfg.className)}>
                            <modCfg.icon className={cn("h-2.5 w-2.5", item.moderationStatus === "Reviewing" && "animate-spin")} />
                            {modCfg.label}
                          </Badge>
                        )}
                        {isFailed && (
                          <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-destructive">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Gagal
                          </Badge>
                        )}
                      </div>
                      {item.sourceTitle && item.sourceTitle !== item.assetName && (
                        <p className="truncate text-[10px] text-muted-foreground">dari: {item.sourceTitle}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>{fmtDur(item.duration)}</span>
                        <span>·</span>
                        <span>{fmtSize(item.fileSize)}</span>
                        {item.bypassMode && item.bypassMode !== "none" && (
                          <>
                            <span>·</span>
                            <span className="rounded bg-muted px-1 capitalize">{item.bypassMode.replace("_", "+")}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                      {isUploaded && item.robloxAssetId && (
                        <a
                          href={`https://www.roblox.com/library/${item.robloxAssetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
                        >
                          Asset #{item.robloxAssetId} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {isFailed && item.uploadError && (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-destructive/80">{item.uploadError}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function getModBadge(status: string | null): { icon: React.ElementType; label: string; className: string } {
  switch (status) {
    case "Approved":
      return { icon: CheckCircle2, label: "Disetujui", className: "text-emerald-500 border-emerald-500/30" };
    case "Rejected":
      return { icon: XCircle, label: "Ditolak", className: "text-destructive border-destructive/30" };
    case "Reviewing":
      return { icon: RefreshCw, label: "Direview", className: "text-blue-500 border-blue-500/30" };
    case "Pending":
      return { icon: Clock, label: "Menunggu", className: "text-amber-500 border-amber-500/30" };
    default:
      return { icon: CheckCircle2, label: "Sukses", className: "text-emerald-500" };
  }
}
