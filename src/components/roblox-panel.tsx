"use client";

import * as React from "react";
import {
  ShieldCheck, Loader2, UploadCloud, LogOut, ExternalLink, KeyRound,
  CheckCircle2, AlertTriangle, Info, User, Users, BookOpen, Link as LinkIcon,
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

export function RobloxPanel() {
  const {
    source,
    processed,
    settings,
    account,
    verifying,
    verifyError,
    uploading,
    uploadProgress,
    uploadError,
    uploadResult,
    setAccount,
    setVerifying,
    setVerifyError,
    setUploading,
    setUploadProgress,
    setUploadError,
    setUploadResult,
    refreshHistory,
    resetProcessed,
  } = useConverter();

  const [apiKey, setApiKey] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [useGroup, setUseGroup] = React.useState(false);
  const [groupId, setGroupId] = React.useState("");
  const [assetName, setAssetName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Auto-fill asset name from source title
  React.useEffect(() => {
    if (source && !assetName) {
      const t = source.title || "Audio";
      setAssetName(t.slice(0, 45));
    }
  }, [source, assetName]);

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      toast.error("Tempelkan API Key terlebih dahulu");
      return;
    }
    if (!userId.trim()) {
      toast.error("User ID Roblox wajib diisi");
      return;
    }
    if (useGroup && !groupId.trim()) {
      toast.error("Group ID wajib diisi bila mengunggah ke grup");
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/roblox/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), userId: Number(userId) }),
      });
      const data = await res.json();
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

  const handleUpload = async () => {
    if (!account) {
      toast.error("Verifikasi API Key terlebih dahulu");
      return;
    }
    if (!processed) {
      toast.error("Proses audio terlebih dahulu sebelum upload");
      return;
    }
    if (!assetName.trim()) {
      toast.error("Nama aset wajib diisi");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setUploadProgress(5);
    try {
      // Simulate progress while the real upload + polling runs
      let prog = 5;
      const progInterval = setInterval(() => {
        prog = Math.min(85, prog + Math.random() * 8);
        setUploadProgress(prog);
      }, 800);

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
      const data = await res.json();
      clearInterval(progInterval);
      setUploadProgress(100);

      if (!data.ok) throw new Error(data.error || "Upload gagal");

      setUploadResult({ assetId: data.assetId });
      toast.success("Upload berhasil!", {
        description: `Asset ID: ${data.assetId}`,
      });

      // Save to history
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: source?.type,
            sourceUrl: source?.url,
            sourceTitle: source?.title,
            assetName: assetName.trim(),
            description: description.trim(),
            originalFile: source?.inputFile || "",
            processedFile: processed.fileName,
            duration: processed.duration,
            fileSize: processed.size,
            speed: settings.speed,
            pitch: settings.pitch,
            amplification: settings.amplification,
            bassBoost: settings.bassBoost,
            reverb: settings.reverb,
            bypassMode: detectBypassMode(settings),
            robloxAssetId: data.assetId,
            uploadStatus: "uploaded",
          }),
        });
      } catch {}
      refreshHistory();
    } catch (e) {
      setUploadError((e as Error).message);
      toast.error("Upload gagal", { description: (e as Error).message });
      try {
        await fetch("/api/history", {
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
            uploadStatus: "failed",
            uploadError: (e as Error).message,
          }),
        });
      } catch {}
      refreshHistory();
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    setAccount(null);
    setApiKey("");
    setUserId("");
    setGroupId("");
    setUseGroup(false);
    setUploadResult(null);
    setUploadError(null);
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
            <button
              type="button"
              onClick={() => setShowApiKey((s) => !s)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? "Sembunyikan" : "Tampilkan"} API Key
            </button>
          </div>

          {/* User/Group toggle */}
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              {useGroup ? <Users className="h-3.5 w-3.5 text-muted-foreground" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
              <Label className="text-xs font-medium">
                {useGroup ? "Unggah ke Group" : "Unggah ke User saya"}
              </Label>
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
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Verifikasi API Key
              </>
            )}
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
              <Input
                id="assetName"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                maxLength={50}
                placeholder="Nama audio di Roblox"
                className="h-9"
              />
              <p className="text-right text-[10px] text-muted-foreground">{assetName.length}/50</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs">Deskripsi (opsional)</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                placeholder="Deskripsi singkat..."
                className="resize-none text-xs"
                rows={2}
              />
            </div>
          </div>

          {/* Upload progress / result */}
          {uploading && (
            <div className="space-y-2 rounded-xl border bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {uploadProgress < 50 ? "Mengunggah ke Roblox..." : uploadProgress < 90 ? "Memproses asset di server Roblox..." : "Menyelesaikan..."} {Math.round(uploadProgress)}%
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Upload via Open Cloud API memerlukan polling operation hingga selesai (biasanya 5-20 detik).
              </p>
            </div>
          )}

          {uploadResult && (
            <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Upload Berhasil!
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">Asset ID</span>
                <code className="font-mono text-xs font-bold">{uploadResult.assetId}</code>
              </div>
              <a
                href={`https://www.roblox.com/library/${uploadResult.assetId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Lihat di Roblox <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !processed}
            className="w-full gap-2"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> Upload ke Roblox
              </>
            )}
          </Button>
          {!processed && (
            <p className="text-center text-xs text-muted-foreground">
              Proses audio terlebih dahulu sebelum upload
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function detectBypassMode(s: { speed: number; pitch: number; amplification: number; bassBoost: number; reverb: number; volumeNormalize: boolean }) {
  if (s.speed === 1 && s.pitch === 0 && s.bassBoost === 0 && s.reverb === 0) return "none";
  if (s.pitch !== 0 && s.speed !== 1) return "pitch_speed";
  if (s.pitch !== 0) return "pitch";
  if (s.speed !== 1) return "speed";
  if (s.bassBoost !== 0 || s.reverb !== 0) return "bass";
  return "custom";
}
