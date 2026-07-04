"use client";

import * as React from "react";
import {
  ShieldCheck, Loader2, UploadCloud, LogOut, ExternalLink, KeyRound,
  CheckCircle2, AlertTriangle, Info, User, Users, BookOpen, Link as LinkIcon,
  Clock, XCircle, RefreshCw,
} from "lucide-react";
import { useConverter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ModerationState = "Pending" | "Reviewing" | "Approved" | "Rejected" | "Unknown";

/** Safely parse a fetch response as JSON, handling HTML error pages gracefully */
async function safeFetchJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error(`Server mengembalikan halaman HTML, bukan JSON. Kemungkinan timeout atau server error. Coba lagi.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respon tidak valid: ${text.slice(0, 100)}`);
  }
}

export function RobloxPanel() {
  const {
    source, processed, settings, account,
    verifying, verifyError, uploading, uploadProgress, uploadError, uploadResult,
    moderationState, moderationReason, moderationPolling,
    setAccount, setVerifying, setVerifyError,
    setUploading, setUploadProgress, setUploadError, setUploadResult,
    setModerationState, setModerationReason, setModerationPolling,
    refreshHistory, resetProcessed,
  } = useConverter();

  const [apiKey, setApiKey] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [useGroup, setUseGroup] = React.useState(false);
  const [groupId, setGroupId] = React.useState("");
  const [assetName, setAssetName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [historyItemId, setHistoryItemId] = React.useState<string | null>(null);

  // Refs for polling (avoid stale closures)
  const pollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPollRef = React.useRef(false);

  React.useEffect(() => {
    if (source && !assetName) {
      const t = source.title || "Audio";
      setAssetName(t.slice(0, 45));
    }
  }, [source, assetName]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      stopPollRef.current = true;
      if (pollRef.current) clearTimeout(pollRef.current);
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
        id: String(data.user.id),
        apiKey: apiKey.trim(),
        userId: userId.trim(),
        username: data.user.name,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl,
        groupId: useGroup ? groupId.trim() : undefined,
      });
      toast.success("API Key terverifikasi", {
        description: `${data.user.displayName} (@${data.user.name}) · ID ${data.user.id}`,
      });
    } catch (e) {
      setVerifyError((e as Error).message);
      toast.error("Verifikasi gagal", { description: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  };

  /** Save a history record and return its ID for later updates */
  const saveHistory = async (status: string, extra: Record<string, any> = {}): Promise<string | null> => {
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: source?.type,
          sourceUrl: source?.url,
          sourceTitle: source?.title,
          assetName: assetName.trim(),
          description: description.trim(),
          originalFile: source?.inputFile || "",
          processedFile: processed?.fileName || "",
          duration: processed?.duration || 0,
          fileSize: processed?.size || 0,
          speed: settings.speed,
          pitch: settings.pitch,
          amplification: settings.amplification,
          bassBoost: settings.bassBoost,
          reverb: settings.reverb,
          bypassMode: detectBypassMode(settings),
          uploadStatus: status,
          ...extra,
        }),
      });
      const data = await safeFetchJson(res);
      return data.item?.id || null;
    } catch { return null; }
  };

  /** Update an existing history record's moderation status */
  const updateHistory = async (id: string, updates: Record<string, any>) => {
    try {
      await fetch(`/api/history?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {}
  };

  /** Poll operation status until done, then poll moderation status */
  const pollStatus = async (apiKey: string, operationId: string) => {
    stopPollRef.current = false;
    setModerationPolling(true);
    setModerationState(null);

    // Phase 1: Poll operation until done (max 60s)
    let assetId: string | null = null;
    for (let i = 0; i < 40; i++) {
      if (stopPollRef.current) { setModerationPolling(false); return; }
      await sleep(2000);
      try {
        const res = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(apiKey)}&operationId=${encodeURIComponent(operationId)}`);
        const data = await safeFetchJson(res);
        if (data.ok && data.operationDone && data.assetId) {
          assetId = data.assetId;
          break;
        }
        if (!data.ok && data.operationDone) {
          // Operation failed
          throw new Error(data.error || "Operation gagal");
        }
        setUploadProgress(Math.min(85, 30 + i * 1.5));
      } catch (e) {
        if (stopPollRef.current) { setModerationPolling(false); return; }
        throw e;
      }
    }

    if (!assetId) {
      setModerationPolling(false);
      setUploadError("Timeout: operation belum selesai setelah 80 detik. Cek Roblox Studio untuk verifikasi.");
      setUploadProgress(0);
      if (historyItemId) await updateHistory(historyItemId, { uploadStatus: "failed", uploadError: "Operation timeout" });
      return;
    }

    // Operation done — we have the assetId!
    setUploadProgress(95);
    setUploadResult({ assetId });
    if (historyItemId) await updateHistory(historyItemId, { uploadStatus: "uploaded", robloxAssetId: assetId });
    toast.success("Upload berhasil!", { description: `Asset ID: ${assetId}` });

    // Phase 2: Poll moderation status (max 5 minutes)
    setModerationState("Pending");
    if (historyItemId) await updateHistory(historyItemId, { moderationStatus: "Pending" });

    for (let i = 0; i < 60; i++) {
      if (stopPollRef.current) { setModerationPolling(false); return; }
      await sleep(5000);
      try {
        const res = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(apiKey)}&assetId=${encodeURIComponent(assetId)}`);
        const data = await safeFetchJson(res);
        if (data.ok && data.moderationState) {
          const state = data.moderationState as ModerationState;
          setModerationState(state);
          if (data.moderationReason) setModerationReason(data.moderationReason);
          if (historyItemId) {
            await updateHistory(historyItemId, {
              moderationStatus: state,
              moderationReason: data.moderationReason || null,
            });
          }
          // Stop polling if we reach a terminal state
          if (state === "Approved" || state === "Rejected") {
            setModerationPolling(false);
            setUploadProgress(100);
            refreshHistory();
            if (state === "Approved") {
              toast.success("Audio disetujui Roblox!", { description: `Asset ${assetId} lulus moderasi` });
            } else {
              toast.error("Audio ditolak Roblox", { description: data.moderationReason || "Lihat detail di Roblox Creator" });
            }
            return;
          }
        }
      } catch {
        // Network error, keep polling
      }
    }

    // Timeout — still pending
    setModerationPolling(false);
    refreshHistory();
  };

  const handleUpload = async () => {
    if (!account) { toast.error("Verifikasi API Key terlebih dahulu"); return; }
    if (!processed) { toast.error("Proses audio terlebih dahulu"); return; }
    if (!assetName.trim()) { toast.error("Nama aset wajib diisi"); return; }

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setModerationState(null);
    setModerationReason(null);
    setUploadProgress(5);

    // Save initial history record
    const histId = await saveHistory("processing");
    setHistoryItemId(histId);

    try {
      // Phase 1: Create the asset (fast, returns operationId)
      let prog = 5;
      const progInterval = setInterval(() => {
        prog = Math.min(25, prog + Math.random() * 3);
        setUploadProgress(prog);
      }, 500);

      const res = await fetch("/api/roblox/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: account.apiKey,
          userId: Number(account.userId),
          groupId: account.groupId ? Number(account.groupId) : undefined,
          fileName: processed.fileName,
          assetName: assetName.trim(),
          description: description.trim(),
        }),
      });
      const data = await safeFetchJson(res);
      clearInterval(progInterval);

      if (!data.ok) throw new Error(data.error || "Upload gagal");

      // If we got an assetId immediately (synchronous), skip operation polling
      if (data.assetId) {
        setUploadProgress(95);
        setUploadResult({ assetId: data.assetId });
        if (histId) await updateHistory(histId, { uploadStatus: "uploaded", robloxAssetId: data.assetId });
        toast.success("Upload berhasil!", { description: `Asset ID: ${data.assetId}` });

        // Start moderation polling
        setUploading(false);
        pollStatus(account.apiKey, ""); // empty operationId → go straight to moderation
        // But we need to pass assetId directly. Let's handle this:
        setModerationPolling(true);
        setModerationState("Pending");
        if (histId) await updateHistory(histId, { moderationStatus: "Pending" });
        for (let i = 0; i < 60; i++) {
          if (stopPollRef.current) { setModerationPolling(false); return; }
          await sleep(5000);
          try {
            const sres = await fetch(`/api/roblox/status?apiKey=${encodeURIComponent(account.apiKey)}&assetId=${encodeURIComponent(data.assetId)}`);
            const sdata = await safeFetchJson(sres);
            if (sdata.ok && sdata.moderationState) {
              const state = sdata.moderationState as ModerationState;
              setModerationState(state);
              if (sdata.moderationReason) setModerationReason(sdata.moderationReason);
              if (histId) await updateHistory(histId, { moderationStatus: state, moderationReason: sdata.moderationReason || null });
              if (state === "Approved" || state === "Rejected") {
                setModerationPolling(false);
                setUploadProgress(100);
                refreshHistory();
                if (state === "Approved") toast.success("Audio disetujui!", {});
                else toast.error("Audio ditolak", { description: sdata.moderationReason });
                return;
              }
            }
          } catch {}
        }
        setModerationPolling(false);
        refreshHistory();
        return;
      }

      if (!data.operationId) throw new Error("Tidak menerima operationId dari Roblox");

      // Phase 2: Poll operation + moderation status
      setUploadProgress(30);
      setUploading(false);
      await pollStatus(account.apiKey, data.operationId);
    } catch (e) {
      const msg = (e as Error).message;
      setUploadError(msg);
      setUploadProgress(0);
      toast.error("Upload gagal", { description: msg });
      if (histId) await updateHistory(histId, { uploadStatus: "failed", uploadError: msg });
      refreshHistory();
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    stopPollRef.current = true;
    if (pollRef.current) clearTimeout(pollRef.current);
    setAccount(null);
    setApiKey("");
    setUserId("");
    setGroupId("");
    setUseGroup(false);
    setUploadResult(null);
    setUploadError(null);
    setModerationState(null);
    setModerationReason(null);
    setModerationPolling(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Upload ke Roblox</h3>
        {account && (
          <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> API Key Aktif
          </Badge>
        )}
      </div>

      {/* Account verification */}
      {!account ? (
        <div className="space-y-3 rounded-xl border bg-card/30 p-3">
          {/* Docs helper */}
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

          {/* API Key input */}
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5" /> API Key (Open Cloud)
            </Label>
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RobloxOpenCloudKey_..."
              className="h-9 font-mono text-xs"
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowApiKey((s) => !s)} className="text-[11px] text-muted-foreground hover:text-foreground">
              {showApiKey ? "Sembunyikan" : "Tampilkan"} API Key
            </button>
          </div>

          {/* User/Group toggle */}
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              {useGroup ? <Users className="h-3.5 w-3.5 text-muted-foreground" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
              <Label className="text-xs font-medium">{useGroup ? "Unggah ke Group" : "Unggah ke User saya"}</Label>
            </div>
            <Switch checked={useGroup} onCheckedChange={setUseGroup} />
          </div>

          {/* User ID / Group ID */}
          <div className="space-y-1.5">
            <Label htmlFor="userId" className="flex items-center gap-1.5 text-xs">
              {useGroup ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {useGroup ? "Group ID" : "User ID Roblox"}
            </Label>
            <Input
              id="userId"
              value={useGroup ? groupId : userId}
              onChange={(e) => {
                if (useGroup) setGroupId(e.target.value.replace(/[^\d]/g, ""));
                else setUserId(e.target.value.replace(/[^\d]/g, ""));
              }}
              placeholder={useGroup ? "1234567" : "1234567"}
              className="h-9 font-mono text-sm"
              inputMode="numeric"
            />
            {!useGroup && (
              <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
                <LinkIcon className="mt-0.5 h-3 w-3 shrink-0" />
                Lihat angka di URL profil Roblox Anda, contoh:
                <code className="rounded bg-muted px-1 font-mono">roblox.com/users/<b>1234567</b>/profile</code>
              </p>
            )}
            {useGroup && (
              <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
                <LinkIcon className="mt-0.5 h-3 w-3 shrink-0" />
                Lihat angka di URL grup Roblox, contoh:
                <code className="rounded bg-muted px-1 font-mono">roblox.com/groups/<b>1234567</b>/...</code>
              </p>
            )}
          </div>

          {verifyError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
          <Button onClick={handleVerify} disabled={verifying || !apiKey.trim() || (!useGroup ? !userId.trim() : !groupId.trim())} className="w-full gap-2" variant="secondary">
            {verifying ? (<><Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...</>) : (<><ShieldCheck className="h-4 w-4" /> Verifikasi API Key</>)}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Account card */}
          <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                  {account.username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{account.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{account.username} · ID: {account.userId}
                {account.groupId && ` · Group: ${account.groupId}`}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Asset details */}
          <div className="space-y-3 rounded-xl border bg-card/30 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="assetName" className="text-xs">Nama Aset</Label>
              <Input id="assetName" value={assetName} onChange={(e) => setAssetName(e.target.value)} maxLength={50} placeholder="Nama audio di Roblox" className="h-9" />
              <p className="text-right text-[10px] text-muted-foreground">{assetName.length}/50</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs">Deskripsi (opsional)</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Deskripsi singkat..." className="resize-none text-xs" rows={2} />
            </div>
          </div>

          {/* Upload progress */}
          {(uploading || (uploadProgress > 0 && uploadProgress < 100)) && (
            <div className="space-y-2 rounded-xl border bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {uploadProgress < 30 ? "Mengirim audio ke Roblox..." : uploadProgress < 90 ? "Memproses di server Roblox..." : "Menyelesaikan..."} {Math.round(uploadProgress)}%
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Upload success + moderation status */}
          {uploadResult && (
            <ModerationStatusCard
              assetId={uploadResult.assetId}
              state={moderationState}
              reason={moderationReason}
              polling={moderationPolling}
            />
          )}

          {uploadError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading || !processed || moderationPolling} className="w-full gap-2" size="lg">
            {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...</>) : moderationPolling ? (<><Loader2 className="h-4 w-4 animate-spin" /> Menunggu moderasi...</>) : (<><UploadCloud className="h-4 w-4" /> {uploadResult ? "Upload Ulang" : "Upload ke Roblox"}</>)}
          </Button>
          {!processed && <p className="text-center text-xs text-muted-foreground">Proses audio terlebih dahulu sebelum upload</p>}
        </div>
      )}
    </div>
  );
}

/** Moderation status card with real-time state */
function ModerationStatusCard({
  assetId, state, reason, polling,
}: {
  assetId: string;
  state: ModerationState | null;
  reason: string | null;
  polling: boolean;
}) {
  const config = getModerationConfig(state);
  const Icon = config.icon;

  return (
    <div className={cn("space-y-2 rounded-xl border p-3", config.border, config.bg)}>
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: config.color }}>
        <Icon className={cn("h-4 w-4", polling && config.spin && "animate-spin")} />
        {config.label}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5">
        <span className="text-xs text-muted-foreground">Asset ID</span>
        <code className="font-mono text-xs font-bold">{assetId}</code>
      </div>
      {polling && (
        <p className="text-[11px] text-muted-foreground">
          {state === "Pending" || state === "Reviewing"
            ? "Sedang menunggu hasil moderasi Roblox. Audio Anda sudah tersedia di Roblox Studio — moderasi hanya menentukan apakah bisa dipakai publik."
            : "Memeriksa status..."}
        </p>
      )}
      {state === "Rejected" && reason && (
        <p className="text-[11px] text-destructive">Alasan: {reason}</p>
      )}
      <a href={`https://www.roblox.com/library/${assetId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        Lihat di Roblox <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function getModerationConfig(state: ModerationState | null) {
  switch (state) {
    case "Approved":
      return { icon: CheckCircle2, label: "Audio Disetujui!", color: "#10b981", border: "border-emerald-500/30", bg: "bg-emerald-500/10", spin: false };
    case "Rejected":
      return { icon: XCircle, label: "Audio Ditolak Roblox", color: "#ef4444", border: "border-destructive/30", bg: "bg-destructive/10", spin: false };
    case "Reviewing":
      return { icon: RefreshCw, label: "Sedang Direview...", color: "#3b82f6", border: "border-blue-500/30", bg: "bg-blue-500/10", spin: true };
    case "Pending":
    default:
      return { icon: Clock, label: "Menunggu Moderasi...", color: "#f59e0b", border: "border-amber-500/30", bg: "bg-amber-500/10", spin: false };
  }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function detectBypassMode(s: { speed: number; pitch: number; amplification: number; bassBoost: number; reverb: number; volumeNormalize: boolean }) {
  if (s.speed === 1 && s.pitch === 0 && s.bassBoost === 0 && s.reverb === 0) return "none";
  if (s.pitch !== 0 && s.speed !== 1) return "pitch_speed";
  if (s.pitch !== 0) return "pitch";
  if (s.speed !== 1) return "speed";
  if (s.bassBoost !== 0 || s.reverb !== 0) return "bass";
  return "custom";
}
