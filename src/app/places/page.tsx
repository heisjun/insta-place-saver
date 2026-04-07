"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import CategoryFilter from "@/components/map/CategoryFilter";
import PlaceCard from "@/components/place/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";
import { useCategoryFilter } from "@/store/categoryFilter";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRouter } from "next/navigation";

function PlacesContent() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { selected } = useCategoryFilter();
  const { data: places = [], isLoading } = usePlaces(selected ?? undefined);

  const visited = places.filter((p) => p.visited);
  const unvisited = places.filter((p) => !p.visited);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-16">
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

      {/* 카테고리 필터 */}
      <div className="bg-white border-b border-gray-100">
        <CategoryFilter />
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
        </div>
      )}

      {/* 빈 상태 */}
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

      {/* 목록 */}
      {!isLoading && places.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {/* 미방문 */}
          {unvisited.length > 0 && (
            <section className="mt-3">
              <h2 className="px-4 pb-2 text-xs font-semibold text-gray-400">
                가고 싶어요 ({unvisited.length})
              </h2>
              <div className="bg-white">
                {unvisited.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </section>
          )}

          {/* 방문 완료 */}
          {visited.length > 0 && (
            <section className="mt-3">
              <h2 className="px-4 pb-2 text-xs font-semibold text-gray-400">
                방문 완료 ({visited.length})
              </h2>
              <div className="bg-white">
                {visited.map((place) => (
                  <PlaceCard key={place.id} place={place} />
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
