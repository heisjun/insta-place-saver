"use client";

import { Place } from "@/lib/types";
import { getCategoryColor } from "@/lib/mapColors";
import { useDeletePlace, useUpdatePlace } from "@/hooks/usePlaces";
import { useRef, useState } from "react";
import RatingModal from "./RatingModal";

interface PlaceCardProps {
  place: Place;
  onPress?: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  맛집: "🍽️",
  카페: "☕",
  디저트: "🍰",
  술집: "🍺",
  기타: "📍",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <span key={i} className="relative inline-block text-sm leading-none">
            <span className="text-gray-200">★</span>
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden text-amber-400"
                style={{ width: filled ? "100%" : "50%" }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
      <span className="ml-0.5 text-xs text-amber-500 font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
  const { mutate: updatePlace } = useUpdatePlace();
  const { mutate: deletePlace, isPending: isDeleting } = useDeletePlace();
  const [showRating, setShowRating] = useState(false);

  const [translateX, setTranslateX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);
  const DELETE_THRESHOLD = -72;

  const color = getCategoryColor(place.category);

  // 스와이프 핸들러
  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (isSwiped) {
      // 삭제 버튼이 열린 상태 → 오른쪽 드래그로 닫기
      if (dx > 0) setTranslateX(Math.min(0, DELETE_THRESHOLD + dx));
    } else {
      // 닫힌 상태 → 왼쪽 드래그로 삭제 버튼 노출
      if (dx < 0) setTranslateX(Math.max(dx, DELETE_THRESHOLD));
    }
  }

  function onTouchEnd() {
    if (isSwiped) {
      // 절반 이상 복귀했으면 닫기
      if (translateX > DELETE_THRESHOLD / 2) {
        setTranslateX(0);
        setIsSwiped(false);
      } else {
        setTranslateX(DELETE_THRESHOLD);
      }
    } else {
      if (translateX < DELETE_THRESHOLD / 2) {
        setTranslateX(DELETE_THRESHOLD);
        setIsSwiped(true);
      } else {
        setTranslateX(0);
      }
    }
    startXRef.current = null;
  }

  function handleClose() {
    setTranslateX(0);
    setIsSwiped(false);
  }

  function handleVisitButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (place.visited) {
      // 방문 취소
      updatePlace({ id: place.id, visited: false, rating: null });
    } else {
      // 별점 모달 열기
      setShowRating(true);
    }
  }

  function handleRatingConfirm(rating: number) {
    setShowRating(false);
    updatePlace({ id: place.id, visited: true, rating });
  }

  return (
    <>
      <div className="relative overflow-hidden">
        {/* 삭제 버튼 (뒤에 위치) */}
        <div className="absolute right-0 top-0 flex h-full w-[72px] items-center justify-center bg-red-500">
          <button
            onClick={() => deletePlace(place.id)}
            disabled={isDeleting}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="text-lg">{isDeleting ? "..." : "🗑️"}</span>
            <span className="text-xs">삭제</span>
          </button>
        </div>

        {/* 카드 본체 */}
        <div
          style={{ transform: `translateX(${translateX}px)` }}
          className="relative z-10 bg-white transition-transform duration-150"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={isSwiped ? handleClose : onPress}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {/* 카테고리 컬러 인디케이터 */}
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              {CATEGORY_EMOJI[place.category]}
            </div>

            {/* 정보 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {place.name}
                </p>
              </div>
              {place.address && (
                <p className="truncate text-xs text-gray-400">{place.address}</p>
              )}
              {place.visited && place.rating != null && (
                <StarDisplay rating={place.rating} />
              )}
            </div>

            {/* 방문 토글 버튼 */}
            <button
              onClick={handleVisitButtonClick}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                place.visited
                  ? "border-green-200 bg-green-50 text-green-600"
                  : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {place.visited ? "다녀왔어요" : "가고싶어요"}
            </button>
          </div>

          {/* 하단 구분선 */}
          <div className="mx-4 h-px bg-gray-100" />
        </div>
      </div>

      {/* 별점 모달 */}
      {showRating && (
        <RatingModal
          placeName={place.name}
          onConfirm={handleRatingConfirm}
          onCancel={() => setShowRating(false)}
        />
      )}
    </>
  );
}
