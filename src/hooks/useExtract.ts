"use client";

import { ExtractedPlaceWithKakao } from "@/lib/types";
import { useState } from "react";

export type ExtractState =
  | { step: "idle" }
  | { step: "scraping" }
  | { step: "extracting"; caption: string; imageUrls: string[] }
  | { step: "done"; places: ExtractedPlaceWithKakao[]; caption: string; imageUrls: string[] }
  | { step: "error"; error: string; failedAt: "scraping" | "extracting"; retryCaption?: string };

export function useExtract() {
  const [state, setState] = useState<ExtractState>({ step: "idle" });

  async function run(url: string) {
    setState({ step: "scraping" });

    let caption: string;
    let imageUrls: string[] = [];
    try {
      const res = await fetch("/api/instagram/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", error: data.error ?? "캡션을 가져오지 못했습니다", failedAt: "scraping" });
        return;
      }
      caption = data.caption;
      imageUrls = data.imageUrls ?? [];
    } catch {
      setState({ step: "error", error: "네트워크 오류가 발생했습니다", failedAt: "scraping" });
      return;
    }

    setState({ step: "extracting", caption, imageUrls });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", error: data.error ?? "AI 분석에 실패했습니다", failedAt: "extracting", retryCaption: caption });
        return;
      }

      if (!data.places || data.places.length === 0) {
        setState({ step: "error", error: "이 게시글에서 가게 정보를 찾지 못했어요", failedAt: "extracting", retryCaption: caption });
        return;
      }

      setState({ step: "done", places: data.places, caption, imageUrls });
    } catch {
      setState({ step: "error", error: "AI 분석 중 오류가 발생했습니다", failedAt: "extracting", retryCaption: caption });
    }
  }

  async function runWithCaption(caption: string) {
    setState({ step: "extracting", caption, imageUrls: [] });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", error: data.error ?? "AI 분석에 실패했습니다", failedAt: "extracting", retryCaption: caption });
        return;
      }

      if (!data.places || data.places.length === 0) {
        setState({ step: "error", error: "이 게시글에서 가게 정보를 찾지 못했어요", failedAt: "extracting", retryCaption: caption });
        return;
      }

      setState({ step: "done", places: data.places, caption, imageUrls: [] });
    } catch {
      setState({ step: "error", error: "AI 분석 중 오류가 발생했습니다", failedAt: "extracting", retryCaption: caption });
    }
  }

  function reset() {
    setState({ step: "idle" });
  }

  return { state, run, runWithCaption, reset };
}
