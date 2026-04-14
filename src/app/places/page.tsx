"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import FilterBar, { SortOption } from "@/components/place/FilterBar";
import PlaceCard from "@/components/place/PlaceCard";
import PlaceCardSkeleton from "@/components/place/PlaceCardSkeleton";
import { usePlaces } from "@/hooks/usePlaces";
import { useCategoryFilter } from "@/store/categoryFilter";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRouter } from "next/navigation";
import { Place } from "@/lib/types";
import { useState } from "react";


function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortPlaces(
  places: Place[],
  sort: SortOption,
  userLoc: { lat: number; lng: number } | null,
) {
  if (sort === "oldest")
    return [...places].sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (sort === "nearest" && userLoc)
    return [...places].sort(
      (a, b) =>
        haversineKm(userLoc.lat, userLoc.lng, a.latitude, a.longitude) -
        haversineKm(userLoc.lat, userLoc.lng, b.latitude, b.longitude),
    );
  // 기본: 최신순
  return [...places].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function PlacesContent() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { selected } = useCategoryFilter();
  const { data: places = [], isLoading } = usePlaces(selected ?? undefined);

  const [sort, setSort] = useState<SortOption>("newest");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [query, setQuery] = useState("");

  function handleSortChange(option: SortOption) {
    if (option === "nearest") {
      if (geoError) return; // 권한 거부 상태 — 버튼 비활성
      setSort("nearest");
      if (userLoc) return; // 이미 위치 있으면 즉시 적용
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoLoading(false);
        },
        () => {
          setGeoError(true);
          setGeoLoading(false);
          setSort("newest"); // 권한 거부 시 최신순으로 복귀
        },
        { timeout: 8000 },
      );
      return;
    }
    setSort(option);
  }

  const sorted = sortPlaces(places, sort, userLoc);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sorted.filter((p) =>
        [p.name, p.address, p.memo, p.instagram_caption].some((f) =>
          f?.toLowerCase().includes(q),
        ),
      )
    : sorted;
  const visited = filtered.filter((p) => p.visited);
  const unvisited = filtered.filter((p) => !p.visited);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 pb-nav overflow-hidden">
      {/* 헤더 */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <h1 className="text-base font-bold">저장한 장소</h1>
        <button
          onClick={handleLogout}
          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500"
        >
          로그아웃
        </button>
      </header>

      {/* 검색바 */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-shrink-0 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소명, 주소, 메모로 검색"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="flex-shrink-0 text-gray-400" aria-label="검색어 지우기">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 통합 필터바 */}
      <FilterBar
        sort={sort}
        onSortChange={handleSortChange}
        geoLoading={geoLoading}
        geoError={geoError}
      />

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="flex-1 overflow-y-auto">
          <div className="mt-3">
            <div className="px-4 pb-2">
              <div className="h-3 w-24 rounded-full bg-gray-100 animate-pulse" />
            </div>
            <PlaceCardSkeleton />
          </div>
        </div>
      )}

      {/* 빈 상태 — 저장된 장소 없음 */}
      {!isLoading && places.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-4xl">📭</p>
          <p className="text-sm font-medium text-gray-500">저장된 장소가 없어요</p>
          <button
            onClick={() => router.push("/add")}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            첫 장소 추가하기
          </button>
        </div>
      )}

      {/* 빈 상태 — 검색 결과 없음 */}
      {!isLoading && places.length > 0 && q && filtered.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-4xl">😅</p>
          <p className="text-sm font-medium text-gray-500">
            &ldquo;{query}&rdquo;에 해당하는 장소가 없어요
          </p>
        </div>
      )}

      {/* 목록 */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {/* 가고싶어요 */}
          {unvisited.length > 0 && (
            <section className="mt-3">
              <h2 className="px-4 pb-2 text-xs font-semibold text-gray-400">
                가고싶어요 ({unvisited.length})
              </h2>
              <div className="bg-white">
                {unvisited.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onPress={() => router.push(`/places/${place.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 다녀왔어요 */}
          {visited.length > 0 && (
            <section className="mt-3">
              <h2 className="px-4 pb-2 text-xs font-semibold text-gray-400">
                다녀왔어요 ({visited.length})
              </h2>
              <div className="bg-white">
                {visited.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onPress={() => router.push(`/places/${place.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="h-6" />
        </div>
      )}
    </div>
  );
}

export default function PlacesPage() {
  return (
    <AuthGuard>
      <PlacesContent />
    </AuthGuard>
  );
}
