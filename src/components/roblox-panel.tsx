"use client";

import * as React from "react";
import {
  ShieldCheck, Loader2, UploadCloud, LogOut, ExternalLink, KeyRound,
  CheckCircle2, AlertTriangle, Info, User, Users, BookOpen, Link as LinkIcon,
  Clock, XCircle, RefreshCw,
} from "lucide-react";
import { useConverter, type SourceItem, type ProcessedItem, type ModerationState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Safely parse a fetch response as JSON */
async function safeFetchJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error("Server mengembalikan HTML, bukan JSON. Kemungkinan timeout.");
  }
  try { return JSON.parse(text); } catch { throw new Error(`Respon tidak valid: ${text.slice(0, 100)}`); }
}

export function RobloxPanel() {
  const {
    sources, processedMap, uploadMap, account,
    verifying, verifyError, uploading,
    setAccount, setVerifying, setVerifyError, setUploading,
    setUploadState, toggleProcessedSelected, selectAllProcessed,
    settings, refreshHistory,
  } = useConverter();

  const [apiKey, setApiKey] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [useGroup, setUseGroup] = React.useState(false);
  const [groupId, setGroupId] = React.useState("");
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Processed items available for upload
  const processedItems = sources
    .map((s) => ({ source: s, processed: processedMap[s.id] }))
    .filter((x): x is { source: SourceItem; processed: ProcessedItem } => !!x.processed);
  const selectedForUpload = processedItems.filter((x) => x.processed.selectedForUpload);

  // === Polling logic (parallel for all active items) ===
  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    // Check if any items need polling
    const needsPolling = Object.values(uploadMap).some(
      (u) => u.polling && u.status !== "failed" && u.status !== "idle" && u.moderationState !== "Approved" && u.moderationState !== "Rejected",
    );

    if (!needsPolling || !account) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(async () => {
        const state = useConverter.getState();
        for (const [sourceId, upload] of Object.entries(state.uploadMap)) {
          if (!upload.polling) continue;
          if (upload.moderationState === "Approved" || upload.moderationState === "Rejected") continue;
          if (upload.status === "failed") continue;

          // Phase 1: Poll operation if we have operationId but no assetId
          if (upload.operationId && !upload.assetId) {
            try {
              const res = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(account.apiKey)}&operationId=${encodeURIComponent(upload.operationId)}`);
              const data = await safeFetchJson(res);
              if (data.ok && data.operationDone && data.assetId) {
                setUploadState(sourceId, { assetId: data.assetId, status: "uploaded", moderationState: "Pending" });
                // Update history
                if (upload.historyItemId) {
                  fetch(`/api/history?id=${upload.historyItemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadStatus: "uploaded", robloxAssetId: data.assetId, moderationStatus: "Pending" }),
                  });
                }
                refreshHistory();
              } else if (!data.ok && data.operationDone) {
                setUploadState(sourceId, { polling: false, status: "failed", error: data.error || "Operation gagal" });
                if (upload.historyItemId) {
                  fetch(`/api/history?id=${upload.historyItemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadStatus: "failed", uploadError: data.error }),
                  });
                }
                refreshHistory();
              }
            } catch {}
          }
          // Phase 2: Poll moderation if we have assetId
          else if (upload.assetId && upload.moderationState !== "Approved" && upload.moderationState !== "Rejected") {
            try {
              const res = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(account.apiKey)}&assetId=${encodeURIComponent(upload.assetId)}`);
              const data = await safeFetchJson(res);
              if (data.ok && data.moderationState) {
                const modState = data.moderationState as ModerationState;
                setUploadState(sourceId, { moderationState: modState, moderationReason: data.moderationReason || null });
                if (upload.historyItemId) {
                  fetch(`/api/history?id=${upload.historyItemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ moderationStatus: modState, moderationReason: data.moderationReason || null }),
                  });
                }
                if (modState === "Approved" || modState === "Rejected") {
                  setUploadState(sourceId, { polling: false });
                  refreshHistory();
                  if (modState === "Approved") {
                    toast.success("Audio disetujui!", { description: `Asset ${upload.assetId}` });
                  } else {
                    toast.error("Audio ditolak", { description: data.moderationReason || "Lihat di Roblox" });
                  }
                }
              }
            } catch {}
          }
        }
      }, 5000);
    }

    return () => {
      if (pollIntervalRef.current && !needsPolling) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [uploadMap, account, setUploadState, refreshHistory]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleVerify = async () => {
    if (!apiKey.trim()) { toast.error("Tempelkan API Key terlebih dahulu"); return; }
    if (!userId.trim()) { toast.error("User ID Roblox wajib diisi"); return; }
    if (useGroup && !groupId.trim()) { toast.error("Group ID wajib diisi"); return; }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/roblox/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), userId: Number(userId) }),
      });
      const data = await safeFetchJson(res);
      if (!data.ok || !data.user) throw new Error(data.error || "Verifikasi gagal");
      setAccount({
        id: String(data.user.id), apiKey: apiKey.trim(), userId: userId.trim(),
        username: data.user.name, displayName: data.user.displayName, avatarUrl: data.user.avatarUrl,
        groupId: useGroup ? groupId.trim() : undefined,
      });
      toast.success("API Key terverifikasi", { description: `${data.user.displayName} (@${data.user.name})` });
    } catch (e) {
      setVerifyError((e as Error).message);
      toast.error("Verifikasi gagal", { description: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  };

  const handleUploadAll = async () => {
    if (!account) { toast.error("Verifikasi API Key terlebih dahulu"); return; }
    if (selectedForUpload.length === 0) { toast.error("Pilih minimal 1 audio untuk diupload"); return; }
    setUploading(true);

    let success = 0;
    let failed = 0;

    for (const { source, processed } of selectedForUpload) {
      // Reset state for this item
      setUploadState(source.id, {
        status: "uploading", polling: false, error: undefined,
        assetId: undefined, operationId: undefined,
        moderationState: null, moderationReason: null, historyItemId: undefined,
      });

      // Save history record
      let historyItemId: string | undefined;
      try {
        const histRes = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: source.type, sourceUrl: source.url, sourceTitle: source.title,
            assetName: processed.assetName, originalFile: source.inputFile, processedFile: processed.fileName,
            duration: processed.duration, fileSize: processed.size,
            speed: settings.speed, pitch: settings.pitch, amplification: settings.amplification,
            bassBoost: settings.bassBoost, reverb: settings.reverb,
            bypassMode: detectBypassMode(settings), uploadStatus: "processing",
          }),
        });
        const histData = await safeFetchJson(histRes);
        historyItemId = histData.item?.id;
      } catch {}

      setUploadState(source.id, { historyItemId });

      // Create asset
      try {
        const res = await fetch("/api/roblox/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: account.apiKey, userId: Number(account.userId),
            groupId: account.groupId ? Number(account.groupId) : undefined,
            fileName: processed.fileName, assetName: processed.assetName,
          }),
        });
        const data = await safeFetchJson(res);
        if (!data.ok) throw new Error(data.error || "Upload gagal");

        if (data.assetId) {
          // Synchronous completion
          setUploadState(source.id, {
            status: "uploaded", assetId: data.assetId, moderationState: "Pending", polling: true,
          });
          if (historyItemId) {
            fetch(`/api/history?id=${historyItemId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uploadStatus: "uploaded", robloxAssetId: data.assetId, moderationStatus: "Pending" }),
            });
          }
          success++;
        } else if (data.operationId) {
          setUploadState(source.id, {
            status: "processing", operationId: data.operationId, polling: true,
          });
          success++;
        } else {
          throw new Error("Tidak menerima operationId dari Roblox");
        }
      } catch (e) {
        const msg = (e as Error).message;
        setUploadState(source.id, { status: "failed", error: msg, polling: false });
        failed++;
        if (historyItemId) {
          fetch(`/api/history?id=${historyItemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadStatus: "failed", uploadError: msg }),
          });
        }
        toast.error(`Gagal: ${processed.assetName}`, { description: msg });
      }
    }

    setUploading(false);
    refreshHistory();
    if (success > 0) {
      toast.success(`${success} audio terupload`, {
        description: failed > 0 ? `${failed} gagal` : "Menunggu moderasi Roblox...",
      });
    }
  };

  const handleLogout = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setAccount(null);
    setApiKey(""); setUserId(""); setGroupId(""); setUseGroup(false);
  };

  const totalPolling = Object.values(uploadMap).filter((u) => u.polling).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Upload ke Roblox</h3>
        {account && (
          <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> API Key Aktif
          </Badge>
        )}
      </div>

      {!account ? (
        <div className="space-y-3 rounded-xl border bg-card/30 p-3">
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2.5 text-xs">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Cara mendapatkan API Key Roblox:</p>
              <ol className="ml-3 list-decimal space-y-0.5 text-muted-foreground">
                <li>Buka{" "}
                  <a href="https://create.roblox.com/credentials" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
                    create.roblox.com/credentials <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Klik <b>Add API Key</b> → isi nama</li>
                <li>Tambah permission <b>Assets</b> → <b>Read &amp; Write</b></li>
                <li>Simpan &amp; salin API Key-nya</li>
              </ol>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5" /> API Key (Open Cloud)
            </Label>
            <Input id="apiKey" type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="RobloxOpenCloudKey_..." className="h-9 font-mono text-xs" autoComplete="off" />
            <button type="button" onClick={() => setShowApiKey((s) => !s)} className="text-[11px] text-muted-foreground hover:text-foreground">
              {showApiKey ? "Sembunyikan" : "Tampilkan"} API Key
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              {useGroup ? <Users className="h-3.5 w-3.5 text-muted-foreground" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
              <Label className="text-xs font-medium">{useGroup ? "Unggah ke Group" : "Unggah ke User saya"}</Label>
            </div>
            <Switch checked={useGroup} onCheckedChange={setUseGroup} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userId" className="flex items-center gap-1.5 text-xs">
              {useGroup ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {useGroup ? "Group ID" : "User ID Roblox"}
            </Label>
            <Input id="userId" value={useGroup ? groupId : userId}
              onChange={(e) => { if (useGroup) setGroupId(e.target.value.replace(/[^\d]/g, "")); else setUserId(e.target.value.replace(/[^\d]/g, "")); }}
              placeholder="1234567" className="h-9 font-mono text-sm" inputMode="numeric" />
            <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
              <LinkIcon className="mt-0.5 h-3 w-3 shrink-0" />
              {useGroup
                ? <>Lihat di URL grup: <code className="rounded bg-muted px-1 font-mono">roblox.com/groups/<b>1234567</b>/...</code></>
                : <>Lihat di URL profil: <code className="rounded bg-muted px-1 font-mono">roblox.com/users/<b>1234567</b>/profile</code></>
              }
            </p>
          </div>
          {verifyError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{verifyError}</span>
            </div>
          )}
          <Button onClick={handleVerify} disabled={verifying || !apiKey.trim() || (!useGroup ? !userId.trim() : !groupId.trim())} className="w-full gap-2" variant="secondary">
            {verifying ? (<><Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...</>) : (<><ShieldCheck className="h-4 w-4" /> Verifikasi API Key</>)}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Account card */}
          <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                  {account.username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{account.displayName}</p>
              <p className="truncate text-[10px] text-muted-foreground">@{account.username} · ID: {account.userId}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Upload queue */}
          {processedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Antrian Upload ({processedItems.length})</span>
                {totalPolling > 0 && (
                  <Badge variant="secondary" className="gap-1 text-[9px]">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> {totalPolling} polling
                  </Badge>
                )}
                <div className="ml-auto flex gap-1">
                  <button onClick={() => selectAllProcessed(true)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">Semua</button>
                  <button onClick={() => selectAllProcessed(false)} className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">Kosongkan</button>
                </div>
              </div>
              <ScrollArea className="max-h-[360px] scrollbar-custom pr-1">
                <div className="space-y-2">
                  {processedItems.map(({ source, processed }) => (
                    <UploadItemCard
                      key={source.id}
                      source={source}
                      processed={processed}
                      upload={uploadMap[source.id]}
                      onToggle={() => toggleProcessedSelected(source.id)}
                      onAssetNameChange={(name) => {
                        useConverter.getState().setProcessed(source.id, { ...processed, assetName: name });
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {processedItems.length === 0 && (
            <div className="flex h-[100px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-center">
              <UploadCloud className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Proses audio terlebih dahulu untuk upload</p>
            </div>
          )}

          <Button onClick={handleUploadAll} disabled={uploading || selectedForUpload.length === 0} className="w-full gap-2" size="lg">
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah {selectedForUpload.length} audio...</>
            ) : (
              <><UploadCloud className="h-4 w-4" /> Upload {selectedForUpload.length > 0 ? `${selectedForUpload.length} Audio` : "ke Roblox"}</>
            )}
          </Button>
          {selectedForUpload.length === 0 && processedItems.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">Pilih minimal 1 audio untuk diupload</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Per-item upload card with status + moderation */
function UploadItemCard({
  source, processed, upload, onToggle, onAssetNameChange,
}: {
  source: SourceItem;
  processed: ProcessedItem;
  upload?: import("@/lib/store").UploadState;
  onToggle: () => void;
  onAssetNameChange: (name: string) => void;
}) {
  const cfg = getModConfig(upload?.moderationState ?? null);
  const Icon = cfg.icon;
  const isBusy = upload?.status === "uploading" || upload?.status === "processing" || upload?.polling;

  return (
    <div className={cn("rounded-lg border p-2.5 transition-colors", processed.selectedForUpload ? "border-primary/30 bg-card/60" : "border-border bg-card/30 opacity-70")}>
      <div className="flex items-center gap-2">
        <Checkbox checked={processed.selectedForUpload} onCheckedChange={onToggle} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <Input
            value={processed.assetName}
            onChange={(e) => onAssetNameChange(e.target.value.slice(0, 50))}
            maxLength={50}
            placeholder="Nama aset"
            className="h-7 border-none bg-transparent px-0 text-xs font-semibold shadow-none focus-visible:ring-0"
          />
        </div>
        {upload?.status === "uploaded" || upload?.assetId ? (
          <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: cfg.color }}>
            <Icon className={cn("h-3 w-3", upload?.moderationState === "Reviewing" && "animate-spin")} />
            {cfg.label}
          </span>
        ) : upload?.status === "uploading" || upload?.status === "processing" ? (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> {upload.status === "uploading" ? "Mengirim..." : "Memproses..."}
          </span>
        ) : upload?.status === "failed" ? (
          <span className="flex items-center gap-1 text-[10px] text-destructive">
            <XCircle className="h-3 w-3" /> Gagal
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Siap upload</span>
        )}
      </div>

      {/* Error */}
      {upload?.error && (
        <p className="mt-1 line-clamp-2 text-[10px] text-destructive/80">{upload.error}</p>
      )}

      {/* Asset ID + link */}
      {upload?.assetId && (
        <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2 py-1">
          <code className="font-mono text-[10px] font-bold">{upload.assetId}</code>
          <a href={`https://www.roblox.com/library/${upload.assetId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline">
            <ExternalLink className="h-2.5 w-2.5" /> Roblox
          </a>
        </div>
      )}

      {/* Moderation reason */}
      {upload?.moderationState === "Rejected" && upload?.moderationReason && (
        <p className="mt-1 text-[10px] text-destructive">Alasan: {upload.moderationReason}</p>
      )}
    </div>
  );
}

function getModConfig(state: ModerationState | null) {
  switch (state) {
    case "Approved":
      return { icon: CheckCircle2, label: "Disetujui", color: "#10b981" };
    case "Rejected":
      return { icon: XCircle, label: "Ditolak", color: "#ef4444" };
    case "Reviewing":
      return { icon: RefreshCw, label: "Direview", color: "#3b82f6" };
    case "Pending":
      return { icon: Clock, label: "Menunggu", color: "#f59e0b" };
    default:
      return { icon: CheckCircle2, label: "Sukses", color: "#10b981" };
  }
}

function detectBypassMode(s: { speed: number; pitch: number; amplification: number; bassBoost: number; reverb: number; volumeNormalize: boolean }) {
  if (s.speed === 1 && s.pitch === 0 && s.bassBoost === 0 && s.reverb === 0) return "none";
  if (s.pitch !== 0 && s.speed !== 1) return "pitch_speed";
  if (s.pitch !== 0) return "pitch";
  if (s.speed !== 1) return "speed";
  if (s.bassBoost !== 0 || s.reverb !== 0) return "bass";
  return "custom";
}
