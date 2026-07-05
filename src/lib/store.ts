import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SourceType = "youtube" | "soundcloud" | "file";

export interface SourceItem {
  id: string;
  type: SourceType;
  url?: string;
  fileName?: string;
  title: string;
  duration: number;
  size: number;
  waveform: number[];
  inputFile: string;
  selected: boolean;
}

export interface ProcessSettings {
  speed: number;
  pitch: number;
  amplification: number;
}

export interface ProcessedItem {
  sourceId: string;
  fileName: string;
  duration: number;
  size: number;
  waveform: number[];
  assetName: string;
  selectedForUpload: boolean;
}

export type ModerationState = "Pending" | "Reviewing" | "Approved" | "Rejected" | "Unknown";

export interface UploadState {
  status: "idle" | "uploading" | "processing" | "uploaded" | "failed";
  assetId?: string;
  operationId?: string;
  moderationState: ModerationState | null;
  moderationReason: string | null;
  error?: string;
  polling: boolean;
  historyItemId?: string;
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
    settings: { speed: 1, pitch: 0, amplification: 0 },
    recommended: false,
  },
  {
    id: "pitch-up",
    name: "Pitch +2 Semitone",
    description: "Naikkan pitch 2 semitone. Di Roblox set PlaybackSpeed untuk normalkan.",
    icon: "⬆️",
    settings: { speed: 1, pitch: 2, amplification: 0 },
    recommended: true,
  },
  {
    id: "pitch-down",
    name: "Pitch -2 Semitone",
    description: "Turunkan pitch 2 semitone. Di Roblox set PlaybackSpeed untuk normalkan.",
    icon: "⬇️",
    settings: { speed: 1, pitch: -2, amplification: 0 },
    recommended: true,
  },
  {
    id: "speed-up",
    name: "Speed 1.08x",
    description: "Percepat 8%. Di Roblox set PlaybackSpeed = 0.926 untuk normalkan.",
    icon: "⚡",
    settings: { speed: 1.08, pitch: 0, amplification: 0 },
    recommended: true,
  },
  {
    id: "pitch-speed",
    name: "Pitch +1.5 & Speed 1.05x",
    description: "Kombinasi pitch & speed. Bypass paling efektif untuk audio populer.",
    icon: "🎯",
    settings: { speed: 1.05, pitch: 1.5, amplification: 0 },
    recommended: true,
  },
  {
    id: "nightcore",
    name: "Nightcore",
    description: "Pitch +4 & Speed 1.25x. Gaya nightcore, bypass kuat untuk lagu pop.",
    icon: "🌙",
    settings: { speed: 1.25, pitch: 4, amplification: 0 },
    recommended: false,
  },
  {
    id: "subtle-mix",
    name: "Subtle Mix",
    description: "Pitch +1, Speed 1.03x, Vol +2dB. Bypass halus yang tetap enak didengar.",
    icon: "✨",
    settings: { speed: 1.03, pitch: 1, amplification: 2 },
    recommended: true,
  },
];

const DEFAULT_SETTINGS: ProcessSettings = {
  speed: 1,
  pitch: 0,
  amplification: 0,
};

interface ConverterState {
  // Sources queue (multi)
  sources: SourceItem[];
  sourceLoading: boolean;
  sourceError: string | null;
  cookies: string;

  // Settings (shared across all)
  settings: ProcessSettings;
  activePresetId: string;

  // Processed items (keyed by sourceId)
  processedMap: Record<string, ProcessedItem>;
  processing: boolean;
  processError: string | null;
  processingSourceId: string | null; // currently processing item

  // Upload states (keyed by sourceId)
  uploadMap: Record<string, UploadState>;
  uploading: boolean;

  // Roblox account
  account: RobloxAccount | null;
  verifying: boolean;
  verifyError: string | null;

  // History
  historyVersion: number;

  // Actions - Sources
  addSource: (s: Omit<SourceItem, "id" | "selected">) => void;
  removeSource: (id: string) => void;
  toggleSourceSelected: (id: string) => void;
  selectAllSources: (val: boolean) => void;
  clearSources: () => void;
  setSourceLoading: (b: boolean) => void;
  setSourceError: (e: string | null) => void;
  setCookies: (c: string) => void;

  // Actions - Settings
  setSettings: (s: Partial<ProcessSettings>) => void;
  applyPreset: (preset: BypassPreset) => void;

  // Actions - Processed
  setProcessed: (sourceId: string, item: ProcessedItem) => void;
  removeProcessed: (sourceId: string) => void;
  toggleProcessedSelected: (sourceId: string) => void;
  selectAllProcessed: (val: boolean) => void;
  setProcessing: (b: boolean) => void;
  setProcessError: (e: string | null) => void;
  setProcessingSourceId: (id: string | null) => void;

  // Actions - Upload
  setUploadState: (sourceId: string, state: Partial<UploadState>) => void;
  setUploading: (b: boolean) => void;

  // Actions - Account
  setAccount: (a: RobloxAccount | null) => void;
  setVerifying: (b: boolean) => void;
  setVerifyError: (e: string | null) => void;

  // Actions - History
  refreshHistory: () => void;
  resetAll: () => void;
}

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useConverter = create<ConverterState>()(
  persist(
    (set, get) => ({
  sources: [],
  sourceLoading: false,
  sourceError: null,
  cookies: "",

  settings: { ...DEFAULT_SETTINGS },
  activePresetId: "none",

  processedMap: {},
  processing: false,
  processError: null,
  processingSourceId: null,

  uploadMap: {},
  uploading: false,

  account: null,
  verifying: false,
  verifyError: null,

  historyVersion: 0,

  // Sources
  addSource: (s) =>
    set((state) => ({
      sources: [...state.sources, { ...s, id: genId(), selected: true }],
    })),
  removeSource: (id) =>
    set((state) => {
      const sources = state.sources.filter((s) => s.id !== id);
      const processedMap = { ...state.processedMap };
      delete processedMap[id];
      const uploadMap = { ...state.uploadMap };
      delete uploadMap[id];
      return { sources, processedMap, uploadMap };
    }),
  toggleSourceSelected: (id) =>
    set((state) => ({
      sources: state.sources.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    })),
  selectAllSources: (val) =>
    set((state) => ({
      sources: state.sources.map((s) => ({ ...s, selected: val })),
    })),
  clearSources: () => set({ sources: [], processedMap: {}, uploadMap: {} }),
  setSourceLoading: (b) => set({ sourceLoading: b }),
  setSourceError: (e) => set({ sourceError: e }),
  setCookies: (c) => set({ cookies: c }),

  // Settings
  setSettings: (s) =>
    set((state) => {
      const next = { ...state.settings, ...s };
      const matched = BYPASS_PRESETS.find(
        (p) =>
          p.settings.speed === next.speed &&
          p.settings.pitch === next.pitch &&
          p.settings.amplification === next.amplification,
      );
      return { settings: next, activePresetId: matched?.id ?? "custom" };
    }),
  applyPreset: (preset) => set({ settings: { ...DEFAULT_SETTINGS, ...preset.settings }, activePresetId: preset.id }),

  // Processed
  setProcessed: (sourceId, item) =>
    set((state) => ({
      processedMap: { ...state.processedMap, [sourceId]: item },
    })),
  removeProcessed: (sourceId) =>
    set((state) => {
      const processedMap = { ...state.processedMap };
      delete processedMap[sourceId];
      return { processedMap };
    }),
  toggleProcessedSelected: (sourceId) =>
    set((state) => {
      const item = state.processedMap[sourceId];
      if (!item) return state;
      return {
        processedMap: {
          ...state.processedMap,
          [sourceId]: { ...item, selectedForUpload: !item.selectedForUpload },
        },
      };
    }),
  selectAllProcessed: (val) =>
    set((state) => {
      const processedMap: Record<string, ProcessedItem> = {};
      for (const [k, v] of Object.entries(state.processedMap)) {
        processedMap[k] = { ...v, selectedForUpload: val };
      }
      return { processedMap };
    }),
  setProcessing: (b) => set({ processing: b }),
  setProcessError: (e) => set({ processError: e }),
  setProcessingSourceId: (id) => set({ processingSourceId: id }),

  // Upload
  setUploadState: (sourceId, partial) =>
    set((state) => {
      const existing = state.uploadMap[sourceId] || {
        status: "idle" as const,
        moderationState: null,
        moderationReason: null,
        polling: false,
      };
      return {
        uploadMap: { ...state.uploadMap, [sourceId]: { ...existing, ...partial } },
      };
    }),
  setUploading: (b) => set({ uploading: b }),

  // Account
  setAccount: (a) => set({ account: a, verifyError: null }),
  setVerifying: (b) => set({ verifying: b }),
  setVerifyError: (e) => set({ verifyError: e }),

  // History
  refreshHistory: () => set((s) => ({ historyVersion: s.historyVersion + 1 })),
  resetAll: () =>
    set({
      sources: [],
      sourceError: null,
      settings: { ...DEFAULT_SETTINGS },
      activePresetId: "none",
      processedMap: {},
      processError: null,
      uploadMap: {},
      uploading: false,
    }),
    }),
    {
      name: "valency-studio-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields (exclude transient loading/error states)
      partialize: (state) => ({
        account: state.account,
        sources: state.sources,
        cookies: state.cookies,
        settings: state.settings,
        activePresetId: state.activePresetId,
        processedMap: state.processedMap,
        uploadMap: state.uploadMap,
      }),
      // Don't persist transient states - reset on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset transient/loading states after rehydration
          state.sourceLoading = false;
          state.sourceError = null;
          state.processing = false;
          state.processError = null;
          state.processingSourceId = null;
          state.uploading = false;
          state.verifying = false;
          state.verifyError = null;
          // For uploads: keep polling=true if we have operationId or assetId
          // (roblox-panel will resume polling automatically). Only mark as failed
          // if we have neither (upload was interrupted mid-create).
          if (state.uploadMap) {
            for (const [id, u] of Object.entries(state.uploadMap)) {
              if (u.status === "uploading" && !u.operationId && !u.assetId) {
                state.uploadMap[id] = {
                  ...u,
                  polling: false,
                  status: "failed",
                  error: "Upload terputus saat sesi berakhir. Silakan upload ulang.",
                };
              } else if (u.status === "processing" && !u.operationId && !u.assetId) {
                state.uploadMap[id] = {
                  ...u,
                  polling: false,
                  status: "failed",
                  error: "Upload terputus. Silakan upload ulang.",
                };
              }
              // Otherwise keep polling=true — roblox-panel useEffect will resume
            }
          }
        }
      },
    },
  ),
);

/** Helper: get sources selected for processing */
export function getSelectedSources(state: ConverterState): SourceItem[] {
  return state.sources.filter((s) => s.selected);
}

/** Helper: get processed items selected for upload */
export function getSelectedForUpload(state: ConverterState): { source: SourceItem; processed: ProcessedItem }[] {
  return state.sources
    .filter((s) => state.processedMap[s.id]?.selectedForUpload)
    .map((s) => ({ source: s, processed: state.processedMap[s.id] }));
}
