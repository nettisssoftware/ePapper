import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_CONTENT,
  DEFAULT_DESIGN,
  DEFAULT_EXPORT,
  DEFAULT_IMAGE_SRC,
  DEFAULT_TYPOGRAPHY,
} from "./defaults";
import type {
  ContentModel,
  DesignModel,
  ExportModel,
  NewspaperImage,
  TypographyModel,
} from "./schema";

export type EditorTab = "content" | "design" | "type" | "export";

interface EditorialState {
  content: ContentModel;
  design: DesignModel;
  typography: TypographyModel;
  exportSettings: ExportModel;
  tab: EditorTab;
  fontsReady: boolean;
  setContent: (patch: Partial<ContentModel>) => void;
  setImage: (patch: Partial<NewspaperImage>) => void;
  setDesign: (patch: Partial<DesignModel>) => void;
  setTypography: (patch: Partial<TypographyModel>) => void;
  setExport: (patch: Partial<ExportModel>) => void;
  setTab: (tab: EditorTab) => void;
  setFontsReady: (ready: boolean) => void;
  resetSample: () => void;
}

export const useEditorialStore = create<EditorialState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      design: DEFAULT_DESIGN,
      typography: DEFAULT_TYPOGRAPHY,
      exportSettings: DEFAULT_EXPORT,
      tab: "content",
      fontsReady: false,
      setContent: (patch) => set((s) => ({ content: { ...s.content, ...patch } })),
      setImage: (patch) =>
        set((s) => ({ content: { ...s.content, image: { ...s.content.image, ...patch } } })),
      setDesign: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
      setTypography: (patch) => set((s) => ({ typography: { ...s.typography, ...patch } })),
      setExport: (patch) =>
        set((s) => ({ exportSettings: { ...s.exportSettings, ...patch } })),
      setTab: (tab) => set({ tab }),
      setFontsReady: (fontsReady) => set({ fontsReady }),
      resetSample: () =>
        set({
          content: DEFAULT_CONTENT,
          design: DEFAULT_DESIGN,
          typography: DEFAULT_TYPOGRAPHY,
          exportSettings: DEFAULT_EXPORT,
        }),
    }),
    {
      name: "editorial-newspaper-renderer",
      skipHydration: true,
      partialize: (state) => ({
        content: {
          ...state.content,
          image: {
            ...state.content.image,
            src:
              state.content.image.src.startsWith("data:") ||
              state.content.image.src.startsWith("blob:")
                ? DEFAULT_IMAGE_SRC
                : state.content.image.src,
          },
        },
        design: state.design,
        typography: state.typography,
        exportSettings: state.exportSettings,
      }),
    },
  ),
);

const IDB_NAME = "editorial-renderer";
const IDB_STORE = "assets";

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function persistUserImage(dataUrl: string): Promise<void> {
  const db = await openImageDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(dataUrl, "hero");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadUserImage(): Promise<string | null> {
  try {
    const db = await openImageDb();
    const value = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get("hero");
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

export async function clearUserImage(): Promise<void> {
  try {
    const db = await openImageDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete("hero");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
