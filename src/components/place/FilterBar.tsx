"use client";

import { useState } from "react";
import { PlaceCategory } from "@/lib/types";
import { useCategoryFilter } from "@/store/categoryFilter";

export type SortOption = "newest" | "oldest" | "nearest";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "최신순", value: "newest" },
  { label: "오래된순", value: "oldest" },
  { label: "가까운순", value: "nearest" },
];

const CATEGORIES: { label: string; value: PlaceCategory; color: string }[] = [
  { label: "맛집", value: "맛집", color: "bg-red-500" },
  { label: "카페", value: "카페", color: "bg-violet-500" },
  { label: "디저트", value: "디저트", color: "bg-amber-500" },
  { label: "술집", value: "술집", color: "bg-blue-500" },
  { label: "기타", value: "기타", color: "bg-gray-500" },
];

interface FilterBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  geoLoading: boolean;
  geoError: boolean;
}

export default function FilterBar({
  sort,
  onSortChange,
  geoLoading,
  geoError,
}: FilterBarProps) {
  const { selected, setSelected } = useCategoryFilter();
  const [open, setOpen] = useState(false);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "최신순";

  return (
    <div className="relative flex items-center bg-white border-b border-gray-100">
      {/* 드롭다운 트리거 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-shrink-0 items-center gap-1 py-2.5 pl-4 pr-3 text-xs font-semibold text-gray-800"
      >
        {geoLoading && (
          <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-gray-600 border-t-transparent" />
        )}
        <span>{sortLabel}</span>
        {/* 드롭다운 화살표 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <>
          {/* 외부 클릭 시 닫힘 */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-30 min-w-[96px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            {SORT_OPTIONS.map(({ label, value }) => {
              const isDisabled = value === "nearest" && geoError;
              const isActive = sort === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    if (!isDisabled) {
                      onSortChange(value);
                      setOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors ${
                    isDisabled
                      ? "text-gray-300"
                      : isActive
                        ? "bg-gray-50 font-semibold text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                  )}
                  {!isActive && <span className="h-1.5 w-1.5" />}
                  {label}
                  {isDisabled && (
                    <span className="ml-auto text-[10px] text-red-300">위치 권한 필요</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 구분선 */}
      <div className="mx-1 h-4 w-px flex-shrink-0 bg-gray-200" />

      {/* 카테고리 칩 (가로 스크롤) */}
      <div className="flex flex-1 gap-2 overflow-x-auto px-3 py-2 scrollbar-none">
        <button
          onClick={() => setSelected(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected === null
              ? "bg-black text-white"
              : "border border-gray-200 bg-white text-gray-600"
          }`}
        >
          전체
        </button>
        {CATEGORIES.map(({ label, value, color }) => (
          <button
            key={value}
            onClick={() => setSelected(selected === value ? null : value)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected === value
                ? "bg-black text-white"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
