"use client";

import ExtractResult from "@/components/place/ExtractResult";
import UrlInput from "@/components/place/UrlInput";
import AuthGuard from "@/components/layout/AuthGuard";
import { useExtract } from "@/hooks/useExtract";
import { extractInstagramUrl } from "@/lib/instagram";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

  return (
    <div className="flex h-full flex-col bg-gray-50 overflow-y-auto pb-nav">
      {/* 헤더 */}
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4">
        <button
          onClick={() => router.back()}
          className="mr-3 text-gray-500 active:text-gray-900"
          aria-label="뒤로"
        >
          ←
        </button>
        <h1 className="text-base font-semibold">장소 추가</h1>
      </header>

      <main className="flex-1 px-4 py-6">
        {/* 완료 화면 — 하나 이상 저장됐을 때 */}
        {completed && savedCount > 0 && (
          <div className="flex flex-col items-center gap-4 pt-12 text-center">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-semibold text-gray-900">저장 완료!</p>
            <p className="text-sm text-gray-500">
              {savedCount}개 장소가 지도에 추가됐어요
            </p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <button
                onClick={() => router.push("/map")}
                className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white"
              >
                지도에서 보기
              </button>
              <button
                onClick={() => {
                  reset();
                  setCompleted(false);
                  setSavedCount(0);
                  setInstagramUrl("");
                }}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-600"
              >
                계속 추가하기
              </button>
            </div>
          </div>
        )}

        {/* 완료 화면 — 모두 건너뛴 경우 */}
        {completed && savedCount === 0 && (
          <div className="flex flex-col items-center gap-4 pt-12 text-center">
            <div className="text-5xl">🙅</div>
            <p className="text-lg font-semibold text-gray-900">저장하지 않았어요</p>
            <p className="text-sm text-gray-500">모든 장소를 건너뛰었어요</p>
            <button
              onClick={() => {
                reset();
                setCompleted(false);
                setSavedCount(0);
                setInstagramUrl("");
              }}
              className="mt-4 h-12 w-full rounded-xl bg-black text-sm font-medium text-white"
            >
              다시 시작하기
            </button>
          </div>
        )}

        {/* 로딩 */}
        {!completed && isLoading && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
            <p className="text-sm font-medium text-gray-700">
              {step === "scraping"
                ? "게시글 분석 중..."
                : "AI가 가게 정보를 찾고 있어요..."}
            </p>
            <p className="text-xs text-gray-400">잠깐만 기다려주세요</p>
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
