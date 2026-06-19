import type { ExtractedPlaceWithKakao } from "@/lib/types";

const KEY = "plaver:pending-save";

export interface PendingSave {
  instagramUrl: string;
  places: ExtractedPlaceWithKakao[];
  caption: string;
  imageUrls: string[];
  editedNames: Record<number, string>;
}

export function savePendingSave(data: PendingSave) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // QuotaExceeded 등은 무시 — 사용자 흐름 막지 않음
  }
}

export function getPendingSave(): PendingSave | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSave;
  } catch {
    return null;
  }
}

export function clearPendingSave() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
