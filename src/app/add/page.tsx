"use client";

import ExtractResult from "@/components/place/ExtractResult";
import SaveSuccessScreen from "@/components/place/SaveSuccessScreen";
import UrlInput from "@/components/place/UrlInput";
import AuthGuard from "@/components/layout/AuthGuard";
import { useExtract } from "@/hooks/useExtract";
import { extractInstagramUrl } from "@/lib/instagram";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// ─── iOS 스피너 ─────────────────────────────────
function IOSSpinner() {
  const blades = 12;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className="flex-shrink-0">
      {Array.from({ length: blades }, (_, i) => (
        <rect
          key={i}
          x="10" y="2.5" width="2" height="5.5"
          rx="1"
          fill="#9ca3af"
          transform={`rotate(${i * 30} 11 11)`}
          style={{
            animation: `ios-blade 1s linear infinite`,
            animationDelay: `${-(blades - i) * (1 / blades)}s`,
          }}
        />
      ))}
    </svg>
  );
}

// ─── 단계 표시 바 ────────────────────────────────
const PHASES = [
  { key: "scraping",   label: "게시글 수집" },
  { key: "extracting", label: "AI 분석"    },
  { key: "done",       label: "완료"        },
] as const;

function StepBar({ step }: { step: string }) {
  const current = PHASES.findIndex((p) => p.key === step);
  return (
    <div className="mb-4 flex items-center justify-center gap-0">
      {PHASES.map((phase, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={phase.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500 ${
                  done   ? "bg-black text-white"
                  : active ? "bg-black text-white"
                  : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-500 ${
                  active ? "text-black" : done ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {phase.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`mb-4 mx-2 h-px w-8 transition-colors duration-500 ${
                  i < current ? "bg-black" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 스켈레톤 카드 ───────────────────────────────
function SkeletonCard({ phase }: { phase: "scraping" | "extracting" }) {
  const label =
    phase === "scraping"
      ? "인스타그램 게시글 분석 중..."
      : "AI가 가게 정보를 찾는 중...";

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 overflow-hidden">
      {/* 스켈레톤 레이아웃 — ExtractResult 카드와 동일한 구조 */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="shimmer h-5 w-14 rounded-full" />
          <div className="shimmer h-6 w-3/4 rounded-lg" />
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-4 w-5/6 rounded" />
          <div className="shimmer h-4 w-2/3 rounded" />
        </div>
        <div className="shimmer h-[88px] w-[88px] flex-shrink-0 rounded-xl" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="shimmer h-10 flex-1 rounded-xl" />
        <div className="shimmer h-10 flex-1 rounded-xl" />
      </div>

      {/* 중앙 상태 텍스트 오버레이 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/70 backdrop-blur-[1px]">
        <IOSSpinner />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
function AddContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { step, places, error, caption, imageUrls, run, runWithCaption, reset } = useExtract();
  const [instagramUrl, setInstagramUrl] = useState("");
  const [completed, setCompleted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [manualCaption, setManualCaption] = useState("");

  useEffect(() => {
    const raw =
      searchParams.get("url") ||
      searchParams.get("shared_url") ||
      searchParams.get("shared_text") ||
      "";
    const extracted = extractInstagramUrl(raw) ?? raw;
    if (extracted && extracted.includes("instagram.com")) {
      setInstagramUrl(extracted);
      run(extracted);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(url: string) {
    setInstagramUrl(url);
    setCompleted(false);
    setSavedCount(0);
    run(url);
  }

  function handleComplete(count: number) {
    setSavedCount(count);
    setCompleted(true);
  }

  const isLoading = step === "scraping" || step === "extracting";

  function handleBack() {
    if (step === "idle") {
      router.back();
    } else {
      reset();
      setCompleted(false);
      setSavedCount(0);
      setInstagramUrl("");
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 pb-nav">
      {/* 헤더 */}
      <header className="flex h-14 flex-shrink-0 items-center border-b border-gray-200 bg-white px-4">
        <button
          onClick={handleBack}
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
          aria-label="뒤로"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">장소 추가</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {/* 완료 화면 */}
        {completed && (
          <SaveSuccessScreen
            savedCount={savedCount}
            onContinue={() => {
              reset();
              setCompleted(false);
              setSavedCount(0);
              setInstagramUrl("");
            }}
          />
        )}

        {/* 로딩 */}
        {!completed && isLoading && (
          <div className="flex flex-col gap-2">
            <StepBar step={step} />
            <SkeletonCard phase={step === "scraping" ? "scraping" : "extracting"} />
          </div>
        )}

        {/* 에러 */}
        {!completed && step === "error" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>

            {/* 캡션 직접 붙여넣기 폴백 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="mb-1 text-sm font-medium text-gray-700">
                캡션 직접 붙여넣기
              </p>
              <p className="mb-3 text-xs text-gray-400">
                인스타그램 앱에서 게시글 캡션을 복사해서 붙여넣으세요
              </p>
              <textarea
                value={manualCaption}
                onChange={(e) => setManualCaption(e.target.value)}
                placeholder="게시글 캡션을 여기에 붙여넣으세요..."
                rows={5}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm placeholder:text-gray-300 focus:border-black focus:outline-none"
              />
              <button
                onClick={() => {
                  if (manualCaption.trim()) {
                    runWithCaption(manualCaption.trim());
                    setManualCaption("");
                  }
                }}
                disabled={!manualCaption.trim()}
                className="mt-2 h-11 w-full rounded-xl bg-black text-sm font-medium text-white disabled:opacity-40"
              >
                가게 찾기
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">또는</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <UrlInput initialUrl={instagramUrl} onSubmit={handleSubmit} />
          </div>
        )}

        {/* URL 입력 (초기) */}
        {!completed && step === "idle" && (
          <UrlInput onSubmit={handleSubmit} />
        )}

        {/* 결과 */}
        {!completed && step === "done" && (
          <ExtractResult
            places={places}
            instagramUrl={instagramUrl}
            instagramCaption={caption}
            imageUrls={imageUrls}
            onComplete={handleComplete}
          />
        )}
      </main>
    </div>
  );
}

export default function AddPage() {
  return (
    <AuthGuard>
      <Suspense>
        <AddContent />
      </Suspense>
    </AuthGuard>
  );
}
