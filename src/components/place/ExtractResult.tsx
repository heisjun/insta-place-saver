"use client";

import { useSavePlace } from "@/hooks/usePlaces";
import { ExtractedPlaceWithKakao, PlaceCategory } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";

const CATEGORY_BADGE: Record<PlaceCategory, string> = {
  맛집: "bg-red-100 text-red-700",
  카페: "bg-purple-100 text-purple-700",
  디저트: "bg-amber-100 text-amber-700",
  술집: "bg-blue-100 text-blue-700",
  기타: "bg-gray-100 text-gray-700",
};

interface Props {
  places: ExtractedPlaceWithKakao[];
  instagramUrl: string;
  instagramCaption: string | null;
  imageUrls: string[];
  onComplete: (savedCount: number, firstPlaceId?: string) => void;
}

export default function ExtractResult({
  places,
  instagramUrl,
  instagramCaption,
  imageUrls,
  onComplete,
}: Props) {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<number>>(new Set());
  const [editedNames, setEditedNames] = useState<Record<number, string>>({});
  const [firstSavedPlaceId, setFirstSavedPlaceId] = useState<string | undefined>();
  const { mutateAsync: savePlace, isPending } = useSavePlace();

  const remaining = places.filter(
    (_, i) => !savedIds.has(i) && !skippedIds.has(i)
  );

  async function handleSave(place: ExtractedPlaceWithKakao, idx: number) {
    const kakao = place.kakao;
    const name = editedNames[idx] ?? place.name;

    if (!kakao) return;

    const saved = await savePlace({
      name,
      address: kakao.road_address_name || kakao.address_name || place.address,
      category: place.category,
      latitude: parseFloat(kakao.y),
      longitude: parseFloat(kakao.x),
      memo: place.description || null,
      instagram_url: instagramUrl,
      instagram_caption: instagramCaption,
      instagram_image_urls: imageUrls,
      visited: false,
      kakao_place_id: kakao.id,
      kakao_place_url: kakao.place_url,
    });

    // 첫 번째 저장된 장소 ID 기록 (지도 자동 선택용)
    const placeId = firstSavedPlaceId ?? saved?.id;
    if (!firstSavedPlaceId && saved?.id) setFirstSavedPlaceId(saved.id);

    const nextSaved = new Set(savedIds).add(idx);
    setSavedIds(nextSaved);
    if (nextSaved.size + skippedIds.size === places.length) {
      onComplete(nextSaved.size, placeId);
    }
  }

  function handleSkip(idx: number) {
    const nextSkipped = new Set(skippedIds).add(idx);
    setSkippedIds(nextSkipped);
    if (savedIds.size + nextSkipped.size === places.length) onComplete(savedIds.size);
  }

  async function handleRetrySearch(place: ExtractedPlaceWithKakao, idx: number) {
    const name = editedNames[idx] ?? place.name;
    const res = await fetch(
      `/api/map/search?query=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    if (data.result) {
      // 카카오 결과 갱신은 부모에서 관리하지 않으므로,
      // 여기서는 editedNames만 반영하고 저장 버튼 활성화를 위해 place.kakao를 갱신
      place.kakao = data.result;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-700">
        찾은 가게 {places.length}개
      </p>

      {places.map((place, idx) => {
        const isSaved = savedIds.has(idx);
        const isSkipped = skippedIds.has(idx);
        const isDone = isSaved || isSkipped;
        const editedName = editedNames[idx] ?? place.name;
        const hasKakao = !!place.kakao;

        return (
          <div
            key={idx}
            className={`rounded-2xl border p-4 transition-opacity ${
              isDone ? "opacity-40" : "border-gray-200 bg-white"
            }`}
          >
            {/* 상단: 정보(좌) + 이미지(우) */}
            <div className="flex gap-3">
              {/* 좌: 카테고리 뱃지 + 가게명 + 주소 + 설명 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={`mb-1.5 inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${
                    CATEGORY_BADGE[place.category]
                  }`}
                >
                  {place.category}
                </span>

                {/* 가게명 (편집 가능) */}
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) =>
                    setEditedNames((prev) => ({ ...prev, [idx]: e.target.value }))
                  }
                  disabled={isDone}
                  className="rounded-lg border border-transparent bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:border-gray-300 focus:outline-none disabled:bg-transparent disabled:px-0"
                />

                {/* 주소 */}
                {hasKakao ? (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    📍{" "}
                    {place.kakao!.road_address_name ||
                      place.kakao!.address_name ||
                      place.address ||
                      "주소 정보 없음"}
                  </p>
                ) : (
                  <div className="mt-1 flex items-center gap-1.5">
                    <p className="text-xs text-orange-500">
                      가게를 찾지 못했어요
                    </p>
                    <button
                      onClick={() => handleRetrySearch(place, idx)}
                      className="text-xs text-gray-400 underline"
                    >
                      재검색
                    </button>
                  </div>
                )}

                {/* 설명 */}
                <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                  {place.description}
                </p>
              </div>

              {/* 우: 썸네일 이미지 */}
              {imageUrls.length > 0 && (
                <div className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={imageUrls[0]}
                    alt="thumbnail"
                    fill
                    sizes="88px"
                    className="object-cover"
                    unoptimized={false}
                  />
                </div>
              )}
            </div>

            {/* 하단: 액션 버튼 */}
            {!isDone && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleSave(place, idx)}
                  disabled={!hasKakao || isPending}
                  className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  저장
                </button>
                <button
                  onClick={() => handleSkip(idx)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500"
                >
                  건너뛰기
                </button>
              </div>
            )}

            {isSaved && (
              <p className="mt-2 text-center text-sm font-medium text-green-600">
                ✓ 지도에 저장됨
              </p>
            )}
          </div>
        );
      })}

      {remaining.length === 0 && places.length > 0 && (
        <p className="text-center text-sm text-gray-400">모두 처리됐어요</p>
      )}
    </div>
  );
}
