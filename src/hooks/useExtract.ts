"use client";

import { ExtractedPlaceWithKakao } from "@/lib/types";
import { useState } from "react";

type Step = "idle" | "scraping" | "extracting" | "done" | "error";

interface ExtractState {
  step: Step;
  places: ExtractedPlaceWithKakao[];
  error: string | null;
  caption: string | null;
  imageUrls: string[];
}

export function useExtract() {
  const [state, setState] = useState<ExtractState>({
    step: "idle",
    places: [],
    error: null,
    caption: null,
    imageUrls: [],
  });

  async function run(url: string) {
    setState({ step: "scraping", places: [], error: null, caption: null, imageUrls: [] });

    // 1. 캡션 크롤링
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
        setState((s) => ({
          ...s,
          step: "error",
          error: data.error ?? "캡션을 가져오지 못했습니다",
        }));
        return;
      }
      caption = data.caption;
      if (data.imageUrls) {
        imageUrls = data.imageUrls;
      }
    } catch {
      setState((s) => ({
        ...s,
        step: "error",
        error: "네트워크 오류가 발생했습니다",
      }));
      return;
    }

    setState((s) => ({ ...s, step: "extracting", caption, imageUrls }));

    // 2. Claude 추출 + 카카오 검색
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({
          ...s,
          step: "error",
          error: data.error ?? "AI 분석에 실패했습니다",
        }));
        return;
      }

      if (!data.places || data.places.length === 0) {
        setState((s) => ({
          ...s,
          step: "error",
          error: "이 게시글에서 가게 정보를 찾지 못했어요",
        }));
        return;
      }

      setState((s) => ({ ...s, step: "done", places: data.places }));
    } catch {
      setState((s) => ({
        ...s,
        step: "error",
        error: "AI 분석 중 오류가 발생했습니다",
      }));
    }
  }

  async function runWithCaption(caption: string) {
    setState({ step: "extracting", places: [], error: null, caption, imageUrls: [] });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({
          ...s,
          step: "error",
          error: data.error ?? "AI 분석에 실패했습니다",
        }));
        return;
      }

      if (!data.places || data.places.length === 0) {
        setState((s) => ({
          ...s,
          step: "error",
          error: "이 게시글에서 가게 정보를 찾지 못했어요",
        }));
        return;
      }

      setState((s) => ({ ...s, step: "done", places: data.places }));
    } catch {
      setState((s) => ({
        ...s,
        step: "error",
        error: "AI 분석 중 오류가 발생했습니다",
      }));
    }
  }

  function reset() {
    setState({ step: "idle", places: [], error: null, caption: null, imageUrls: [] });
  }

  return { ...state, run, runWithCaption, reset };
}
