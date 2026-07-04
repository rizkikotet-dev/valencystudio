import { create } from "zustand";

export type SourceType = "youtube" | "soundcloud" | "file";

export interface SourceInfo {
  type: SourceType;
  url?: string;
  fileName?: string;
  title: string;
  duration: number;
  size: number;
  waveform: number[];
  // internal file name in the mini-service uploads dir
  inputFile: string;
}

export interface ProcessSettings {
  speed: number;
  pitch: number;
  amplification: number;
  bassBoost: number;
  trebleBoost: number;
  reverb: number;
  volumeNormalize: boolean;
}

export interface ProcessedInfo {
  fileName: string; // name in processed dir
  duration: number;
  size: number;
  waveform: number[];
}

export interface RobloxAccount {
  id: string;
  apiKey: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  groupId?: string;
}

export type BypassPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<ProcessSettings>;
  recommended: boolean;
};

export const BYPASS_PRESETS: BypassPreset[] = [
  {
    id: "none",
    name: "Original",
    description: "Tidak ada modifikasi. Audio asli tanpa bypass.",
    icon: "🎵",
    settings: { speed: 1, pitch: 0, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: false,
  },
  {
    id: "pitch-up",
    name: "Pitch +2 Semitone",
    description: "Naikkan pitch 2 semitone. Bypass deteksi sidik jari audio yang umum.",
    icon: "⬆️",
    settings: { speed: 1, pitch: 2, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: true,
  },
  {
    id: "pitch-down",
    name: "Pitch -2 Semitone",
    description: "Turunkan pitch 2 semitone. Alternatif bypass yang natural.",
    icon: "⬇️",
    settings: { speed: 1, pitch: -2, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: true,
  },
  {
    id: "speed-up",
    name: "Speed 1.08x",
    description: "Percepat 8%. Mengubah durasi sehingga sidik jari tidak cocok.",
    icon: "⚡",
    settings: { speed: 1.08, pitch: 0, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: true,
  },
  {
    id: "pitch-speed",
    name: "Pitch +1.5 & Speed 1.05x",
    description: "Kombinasi pitch & speed. Bypass paling efektif untuk audio populer.",
    icon: "🎯",
    settings: { speed: 1.05, pitch: 1.5, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: true,
  },
  {
    id: "nightcore",
    name: "Nightcore",
    description: "Pitch +4 & Speed 1.25x. Gaya nightcore, bypass kuat untuk lagu pop.",
    icon: "🌙",
    settings: { speed: 1.25, pitch: 4, amplification: 0, bassBoost: 0, trebleBoost: 0, reverb: 0, volumeNormalize: false },
    recommended: false,
  },
  {
    id: "bass-boost",
    name: "Bass Boost + Reverb",
    description: "Bass +8dB dengan reverb ringan. Mengubah karakter frekuensi audio.",
    icon: "🔊",
    settings: { speed: 1, pitch: 0, amplification: 0, bassBoost: 8, trebleBoost: 0, reverb: 15, volumeNormalize: false },
    recommended: false,
  },
  {
    id: "subtle-mix",
    name: "Subtle Mix",
    description: "Pitch +1, Speed 1.03x, Bass +3dB. Bypass halus yang tetap enak didengar.",
    icon: "✨",
    settings: { speed: 1.03, pitch: 1, amplification: 0, bassBoost: 3, trebleBoost: 0, reverb: 0, volumeNormalize: true },
    recommended: true,
  },
];

interface ConverterState {
  // Source
  source: SourceInfo | null;
  sourceLoading: boolean;
  sourceError: string | null;

  // Settings
  settings: ProcessSettings;
  activePresetId: string;

  // Processed
  processed: ProcessedInfo | null;
  processing: boolean;
  processError: string | null;

  // Roblox
  account: RobloxAccount | null;
  verifying: boolean;
  verifyError: string | null;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadResult: { assetId: string } | null;

  // History refresh trigger
  historyVersion: number;

  // Actions
  setSource: (s: SourceInfo | null) => void;
  setSourceLoading: (b: boolean) => void;
  setSourceError: (e: string | null) => void;
  setSettings: (s: Partial<ProcessSettings>) => void;
  applyPreset: (preset: BypassPreset) => void;
  setActivePreset: (id: string) => void;
  setProcessed: (p: ProcessedInfo | null) => void;
  setProcessing: (b: boolean) => void;
  setProcessError: (e: string | null) => void;
  setAccount: (a: RobloxAccount | null) => void;
  setVerifying: (b: boolean) => void;
  setVerifyError: (e: string | null) => void;
  setUploading: (b: boolean) => void;
  setUploadProgress: (n: number) => void;
  setUploadError: (e: string | null) => void;
  setUploadResult: (r: { assetId: string } | null) => void;
  resetProcessed: () => void;
  refreshHistory: () => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: ProcessSettings = {
  speed: 1,
  pitch: 0,
  amplification: 0,
  bassBoost: 0,
  trebleBoost: 0,
  reverb: 0,
  volumeNormalize: false,
};

export const useConverter = create<ConverterState>((set) => ({
  source: null,
  sourceLoading: false,
  sourceError: null,
  settings: { ...DEFAULT_SETTINGS },
  activePresetId: "none",
  processed: null,
  processing: false,
  processError: null,
  account: null,
  verifying: false,
  verifyError: null,
  uploading: false,
  uploadProgress: 0,
  uploadError: null,
  uploadResult: null,
  historyVersion: 0,

  setSource: (s) => set({ source: s, processed: null, processError: null }),
  setSourceLoading: (b) => set({ sourceLoading: b }),
  setSourceError: (e) => set({ sourceError: e }),
  setSettings: (s) =>
    set((state) => {
      const next = { ...state.settings, ...s };
      // Detect if matches a preset
      const matched = BYPASS_PRESETS.find(
        (p) =>
          p.settings.speed === next.speed &&
          p.settings.pitch === next.pitch &&
          p.settings.amplification === next.amplification &&
          p.settings.bassBoost === next.bassBoost &&
          p.settings.trebleBoost === next.trebleBoost &&
          p.settings.reverb === next.reverb &&
          (p.settings.volumeNormalize ?? false) === next.volumeNormalize,
      );
      return { settings: next, activePresetId: matched?.id ?? "custom" };
    }),
  applyPreset: (preset) =>
    set({
      settings: { ...DEFAULT_SETTINGS, ...preset.settings },
      activePresetId: preset.id,
      processed: null,
      processError: null,
    }),
  setActivePreset: (id) => set({ activePresetId: id }),
  setProcessed: (p) => set({ processed: p, processError: null }),
  setProcessing: (b) => set({ processing: b }),
  setProcessError: (e) => set({ processError: e }),
  setAccount: (a) => set({ account: a, verifyError: null }),
  setVerifying: (b) => set({ verifying: b }),
  setVerifyError: (e) => set({ verifyError: e }),
  setUploading: (b) => set({ uploading: b }),
  setUploadProgress: (n) => set({ uploadProgress: n }),
  setUploadError: (e) => set({ uploadError: e }),
  setUploadResult: (r) => set({ uploadResult: r }),
  resetProcessed: () => set({ processed: null, processError: null, uploadResult: null, uploadError: null, uploadProgress: 0 }),
  refreshHistory: () => set((s) => ({ historyVersion: s.historyVersion + 1 })),
  resetAll: () =>
    set({
      source: null,
      sourceError: null,
      settings: { ...DEFAULT_SETTINGS },
      activePresetId: "none",
      processed: null,
      processError: null,
      uploadResult: null,
      uploadError: null,
      uploadProgress: 0,
    }),
}));
