"use client";

import { Place } from "@/lib/types";
import { getCategoryColor } from "@/lib/mapColors";
import { useEffect, useRef, useState } from "react";

interface KakaoMapProps {
  places: Place[];
  onMarkerClick: (place: Place) => void;
}

declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export default function KakaoMap({ places, onMarkerClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Kakao Maps SDK 로드
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

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const { maps } = window.kakao;
    const center = new maps.LatLng(37.5665, 126.978); // 서울 기본값

    mapRef.current = new maps.Map(containerRef.current, {
      center,
      level: 7,
    });
  }, [loaded]);

  // 마커 렌더링
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const { maps } = window.kakao;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (places.length === 0) return;

    const bounds = new maps.LatLngBounds();

    places.forEach((place) => {
      const position = new maps.LatLng(place.latitude, place.longitude);
      const color = getCategoryColor(place.category);

      // 커스텀 SVG 마커
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="14" cy="14" r="5" fill="white"/>
        </svg>`;

      const markerImage = new maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        new maps.Size(28, 36),
        { offset: new maps.Point(14, 36) }
      );

      const marker = new maps.Marker({
        position,
        image: markerImage,
        map: mapRef.current,
      });

      maps.event.addListener(marker, "click", () => {
        mapRef.current.panTo(position);
        onMarkerClick(place);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 마커 전체가 보이도록 지도 범위 조정
    if (places.length === 1) {
      mapRef.current.setCenter(
        new maps.LatLng(places[0].latitude, places[0].longitude)
      );
      mapRef.current.setLevel(4);
    } else {
      mapRef.current.setBounds(bounds);
    }
  }, [loaded, places, onMarkerClick]);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
