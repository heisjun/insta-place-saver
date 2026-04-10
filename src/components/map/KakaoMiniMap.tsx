"use client";

import { useEffect, useRef, useState } from "react";
import { PlaceCategory } from "@/lib/types";
import { getCategoryColor } from "@/lib/mapColors";

interface KakaoMiniMapProps {
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  placeName: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMiniMap({
  latitude,
  longitude,
  category,
  placeName,
}: KakaoMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Kakao SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => setLoaded(true));
    document.head.appendChild(script);
  }, []);

  // 지도 초기화 (비인터랙티브)
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const { maps } = window.kakao;
    const position = new maps.LatLng(latitude, longitude);

    const map = new maps.Map(containerRef.current, {
      center: position,
      level: 4,
    });

    // 마커
    const color = getCategoryColor(category);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`;

    const markerImage = new maps.MarkerImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      new maps.Size(28, 36),
      { offset: new maps.Point(14, 36) }
    );

    new maps.Marker({ position, map, image: markerImage });

    // 가게명 라벨
    const label = new maps.CustomOverlay({
      position,
      content: `<div style="
        font-size:11px;font-weight:700;color:#111;
        text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;
        white-space:nowrap;text-align:center;pointer-events:none;padding-top:6px;
      ">${placeName}</div>`,
      yAnchor: 0,
      map,
    });

    return () => {
      label.setMap(null);
    };
  }, [loaded, latitude, longitude, category, placeName]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: 180 }}
      aria-label={`${placeName} 위치 지도`}
    />
  );
}
