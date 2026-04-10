// 카카오맵 마커용 SVG 생성 헬퍼
// lucide 아이콘 path 데이터를 핀 마커 안에 삽입하여 픽토그램 마커를 만든다.

import { PlaceCategory } from "@/lib/types";
import { getCategoryColor } from "@/lib/mapColors";

/** 줌 레벨 임계값: 이 값 이하면 픽토그램, 초과하면 도트 */
export const ZOOM_THRESHOLD = 6;

// Lucide 아이콘 SVG path (viewBox 0 0 24 24, stroke 기반)
const CATEGORY_ICON_PATHS: Record<PlaceCategory, string> = {
  맛집: [
    `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>`,
    `<path d="M7 2v20"/>`,
    `<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  ].join(""),

  카페: [
    `<path d="M10 2v2"/>`,
    `<path d="M14 2v2"/>`,
    `<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>`,
    `<path d="M6 2v2"/>`,
  ].join(""),

  디저트: [
    `<path d="M16 13H3"/>`,
    `<path d="M16 17H3"/>`,
    `<path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6"/>`,
    `<circle cx="9" cy="7" r="2"/>`,
  ].join(""),

  술집: [
    `<path d="M17 11h1a3 3 0 0 1 0 6h-1"/>`,
    `<path d="M9 12v6"/>`,
    `<path d="M13 12v6"/>`,
    `<path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/>`,
    `<path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>`,
  ].join(""),

  기타: [
    `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>`,
    `<circle cx="12" cy="10" r="3"/>`,
  ].join(""),
};

/**
 * 확대된 상태의 픽토그램 핀 마커 SVG (32×42)
 * 핀 모양 + 흰 원 + lucide 아이콘
 */
export function createPictogramMarkerSvg(category: PlaceCategory): string {
  const color = getCategoryColor(category);
  const iconPaths = CATEGORY_ICON_PATHS[category];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26s16-15 16-26C32 7.16 24.84 0 16 0z"
    fill="${color}" stroke="white" stroke-width="1.5"/>
  <svg x="7" y="7" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${iconPaths}
  </svg>
</svg>`;
}

/**
 * 축소된 상태의 도트 마커 SVG (18×18)
 * 카테고리 색상의 작은 원
 */
export function createDotMarkerSvg(category: PlaceCategory): string {
  const color = getCategoryColor(category);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
  <circle cx="9" cy="9" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
</svg>`;
}
