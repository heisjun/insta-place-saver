import { PlaceCategory } from "@/lib/types";

export const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  맛집: "#EF4444",
  카페: "#8B5CF6",
  디저트: "#F59E0B",
  술집: "#3B82F6",
  기타: "#6B7280",
};

export function getCategoryColor(category: PlaceCategory): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["기타"];
}
