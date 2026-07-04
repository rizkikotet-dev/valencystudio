/**
 * Roblox Open Cloud API helpers (server-side only).
 *
 * Uses API Key authentication via the `x-api-key` header, as documented at
 * https://create.roblox.com/docs/cloud/auth/api-keys
 *
 * Asset upload flow (Assets API v1):
 *  1. POST https://apis.roblox.com/assets/v1/assets
 *       - multipart/form-data with `request` (JSON) + `fileContent` (binary)
 *       - returns an Operation object: { path: "operations/<opId>" }
 *  2. Poll GET https://apis.roblox.com/assets/v1/operations/<opId>
 *       - returns { path, done: boolean, response?: { assetId, ... } }
 *  3. When done === true, read response.assetId.
 *
 * Audio asset restrictions: .mp3/.ogg/.wav/.flac, up to 7 min, up to 20 MB.
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

export interface RobloxUploadParams {
  apiKey: string;
  audioBuffer: Buffer;
  fileName: string; // e.g. "song.mp3"
  assetName: string;
  description?: string;
  userId: number; // creator user id (required)
  groupId?: number; // optional group creator
}

export interface RobloxUploadResult {
  ok: boolean;
  assetId?: string;
  operationId?: string;
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

/** Verify the API key by making a lightweight call to the operations endpoint.
 *  - 401/403 → key invalid
 *  - 404 → key valid (operation not found, which is expected for a dummy id)
 *  - 200 → key valid
 */
async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://apis.roblox.com/assets/v1/operations/verify-${Date.now()}`, {
      headers: { "x-api-key": apiKey },
    });
    // 401/403 means the key is invalid or unauthorized
    if (res.status === 401 || res.status === 403) return false;
    // Any other status (404, 400) means the key was accepted by the gateway
    return true;
  } catch {
    return false;
  }
}

/** Verify an API Key + Roblox userId combination.
 *  Returns the public user profile and whether the API key is accepted.
 */
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

/** Create an audio asset via the Open Cloud Assets API.
 *  Returns the new assetId by polling the long-running operation.
 */
export async function uploadAudioToRoblox(params: RobloxUploadParams): Promise<RobloxUploadResult> {
  const { apiKey, audioBuffer, fileName, assetName, description = "", userId, groupId } = params;

  if (!apiKey) return { ok: false, error: "API Key wajib diisi" };
  if (!userId) return { ok: false, error: "User ID wajib diisi" };
  if (!audioBuffer || audioBuffer.length === 0) return { ok: false, error: "Audio buffer kosong" };

  // 1) Build the multipart form data manually (to control content-type of file part)
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
  // request part
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="request"\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${JSON.stringify(requestPayload)}\r\n`,
    ),
  );
  // fileContent part
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

  // 2) POST to create asset endpoint
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
    const errText = await safeText(createRes);
    return { ok: false, error: `API Key tidak valid atau tidak punya permission assets:write. (${errText.slice(0, 200)})` };
  }
  if (createRes.status === 429) {
    return { ok: false, error: "Rate limit tercapai (429). Coba lagi beberapa menit lagi." };
  }

  const createJson = await safeJson(createRes);
  if (!createRes.ok) {
    const msg = createJson?.message || createJson?.error || (await safeText(createRes)).slice(0, 300);
    return { ok: false, error: `Roblox API error ${createRes.status}: ${msg}` };
  }

  // Operation path is like "operations/abc-123-def"
  const opPath: string | undefined = createJson.path;
  if (!opPath) {
    // Some responses return the asset directly when done synchronously
    const directAssetId = createJson.response?.assetId || createJson.assetId;
    if (directAssetId) return { ok: true, assetId: String(directAssetId) };
    return { ok: false, error: `Respon tidak terduga dari Roblox: ${JSON.stringify(createJson).slice(0, 300)}` };
  }

  const operationId = opPath.startsWith("operations/") ? opPath.slice("operations/".length) : opPath;

  // 3) Poll the operation until done (max ~60s)
  const maxAttempts = 40;
  const pollIntervalMs = 1500;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(pollIntervalMs);
    try {
      const pollRes = await fetch(`https://apis.roblox.com/assets/v1/operations/${operationId}`, {
        headers: { "x-api-key": apiKey },
      });
      if (pollRes.status === 401 || pollRes.status === 403) {
        return { ok: false, error: "API Key tidak valid saat polling operation.", operationId };
      }
      if (!pollRes.ok) continue;
      const pollJson = await pollRes.json();
      if (pollJson.done === true) {
        const assetId = pollJson.response?.assetId;
        if (assetId) {
          return { ok: true, assetId: String(assetId), operationId };
        }
        // Operation finished but no assetId — likely an error
        const errMsg = pollJson.response?.error?.message || pollJson.error?.message || "Operation selesai tanpa assetId";
        return { ok: false, error: errMsg, operationId };
      }
      // still processing, continue polling
    } catch {
      // network blip, keep polling
    }
  }
  return { ok: false, error: "Timeout: operation belum selesai setelah 60 detik. Cek riwayat upload di Roblox Creator.", operationId };
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
