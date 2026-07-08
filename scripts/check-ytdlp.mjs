import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const bin = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const path = join(root, bin);

if (!existsSync(path)) {
  console.log(`[yt-dlp] ${bin} not found at root, skipping update check.`);
  process.exit(0);
}

try {
  console.log(`[yt-dlp] Checking for updates...`);
  execFileSync(path, ["-U"], { stdio: "inherit", cwd: root });
} catch {
  // yt-dlp -U exits non-zero when already latest — ignore
}
