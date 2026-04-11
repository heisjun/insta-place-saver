"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import CategoryFilter from "@/components/map/CategoryFilter";
import KakaoMap from "@/components/map/KakaoMap";
import PlaceOverlay from "@/components/map/PlaceOverlay";
import { usePlaces } from "@/hooks/usePlaces";
import { useCategoryFilter } from "@/store/categoryFilter";
import { Place } from "@/lib/types";
import { extractInstagramUrl } from "@/lib/instagram";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSelectId = searchParams.get("selectId") ?? undefined;
  const { selected } = useCategoryFilter();
  const { data: places = [], isLoading } = usePlaces(selected ?? undefined);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  const handleMarkerClick = useCallback((place: Place) => setSelectedPlace(place), []);

  async function handleAddClick() {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractInstagramUrl(text);
      if (url) {
        setClipboardUrl(url);
        return;
      }
    } catch {
      // 권한 거부 또는 미지원 → 그냥 이동
    }
    router.push("/add");
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* 헤더 */}
      <header className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between bg-white/90 px-4 backdrop-blur-sm border-b border-gray-100">
        <h1 className="text-base font-bold">내 맛집 지도</h1>
        <button
          onClick={handleAddClick}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-lg"
          aria-label="장소 추가"
        >
          +
        </button>
      </header>

      {/* 카테고리 필터 */}
      <div className="absolute left-0 right-0 top-14 z-10 bg-white/90 backdrop-blur-sm">
        <CategoryFilter />
      </div>

      {/* 지도 - z-0으로 stacking context 생성 → Kakao 내부 z-index 격리 */}
      <div className="absolute inset-0 z-0">
        <KakaoMap
          places={places}
          onMarkerClick={handleMarkerClick}
          onMapClick={() => setSelectedPlace(null)}
          autoSelectPlaceId={autoSelectId}
        />
      </div>

      {/* 장소 없을 때 안내 */}
      {!isLoading && places.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none pt-24">
          <p className="text-3xl">🗺️</p>
          <p className="text-sm font-medium text-gray-500">저장된 장소가 없어요</p>
          <button
            onClick={() => router.push("/add")}
            className="pointer-events-auto rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            첫 장소 추가하기
          </button>
        </div>
      )}

      {/* 선택된 장소 오버레이 */}
      {selectedPlace && (
        <PlaceOverlay
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}

      {/* 클립보드 인스타 링크 감지 바텀시트 */}
      {clipboardUrl && (
        <>
          {/* 백드롭 */}
          <div
            className="absolute inset-0 z-20 bg-black/30"
            onClick={() => setClipboardUrl(null)}
          />
          {/* 시트 */}
          <div className="absolute bottom-nav left-0 right-0 z-30 animate-slide-up rounded-t-2xl bg-white px-5 pb-6 pt-5 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base">📋</span>
              <p className="text-sm font-semibold text-gray-900">
                복사한 인스타 링크가 있어요
              </p>
            </div>
            <p className="mb-5 truncate pl-6 text-xs text-gray-400">
              {clipboardUrl}
            </p>
            <button
              onClick={() => {
                router.push(`/add?url=${encodeURIComponent(clipboardUrl)}`);
                setClipboardUrl(null);
              }}
              className="mb-2 h-12 w-full rounded-xl bg-black text-sm font-semibold text-white"
            >
              바로 등록하기
            </button>
            <button
              onClick={() => {
                setClipboardUrl(null);
                router.push("/add");
              }}
              className="h-10 w-full text-sm text-gray-400"
            >
              직접 입력할게요
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <AuthGuard>
      <Suspense>
        <MapContent />
      </Suspense>
    </AuthGuard>
  );
}
