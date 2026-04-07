"use client";

import { useEffect, useRef, useState } from "react";

interface RatingModalProps {
  placeName: string;
  onConfirm: (rating: number) => void;
  onCancel: () => void;
}

const MAX = 5;
const TOTAL_STARS = 5;

export default function RatingModal({ placeName, onConfirm, onCancel }: RatingModalProps) {
  const [rating, setRating] = useState(3.0);
  const starsRef = useRef<HTMLDivElement>(null);

  function ratingFromClientX(clientX: number): number {
    const el = starsRef.current;
    if (!el) return rating;
    const { left, width } = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    const raw = ratio * MAX;
    // 0.5 단위로 반올림, 최소 0.5
    return Math.max(0.5, Math.round(raw * 2) / 2);
  }

  function handlePointerDown(e: React.PointerEvent) {
    starsRef.current?.setPointerCapture(e.pointerId);
    setRating(ratingFromClientX(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons === 0 && e.pressure === 0) return; // 터치 안 된 상태
    setRating(ratingFromClientX(e.clientX));
  }

  function handlePointerUp() {
    // nothing — rating already set
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm animate-slide-up rounded-t-3xl bg-white px-6 pb-safe pt-6">
        {/* 핸들 */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        {/* 타이틀 */}
        <p className="mb-1 text-center text-xs text-gray-400">어떠셨나요?</p>
        <p className="mb-6 text-center text-base font-semibold text-gray-900 truncate px-4">
          {placeName}
        </p>

        {/* 점수 */}
        <p className="mb-4 text-center text-3xl font-bold text-gray-900 tabular-nums">
          {rating.toFixed(1)}
          <span className="text-base font-normal text-gray-400"> / 5.0</span>
        </p>

        {/* 별 드래그 영역 */}
        <div
          ref={starsRef}
          className="mb-8 flex touch-none select-none justify-center gap-2 cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {Array.from({ length: TOTAL_STARS }, (_, i) => {
            const filled = rating >= i + 1;
            const half = !filled && rating >= i + 0.5;
            return (
              <span key={i} className="relative inline-block leading-none" style={{ fontSize: 48 }}>
                {/* 빈 별 */}
                <span className="text-gray-200">★</span>
                {/* 채워진 영역 */}
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
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-gray-200 text-sm text-gray-600"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(rating)}
            className="h-12 flex-1 rounded-xl bg-black text-sm font-medium text-white"
          >
            다녀왔어요 ✓
          </button>
        </div>
      </div>
    </div>
  );
}
