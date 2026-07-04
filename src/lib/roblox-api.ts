/**
 * Roblox Open Cloud API helpers (server-side only).
 *
 * Uses API Key authentication via the `x-api-key` header.
 *
 * Upload flow (split into phases to avoid long-running requests):
 *  1. createAudioAsset() → POST /assets/v1/assets → returns { path: "operations/<opId>" }
 *  2. getOperationStatus() → GET /assets/v1/operations/<opId> → returns { done, response?: { assetId } }
 *  3. getAssetModerationStatus() → GET /assets/v1/assets/<assetId> → returns { moderationResult: { state } }
 *
 * Moderation states: "Pending" | "Reviewing" | "Approved" | "Rejected"
 */

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  avatarUrl?: string;
}

export interface RobloxVerifyResult {
  ok: boolean;
  user?: RobloxUser;
  apiKeyValid?: boolean;
  error?: string;
}

export interface RobloxCreateParams {
  apiKey: string;
  audioBuffer: Buffer;
  fileName: string;
  assetName: string;
  description?: string;
  userId: number;
  groupId?: number;
}

export interface RobloxCreateResult {
  ok: boolean;
  operationId?: string;
  assetId?: string; // present if operation completed synchronously
  error?: string;
}

export type ModerationState = "Pending" | "Reviewing" | "Approved" | "Rejected" | "Unknown";

export interface RobloxStatusResult {
  ok: boolean;
  phase: "operation" | "moderation";
  operationDone?: boolean;
  assetId?: string;
  moderationState?: ModerationState;
  moderationReason?: string;
  error?: string;
}

/** Fetch a Roblox user's public profile (no auth required) */
async function fetchRobloxUser(userId: number): Promise<RobloxUser | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!res.ok) return null;
    const j = await res.json();
    let avatarUrl: string | undefined;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
      );
      if (thumbRes.ok) {
        const thumbJson = await thumbRes.json();
        if (thumbJson.data && thumbJson.data[0]) avatarUrl = thumbJson.data[0].imageUrl;
      }
    } catch {}
    return {
      id: j.id,
      name: j.name,
      displayName: j.displayName,
      description: j.description,
      avatarUrl,
    };
  } catch {
    return null;
  }
}

/** Verify the API key by making a lightweight call to the operations endpoint. */
async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://apis.roblox.com/assets/v1/operations/verify-${Date.now()}`, {
      headers: { "x-api-key": apiKey },
    });
    if (res.status === 401 || res.status === 403) return false;
    return true;
  } catch {
    return false;
  }
}

/** Verify an API Key + Roblox userId combination. */
export async function verifyRobloxApiKey(
  apiKey: string,
  userId: number,
): Promise<RobloxVerifyResult> {
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, error: "API Key wajib diisi" };
  }
  if (!userId || userId <= 0) {
    return { ok: false, error: "User ID Roblox wajib diisi" };
  }

  const user = await fetchRobloxUser(userId);
  if (!user) {
    return { ok: false, error: "User ID Roblox tidak ditemukan. Periksa kembali angka pada URL profil Anda." };
  }

  const apiKeyValid = await verifyApiKey(apiKey.trim());
  if (!apiKeyValid) {
    return { ok: false, error: "API Key tidak valid atau tidak memiliki permission assets:read. Pastikan Anda membuat API Key di create.roblox.com/credentials dengan scope Assets (Read+Write).", user };
  }

  return { ok: true, user, apiKeyValid: true };
}

/** Safely parse JSON from a Response, returning null on failure */
async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith("<") || text.trim().startsWith("<!")) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Phase 1: Create an audio asset via the Open Cloud Assets API.
 *  Returns the operationId for polling (or assetId if completed synchronously). */
export async function createAudioAsset(params: RobloxCreateParams): Promise<RobloxCreateResult> {
  const { apiKey, audioBuffer, fileName, assetName, description = "", userId, groupId } = params;

  if (!apiKey) return { ok: false, error: "API Key wajib diisi" };
  if (!userId) return { ok: false, error: "User ID wajib diisi" };
  if (!audioBuffer || audioBuffer.length === 0) return { ok: false, error: "Audio buffer kosong" };

  const boundary = `----robloxaudio${Date.now()}${Math.random().toString(36).slice(2)}`;
  const requestPayload = {
    assetType: "Audio",
    displayName: assetName.slice(0, 50),
    description: (description || "").slice(0, 200),
    creationContext: {
      creator: groupId ? { groupId: String(groupId) } : { userId: String(userId) },
    },
  };

  const fileContentType = fileName.toLowerCase().endsWith(".ogg")
    ? "audio/ogg"
    : fileName.toLowerCase().endsWith(".wav")
    ? "audio/wav"
    : fileName.toLowerCase().endsWith(".flac")
    ? "audio/flac"
    : "audio/mpeg";

  const parts: Buffer[] = [];
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="request"\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${JSON.stringify(requestPayload)}\r\n`,
    ),
  );
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="fileContent"; filename="${fileName.replace(/[^\w.\-]/g, "_")}"\r\n` +
        `Content-Type: ${fileContentType}\r\n\r\n`,
    ),
  );
  parts.push(audioBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  let createRes: Response;
  try {
    createRes = await fetch("https://apis.roblox.com/assets/v1/assets", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    });
  } catch (e) {
    return { ok: false, error: `Gagal terhubung ke Roblox API: ${(e as Error).message}` };
  }

  if (createRes.status === 401 || createRes.status === 403) {
    const errJson = await safeJson(createRes);
    const msg = errJson?.message || errJson?.error || "API Key tidak valid atau tidak punya permission assets:write";
    return { ok: false, error: msg };
  }
  if (createRes.status === 429) {
    return { ok: false, error: "Rate limit tercapai (429). Coba lagi beberapa menit lagi." };
  }

  const createJson = await safeJson(createRes);
  if (!createRes.ok) {
    const msg = createJson?.message || createJson?.error || `HTTP ${createRes.status}`;
    return { ok: false, error: `Roblox API error: ${msg}` };
  }

  // Check if operation completed synchronously (some responses include the asset directly)
  if (createJson?.response?.assetId) {
    return { ok: true, assetId: String(createJson.response.assetId) };
  }
  if (createJson?.assetId) {
    return { ok: true, assetId: String(createJson.assetId) };
  }

  // Otherwise, extract the operation ID for polling
  const opPath: string | undefined = createJson?.path;
  if (!opPath) {
    return { ok: false, error: `Respon tidak terduga dari Roblox: ${JSON.stringify(createJson).slice(0, 300)}` };
  }

  const operationId = opPath.startsWith("operations/") ? opPath.slice("operations/".length) : opPath;
  return { ok: true, operationId };
}

/** Phase 2: Check the status of a create/update operation.
 *  Returns { operationDone, assetId } — when done, assetId is the new asset's ID. */
export async function getOperationStatus(
  apiKey: string,
  operationId: string,
): Promise<RobloxStatusResult> {
  try {
    const res = await fetch(`https://apis.roblox.com/assets/v1/operations/${operationId}`, {
      headers: { "x-api-key": apiKey },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, phase: "operation", error: "API Key tidak valid" };
    }
    if (res.status === 404) {
      return { ok: false, phase: "operation", error: "Operation tidak ditemukan" };
    }
    if (!res.ok) {
      return { ok: false, phase: "operation", error: `HTTP ${res.status}` };
    }

    const json = await safeJson(res);
    if (!json) {
      return { ok: false, phase: "operation", error: "Respon tidak valid dari Roblox" };
    }

    if (json.done === true) {
      const assetId = json.response?.assetId;
      if (assetId) {
        return { ok: true, phase: "operation", operationDone: true, assetId: String(assetId) };
      }
      // Operation done but no assetId — likely an error
      const errMsg = json.response?.error?.message || json.error?.message || "Operation gagal tanpa detail";
      return { ok: false, phase: "operation", operationDone: true, error: errMsg };
    }

    // Still processing
    return { ok: true, phase: "operation", operationDone: false };
  } catch (e) {
    return { ok: false, phase: "operation", error: (e as Error).message };
  }
}

/** Phase 3: Check the moderation status of an uploaded asset.
 *  Returns the moderation state: Pending | Reviewing | Approved | Rejected */
export async function getAssetModerationStatus(
  apiKey: string,
  assetId: string,
): Promise<RobloxStatusResult> {
  try {
    const res = await fetch(`https://apis.roblox.com/assets/v1/assets/${assetId}`, {
      headers: { "x-api-key": apiKey },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, phase: "moderation", error: "API Key tidak valid" };
    }
    if (res.status === 404) {
      // Asset might not be indexed yet — treat as pending
      return { ok: true, phase: "moderation", moderationState: "Pending" };
    }
    if (!res.ok) {
      return { ok: false, phase: "moderation", error: `HTTP ${res.status}` };
    }

    const json = await safeJson(res);
    if (!json) {
      return { ok: false, phase: "moderation", error: "Respon tidak valid dari Roblox" };
    }

    // The moderation result can be in different fields depending on API version
    const mod = json.moderationResult || json.moderation || {};
    const state = (mod.state || mod.status || json.moderationState || json.status || "Unknown") as ModerationState;

    // Normalize known states
    const normalizedState = normalizeModerationState(String(state));
    const reason = mod.reason || mod.rejectionReason || json.rejectionReason || undefined;

    return {
      ok: true,
      phase: "moderation",
      assetId,
      moderationState: normalizedState,
      moderationReason: reason,
    };
  } catch (e) {
    return { ok: false, phase: "moderation", error: (e as Error).message };
  }
}

function normalizeModerationState(raw: string): ModerationState {
  const s = raw.toLowerCase();
  if (s.includes("pend")) return "Pending";
  if (s.includes("review")) return "Reviewing";
  if (s.includes("approv") || s.includes("pass")) return "Approved";
  if (s.includes("reject") || s.includes("denied") || s.includes("block")) return "Rejected";
  return "Unknown";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
