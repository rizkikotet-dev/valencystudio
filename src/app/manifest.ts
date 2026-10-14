import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · Asset replacement for Roblox Studio`,
    short_name: "ValencyStudio",
    description:
      "Preview, replace, and push animations, sounds, decals, meshes, and videos across an entire Roblox Studio place — without manually editing a single instance.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#101012",
    theme_color: "#101012",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
