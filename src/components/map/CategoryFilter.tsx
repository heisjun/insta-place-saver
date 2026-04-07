"use client";

import { PlaceCategory } from "@/lib/types";
import { useCategoryFilter } from "@/store/categoryFilter";

const CATEGORIES: { label: string; value: PlaceCategory; color: string }[] = [
  { label: "맛집", value: "맛집", color: "bg-red-500" },
  { label: "카페", value: "카페", color: "bg-violet-500" },
  { label: "디저트", value: "디저트", color: "bg-amber-500" },
  { label: "술집", value: "술집", color: "bg-blue-500" },
  { label: "기타", value: "기타", color: "bg-gray-500" },
];

export default function CategoryFilter() {
  const { selected, setSelected } = useCategoryFilter();

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
      <button
        onClick={() => setSelected(null)}
        className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          selected === null
            ? "bg-black text-white"
            : "bg-white text-gray-600 border border-gray-200"
        }`}
      >
        전체
      </button>
      {CATEGORIES.map(({ label, value, color }) => (
        <button
          key={value}
          onClick={() => setSelected(selected === value ? null : value)}
          className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected === value
              ? "bg-black text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${color}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
