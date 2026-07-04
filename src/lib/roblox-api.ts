/**
 * Roblox API helpers (server-side only).
 *
 * Roblox audio upload uses the asset publish endpoint:
 *   POST https://data.roblox.com/Data/Upload.ashx?assetid=0&type=Audio&name=...&description=...
 *   Headers: Cookie: .ROBLOSECURITY=... ; X-CSRF-TOKEN: ...
 *   Body: binary audio (mp3, up to a certain size)
 *
 * To get the X-CSRF-TOKEN you must first attempt the request, receive 403 with
 * 'X-CSRF-TOKEN' response header, then retry with that token.
 *
 * The authenticated user can be resolved via:
 *   GET https://users.roblox.com/v1/users/authenticated  (with cookie)
 */

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  avatarUrl?: string;
}

export interface RobloxVerifyResult {
  ok: boolean;
  user?: RobloxUser;
  csrfToken?: string;
  error?: string;
}

/** Verify a .ROBLOSECURITY cookie and return the authenticated user + csrf token */
export async function verifyRobloxCookie(cookie: string): Promise<RobloxVerifyResult> {
  try {
    // 1) Get authenticated user
    const userRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
    });
    if (!userRes.ok) {
      if (userRes.status === 401 || userRes.status === 403) {
        return { ok: false, error: "Cookie tidak valid atau kedaluwarsa. Pastikan Anda menempelkan .ROBLOSECURITY yang benar." };
      }
      return { ok: false, error: `Roblox API error: ${userRes.status}` };
    }
    const userJson = await userRes.json();
    const userId = userJson.id;
    const name = userJson.name;
    const displayName = userJson.displayName;

    // 2) Fetch avatar thumbnail
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

    // 3) Get CSRF token by making a dummy request to the upload endpoint
    let csrfToken = "";
    try {
      const dummyRes = await fetch(
        "https://data.roblox.com/Data/Upload.ashx?assetid=0&type=Audio&name=test&description=test",
        {
          method: "POST",
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`,
            "Content-Type": "application/octet-stream",
          },
          body: new Uint8Array([0]),
        },
      );
      csrfToken = dummyRes.headers.get("x-csrf-token") || "";
    } catch {}

    return {
      ok: true,
      user: { id: userId, name, displayName, avatarUrl },
      csrfToken,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface RobloxUploadParams {
  cookie: string;
  csrfToken?: string;
  audioBuffer: Buffer;
  assetName: string;
  description?: string;
  groupId?: number;
}

export interface RobloxUploadResult {
  ok: boolean;
  assetId?: string;
  error?: string;
}

/** Upload an audio asset to Roblox. Returns the new assetId on success. */
export async function uploadAudioToRoblox(params: RobloxUploadParams): Promise<RobloxUploadResult> {
  const { cookie, csrfToken, audioBuffer, assetName, description = "", groupId } = params;

  const uploadUrl = new URL("https://data.roblox.com/Data/Upload.ashx");
  uploadUrl.searchParams.set("assetid", "0");
  uploadUrl.searchParams.set("type", "Audio");
  uploadUrl.searchParams.set("name", assetName.slice(0, 50));
  uploadUrl.searchParams.set("description", (description || "").slice(0, 200));
  if (groupId) uploadUrl.searchParams.set("groupId", String(groupId));

  const headers: Record<string, string> = {
    Cookie: `.ROBLOSECURITY=${cookie}`,
    "Content-Type": "application/octet-stream",
    "User-Agent": "Roblox/WinInet",
  };
  if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;

  const makeReq = (h: Record<string, string>) =>
    fetch(uploadUrl.toString(), {
      method: "POST",
      headers: h,
      body: audioBuffer,
    });

  try {
    let res = await makeReq(headers);
    // If CSRF token expired/missing, retry with the returned token
    if (res.status === 403) {
      const newToken = res.headers.get("x-csrf-token");
      if (newToken) {
        headers["X-CSRF-TOKEN"] = newToken;
        res = await makeReq(headers);
      }
    }
    if (res.status === 200 || res.status === 201) {
      const text = await res.text();
      const assetId = text.trim();
      if (/^\d+$/.test(assetId)) {
        return { ok: true, assetId };
      }
      return { ok: false, error: `Respon tidak terduga: ${text.slice(0, 200)}` };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Autentikasi gagal. Cookie mungkin tidak valid atau tidak memiliki izin upload." };
    }
    if (res.status === 429) {
      return { ok: false, error: "Rate limit tercapai. Coba lagi beberapa menit lagi." };
    }
    const errText = await res.text();
    return { ok: false, error: `Roblox error ${res.status}: ${errText.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
