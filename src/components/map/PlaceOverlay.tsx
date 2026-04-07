"use client";

import { Place } from "@/lib/types";
import { getCategoryColor } from "@/lib/mapColors";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const color = getCategoryColor(place.category);

  return (
    <div className="absolute bottom-16 left-0 right-0 z-10 animate-slide-up">
      <div className="bg-white shadow-xl">
        {/* 상단 컬러 바 */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: color }}
        />

        <div className="p-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{CATEGORY_LABEL[place.category]}</span>
                <span className="text-xs text-gray-400">{place.category}</span>
                {place.visited && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                    방문완료
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base font-bold text-gray-900">
                {place.name}
              </h2>
              {place.address && (
                <p className="mt-0.5 text-xs text-gray-500">{place.address}</p>
              )}
              {place.memo && (
                <p className="mt-1.5 text-sm text-gray-700">{place.memo}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              ✕
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-3 flex gap-2">
            {place.kakao_place_url && (
              <a
                href={place.kakao_place_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-xs font-medium text-gray-700"
              >
                카카오맵에서 보기
              </a>
            )}
            {place.instagram_url && (
              <a
                href={place.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-xs font-medium text-gray-700"
              >
                인스타 보기
              </a>
            )}
            <button
              onClick={() => router.push(`/places`)}
              className="flex-1 rounded-xl bg-black py-2 text-center text-xs font-medium text-white"
            >
              목록 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
