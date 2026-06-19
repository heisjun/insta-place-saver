"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import CategoryFilter from "@/components/map/CategoryFilter";
import KakaoMap from "@/components/map/KakaoMap";
import PlaceOverlay from "@/components/map/PlaceOverlay";
import { usePlaces } from "@/hooks/usePlaces";
import { useCategoryFilter } from "@/store/categoryFilter";
import { getCategoryColor } from "@/lib/mapColors";
import { Place } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";

const CATEGORY_EMOJI: Record<string, string> = {
  맛집: "🍽️",
  카페: "☕",
  디저트: "🍰",
  술집: "🍺",
  기타: "📍",
};

function searchPlaces(places: Place[], query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return places.filter((p) =>
    [p.name, p.address, p.memo, p.instagram_caption].some((f) =>
      f?.toLowerCase().includes(q),
    ),
  );
}

function MapContent() {
  const searchParams = useSearchParams();
  const autoSelectId = searchParams.get("selectId") ?? undefined;
  const { selected } = useCategoryFilter();
  const { data: places = [], isLoading } = usePlaces(selected ?? undefined);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleMarkerClick = useCallback((place: Place) => setSelectedPlace(place), []);

  function openSearch() {
    setSearchOpen(true);
    setSelectedPlace(null);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  const searchResults = searchPlaces(places, query);

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* 헤더 */}
      <header className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between gap-2 bg-white/90 px-4 backdrop-blur-sm border-b border-gray-100">
        {searchOpen ? (
          <>
            {/* 뒤로가기 */}
            <button
              onClick={closeSearch}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-600 active:bg-gray-100"
              aria-label="검색 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* 검색 인풋 */}
            <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-shrink-0 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="장소명, 주소, 메모로 검색"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="flex-shrink-0 text-gray-400"
                  aria-label="검색어 지우기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <img src="/logo.svg" alt="Plaver" className="h-6 w-auto" />
            <button
              onClick={openSearch}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-600 active:bg-gray-100"
              aria-label="검색"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </>
        )}
      </header>

      {/* 카테고리 필터 — 검색 모드에서 숨김 */}
      {!searchOpen && (
        <div className="absolute left-0 right-0 top-14 z-10 bg-white/90 backdrop-blur-sm">
          <CategoryFilter />
        </div>
      )}

      {/* 검색 결과 오버레이 */}
      {searchOpen && (
        <div
          className="absolute left-0 right-0 top-14 z-10 overflow-y-auto bg-white"
          style={{ maxHeight: "calc(100dvh - 56px - 64px)" }}
        >
          {query.trim() === "" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="mb-3 text-4xl">🔍</p>
              <p className="text-sm text-gray-400">장소명, 주소, 메모로 검색해보세요</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="mb-3 text-4xl">😅</p>
              <p className="text-sm text-gray-400">
                &ldquo;{query}&rdquo;에 해당하는 장소가 없어요
              </p>
            </div>
          ) : (
            <ul>
              {searchResults.map((place) => {
                const color = getCategoryColor(place.category);
                return (
                  <li key={place.id}>
                    <button
                      onClick={() => {
                        setSelectedPlace(place);
                        closeSearch();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {CATEGORY_EMOJI[place.category]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {place.name}
                        </p>
                        {place.address && (
                          <p className="truncate text-xs text-gray-400">{place.address}</p>
                        )}
                      </div>
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 지도 - z-0으로 stacking context 생성 → Kakao 내부 z-index 격리 */}
      <div className="absolute inset-0 z-0">
        <KakaoMap
          places={places}
          onMarkerClick={handleMarkerClick}
          onMapClick={() => setSelectedPlace(null)}
          autoSelectPlaceId={autoSelectId}
        />
      </div>

      {/* 장소 없을 때 — 온보딩 안내 (CTA는 하단 + 버튼이 담당) */}
      {!isLoading && places.length === 0 && !searchOpen && (
        <>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center px-6 pt-32">
            <div className="max-w-xs text-center">
              <div className="mb-4 text-4xl">📍</div>
              <p className="text-base font-semibold text-gray-900">
                아직 저장된 장소가 없어요
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                인스타 게시글 URL을 붙여넣어
                <br />첫 장소를 추가해보세요
              </p>
            </div>
          </div>

          {/* BottomNav 가운데 + 버튼 가리키는 단서 */}
          <div className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-gray-500">
            <span className="text-xs font-medium">아래 + 버튼을 눌러주세요</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              className="h-6 w-6 animate-bounce"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0 6-6m-6 6-6-6" />
            </svg>
          </div>
        </>
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
      <Suspense>
        <MapContent />
      </Suspense>
    </AuthGuard>
  );
}
