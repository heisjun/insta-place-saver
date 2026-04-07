"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import CategoryFilter from "@/components/map/CategoryFilter";
import KakaoMap from "@/components/map/KakaoMap";
import PlaceOverlay from "@/components/map/PlaceOverlay";
import { usePlaces } from "@/hooks/usePlaces";
import { useCategoryFilter } from "@/store/categoryFilter";
import { Place } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

function MapContent() {
  const router = useRouter();
  const { selected } = useCategoryFilter();
  const { data: places = [], isLoading } = usePlaces(selected ?? undefined);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handleMarkerClick = useCallback((place: Place) => setSelectedPlace(place), []);

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* 헤더 */}
      <header className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between bg-white/90 px-4 backdrop-blur-sm border-b border-gray-100">
        <h1 className="text-base font-bold">내 맛집 지도</h1>
        <button
          onClick={() => router.push("/add")}
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

      {/* 지도 - absolute로 전체 영역 채움 */}
      <div className="absolute inset-0">
        <KakaoMap
          places={places}
          onMarkerClick={handleMarkerClick}
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
    </div>
  );
}

export default function MapPage() {
  return (
    <AuthGuard>
      <MapContent />
    </AuthGuard>
  );
}
