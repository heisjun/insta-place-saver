import { describe, it, expect, beforeEach } from "vitest";
import {
  savePendingSave,
  getPendingSave,
  clearPendingSave,
  type PendingSave,
} from "./pendingSave";

const sample: PendingSave = {
  instagramUrl: "https://www.instagram.com/p/CxYz",
  places: [],
  caption: "샘플 캡션",
  imageUrls: ["https://cdn.example/1.jpg"],
  editedNames: { 0: "테라로사" },
};

describe("pendingSave", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("저장한 데이터를 그대로 읽어온다", () => {
    savePendingSave(sample);
    expect(getPendingSave()).toEqual(sample);
  });

  it("저장된 데이터가 없으면 null을 반환한다", () => {
    expect(getPendingSave()).toBeNull();
  });

  it("clear 호출 후에는 null을 반환한다", () => {
    savePendingSave(sample);
    clearPendingSave();
    expect(getPendingSave()).toBeNull();
  });

  it("손상된 JSON은 null로 처리한다", () => {
    sessionStorage.setItem("plaver:pending-save", "{not-json");
    expect(getPendingSave()).toBeNull();
  });
});
