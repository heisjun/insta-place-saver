"use client";

import { Place } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// 스크롤 컨테이너 기준 IntersectionObserver로 필요한 시점에만 이미지 로드
function LazyCarouselImage({
  src,
  alt,
  eager,
  containerRef,
}: {
  src: string;
  alt: string;
  eager: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(eager);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const el = itemRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      {
        root: container,
        // 뷰포트 오른쪽 120px 앞에서 미리 로드
        rootMargin: "0px 120px 0px 0px",
        threshold: 0,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded, containerRef]);

  return (
    <div
      ref={itemRef}
      className="relative h-[120px] w-[120px] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-gray-100 aspect-square"
    >
      {errored ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400"
          aria-label="이미지를 불러올 수 없음"
        >
          <span className="text-xl" aria-hidden="true">📷</span>
          <span className="text-[10px]">불러올 수 없음</span>
        </div>
      ) : loaded ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="120px"
          className="object-cover pointer-events-none"
          unoptimized={false}
          onError={() => setErrored(true)}
        />
      ) : (
        // 아직 뷰포트 밖 — 플레이스홀더만 렌더링
        <div className="h-full w-full shimmer" />
      )}
    </div>
  );
}

interface PlaceOverlayProps {
  place: Place;
  onClose: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  맛집: "🍽️",
  카페: "☕",
  디저트: "🍰",
  술집: "🍺",
  기타: "📍",
};

export default function PlaceOverlay({ place, onClose }: PlaceOverlayProps) {
  // 드래그해서 닫기 상태
  const [translateY, setTranslateY] = useState(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const clientY = e.touches[0].clientY;
    const clientX = e.touches[0].clientX;
    const dy = clientY - touchStartY.current;
    const dx = Math.abs(clientX - touchStartX.current);

    // 스와이프 방향 결정
    if (!isDragging.current) {
      if (dy > dx && dy > 10) {
        // 아래로 드래그 (닫힘 판정)
        isDragging.current = true;
      } else if (dx > 10) {
        // 가로 스와이프 (이미지 캐러셀 네이티브 스크롤 허용)
        return;
      }
    }

    // 아래로 드래그 중일 때 바텀시트 내리기
    if (isDragging.current && dy > 0) {
      setTranslateY(dy);
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 80) {
      // 충분히 드래그했으면 닫기
      onClose();
    } else {
      // 덜 내렸으면 제자리로 복귀
      setTranslateY(0);
    }
    isDragging.current = false;
  };

  return (
    <div className="fixed bottom-nav left-0 right-0 z-20 overflow-hidden">
      {/* 바텀 시트 컨테이너에 터치 이벤트 바인딩 */}
      <div
        className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pt-3 pb-6 px-5 flex flex-col transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${translateY}px)`,
          // 만약 닫히는 상태면 아래로 완전히 숨기기 위해 onClose 호출되므로 애니메이션 분리 가능
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 드래그 핸들 (장식용) */}
        <div className="mx-auto mb-4 h-1 w-10 flex-shrink-0 rounded-full bg-gray-300" />

        {/* 인스타 이미지 가로 스크롤 캐러셀 */}
        {place.instagram_image_urls &&
          place.instagram_image_urls.length > 0 && (
            <div
              ref={carouselRef}
              className="-mr-5 mb-4 flex gap-2 overflow-x-auto overflow-y-hidden pb-2 touch-pan-x snap-x snap-mandatory"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              onTouchMove={(e) => {
                const dx = Math.abs(
                  e.touches[0].clientX - touchStartX.current,
                );
                const dy = e.touches[0].clientY - touchStartY.current;
                if (dx > dy) {
                  e.stopPropagation();
                }
              }}
            >
              {place.instagram_image_urls.map((url, i) => (
                <LazyCarouselImage
                  key={i}
                  src={url}
                  alt={`place photo ${i + 1}`}
                  eager={i < 3}
                  containerRef={carouselRef}
                />
              ))}
              {/* 우측 끝 여백 스페이서 */}
              <div className="w-3 flex-shrink-0" aria-hidden="true" />
            </div>
          )}

        {/* 텍스트 정보 */}
        <div className="flex flex-col">
          <div className="mb-1 flex items-center gap-1">
            <span className="text-sm">{CATEGORY_LABEL[place.category]}</span>
            <span className="text-sm font-medium text-gray-500">
              {place.category}
            </span>
          </div>
          <h2 className="mb-1 text-[22px] font-bold leading-tight text-gray-900">
            {place.name}
          </h2>
          {place.address && (
            <p className="mb-2 text-[15px] text-gray-600">{place.address}</p>
          )}
          {place.memo && (
            <p className="mb-5 text-[15px] text-gray-800">{place.memo}</p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-auto flex gap-3">
          {place.instagram_url && (
            <a
              href={place.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl bg-black py-2.5 text-center text-sm font-semibold text-white"
            >
              인스타 보기
            </a>
          )}
          {place.kakao_place_url && (
            <a
              href={place.kakao_place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-2xl border border-black bg-white py-2.5 text-center text-sm font-semibold text-black"
            >
              카카오맵에서 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
