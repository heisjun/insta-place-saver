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
  const userPosRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null); // 현재 위치 마커
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

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

  function placeUserMarker(userPos: any) {
    const { maps } = window.kakao;

    // 기존 마커 제거
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#FF3B30" fill-opacity="0.2"/>
        <circle cx="12" cy="12" r="6" fill="#FF3B30" stroke="white" stroke-width="2"/>
      </svg>`;

    const markerImage = new maps.MarkerImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      new maps.Size(24, 24),
      { offset: new maps.Point(12, 12) },
    );

    userMarkerRef.current = new maps.Marker({
      position: userPos,
      image: markerImage,
      map: mapRef.current,
      zIndex: 10,
    });
  }

  // 지도 초기화 + 현재 위치 요청
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const { maps } = window.kakao;
    const defaultCenter = new maps.LatLng(37.5665, 126.978); // 서울 fallback

    mapRef.current = new maps.Map(containerRef.current, {
      center: defaultCenter,
      level: 7,
    });

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = new maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        userPosRef.current = userPos;
        mapRef.current.setCenter(userPos);
        mapRef.current.setLevel(5);
        placeUserMarker(userPos);
      },
      () => {
        // 위치 거부 시 서울 기본값 유지
      },
    );
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

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="14" cy="14" r="5" fill="white"/>
        </svg>`;

      const markerImage = new maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        new maps.Size(28, 36),
        { offset: new maps.Point(14, 36) },
      );

      const marker = new maps.Marker({
        position,
        image: markerImage,
        map: mapRef.current,
      });

      maps.event.addListener(marker, "click", () => {
        // 현재 줌 레벨 유지하면서 해당 마커로 이동
        mapRef.current.panTo(position);
        onMarkerClick(place);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 마커 전체가 보이도록 지도 범위 조정
    if (places.length === 1) {
      mapRef.current.setCenter(
        new maps.LatLng(places[0].latitude, places[0].longitude),
      );
      mapRef.current.setLevel(4);
    } else {
      mapRef.current.setBounds(bounds);
    }
  }, [loaded, places, onMarkerClick]);

  function handleMoveToCurrentLocation() {
    const map = mapRef.current;
    if (!map) return;

    // 이미 위치를 받은 경우 바로 이동
    if (userPosRef.current) {
      map.panTo(userPosRef.current);
      return;
    }

    // 위치를 아직 못 받은 경우 재요청
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { maps } = window.kakao;
        const userPos = new maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        userPosRef.current = userPos;
        placeUserMarker(userPos);
        map.panTo(userPos);
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* 현재 위치 버튼 — 헤더(56px) + 카테고리 필터(44px) + 여백(8px) */}
      <button
        onClick={handleMoveToCurrentLocation}
        disabled={locating}
        className="absolute left-3 top-[116px] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-60"
        aria-label="현재 위치로 이동"
      >
        {locating ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5 text-gray-700"
          >
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            <path
              strokeLinecap="round"
              d="M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
