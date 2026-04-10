"use client";

import AuthGuard from "@/components/layout/AuthGuard";
import KakaoMiniMap from "@/components/map/KakaoMiniMap";
import { usePlaceById } from "@/hooks/usePlaces";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { use, useRef, useState } from "react";
import { getCategoryColor } from "@/lib/mapColors";

const CATEGORY_EMOJI: Record<string, string> = {
  맛집: "🍽️",
  카페: "☕",
  디저트: "🍰",
  술집: "🍺",
  기타: "📍",
};

// ──────────────────────────────────────────────
// 이미지 캐러셀
// ──────────────────────────────────────────────
function ImageCarousel({ urls }: { urls: string[] }) {
  const [current, setCurrent] = useState(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = Math.abs(e.touches[0].clientX - startXRef.current);
    const dy = Math.abs(e.touches[0].clientY - startYRef.current);

    // 첫 이동 방향 확정
    if (isHorizontalRef.current === null && (dx > 5 || dy > 5)) {
      isHorizontalRef.current = dx > dy;
    }

    // 수평 스와이프로 확정된 경우 페이지 수직 스크롤 막기
    if (isHorizontalRef.current) {
      e.preventDefault();
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isHorizontalRef.current) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    if (dx < -40 && current < urls.length - 1) setCurrent((c) => c + 1);
    if (dx > 40 && current > 0) setCurrent((c) => c - 1);
  }

  return (
    <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: "1 / 1" }}>
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {urls.map((url, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0">
            <Image
              src={url}
              alt={`사진 ${i + 1}`}
              fill
              className="object-cover"
              unoptimized={false}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* 페이지 인디케이터 */}
      {urls.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {urls.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* 장수 표시 */}
      {urls.length > 1 && (
        <div className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
          {current + 1} / {urls.length}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 로딩 스켈레톤
// ──────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col h-dvh bg-white">
      <div className="h-14 border-b border-gray-100 flex items-center px-4">
        <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="w-full bg-gray-200 animate-pulse" style={{ aspectRatio: "1 / 1" }} />
      <div className="px-5 py-5 flex flex-col gap-3">
        <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-64 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 상세 본문
// ──────────────────────────────────────────────
function PlaceDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: place, isLoading, isError } = usePlaceById(id);

  if (isLoading) return <Skeleton />;

  if (isError || !place) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3">
        <p className="text-3xl">😅</p>
        <p className="text-sm text-gray-500">장소를 불러오지 못했어요</p>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-black px-5 py-2.5 text-sm text-white"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const color = getCategoryColor(place.category);
  const hasImages =
    place.instagram_image_urls && place.instagram_image_urls.length > 0;

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* 헤더 */}
      <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 active:bg-gray-100"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="truncate text-base font-bold text-gray-900">{place.name}</h1>
      </header>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* 이미지 캐러셀 */}
        {hasImages ? (
          <ImageCarousel urls={place.instagram_image_urls!} />
        ) : (
          <div
            className="w-full flex items-center justify-center bg-gray-50 text-4xl"
            style={{ aspectRatio: "1 / 1" }}
          >
            {CATEGORY_EMOJI[place.category]}
          </div>
        )}

        {/* 정보 섹션 */}
        <div className="px-5 py-5">
          {/* 카테고리 뱃지 */}
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {CATEGORY_EMOJI[place.category]} {place.category}
            </span>
          </div>

          {/* 가게명 */}
          <h2 className="mb-1 text-2xl font-bold text-gray-900">{place.name}</h2>

          {/* 주소 */}
          {place.address && (
            <p className="mb-4 text-sm text-gray-500">{place.address}</p>
          )}

          {/* 인스타 캡션 (있을 때만) */}
          {place.instagram_caption && (
            <div className="mb-4 rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">인스타그램 캡션</p>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                {place.instagram_caption}
              </p>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="mx-5 h-px bg-gray-100" />

        {/* 미니맵 */}
        <div className="mt-4 overflow-hidden">
          <KakaoMiniMap
            latitude={place.latitude}
            longitude={place.longitude}
            category={place.category}
            placeName={place.name}
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 px-5 py-5">
          {place.kakao_place_url && (
            <a
              href={place.kakao_place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-800"
            >
              카카오맵에서 보기
            </a>
          )}
          {place.instagram_url && (
            <a
              href={place.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl bg-black py-3 text-center text-sm font-semibold text-white"
            >
              인스타 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 페이지 진입점
// ──────────────────────────────────────────────
export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <PlaceDetailContent id={id} />
    </AuthGuard>
  );
}
