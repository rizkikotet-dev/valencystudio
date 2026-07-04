"use client";

import * as React from "react";
import { ShieldCheck, Loader2, UploadCloud, LogOut, ExternalLink, KeyRound, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useConverter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

  const [cookie, setCookie] = React.useState("");
  const [assetName, setAssetName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showCookie, setShowCookie] = React.useState(false);

  // Auto-fill asset name from source title
  React.useEffect(() => {
    if (source && !assetName) {
      const t = source.title || "Audio";
      setAssetName(t.slice(0, 45));
    }
  }, [source, assetName]);

  const handleVerify = async () => {
    if (!cookie.trim()) {
      toast.error("Tempelkan cookie .ROBLOSECURITY terlebih dahulu");
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/roblox/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookie.trim() }),
      });
      const data = await res.json();
      if (!data.ok || !data.user) throw new Error(data.error || "Verifikasi gagal");
      setAccount({
        id: String(data.user.id),
        username: data.user.name,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl,
        cookie: cookie.trim(),
        csrfToken: data.csrfToken,
        userId: String(data.user.id),
      });
      toast.success("Akun Roblox terverifikasi", {
        description: `${data.user.displayName} (@${data.user.name})`,
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
      toast.error("Verifikasi akun Roblox terlebih dahulu");
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
    setUploadProgress(10);
    try {
      // simulate progress increments while the real upload runs
      const progInterval = setInterval(() => {
        setUploadProgress(Math.min(90, useConverter.getState().uploadProgress + Math.random() * 15));
      }, 400);

      const res = await fetch("/api/roblox/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookie: account.cookie,
          csrfToken: account.csrfToken,
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
      // save failed record to history
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
    setCookie("");
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
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Terverifikasi
          </Badge>
        )}
      </div>

      {/* Account verification */}
      {!account ? (
        <div className="space-y-3 rounded-xl border bg-card/30 p-3">
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>
              Tempelkan cookie <code className="rounded bg-muted px-1 font-mono">.ROBLOSECURITY</code> dari browser Anda.
              Cookie disimpan lokal dan hanya digunakan untuk upload.{" "}
              <a
                href="https://www.roblox.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                Buka Roblox <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cookie" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5" /> Cookie .ROBLOSECURITY
            </Label>
            <div className="relative">
              <Textarea
                id="cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="_|WARNING:-DO-NOT-SHARE-THIS..."
                className={cn("h-20 resize-none font-mono text-xs", !showCookie && "text-security")}
                style={!showCookie ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCookie((s) => !s)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                {showCookie ? "Sembunyikan" : "Tampilkan"} cookie
              </button>
            </div>
          </div>
          {verifyError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
          <Button onClick={handleVerify} disabled={verifying || !cookie.trim()} className="w-full gap-2" variant="secondary">
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Verifikasi Akun
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
              <p className="truncate text-xs text-muted-foreground">@{account.username} · ID: {account.userId}</p>
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
                Mengunggah ke Roblox... {Math.round(uploadProgress)}%
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
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
