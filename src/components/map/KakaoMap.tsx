"use client";

import { Place, PlaceCategory } from "@/lib/types";
import {
  createPictogramMarkerSvg,
  createDotMarkerSvg,
  ZOOM_THRESHOLD,
} from "@/lib/markerIcons";
import { useEffect, useRef, useState, useCallback } from "react";

interface KakaoMapProps {
  places: Place[];
  onMarkerClick: (place: Place) => void;
  onMapClick?: () => void;
  autoSelectPlaceId?: string;
}

declare global {
  interface Window {
    kakao: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

/** 마커 + 라벨 + 카테고리를 묶어 관리 */
interface MarkerData {
  marker: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  label: any; // CustomOverlay for place name
  category: PlaceCategory;
}

export default function KakaoMap({
  places,
  onMarkerClick,
  onMapClick,
  autoSelectPlaceId,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersDataRef = useRef<MarkerData[]>([]);
  const userPosRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const selectedIdxRef = useRef<number | null>(null);
  const hasPositionedRef = useRef(false); // 위치(geolocation 또는 autoSelect)로 이미 이동했으면 true
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

  // ──────────────────────────────────────────────
  // 마커 이미지 생성 헬퍼
  // ──────────────────────────────────────────────
  const createDotImage = useCallback((category: PlaceCategory) => {
    const { maps } = window.kakao;
    const svg = createDotMarkerSvg(category);
    return new maps.MarkerImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      new maps.Size(18, 18),
      {
        offset: new maps.Point(9, 9),
        shape: "rect",
        coords: "0,0,18,18",
      },
    );
  }, []);

  const createPictogramImage = useCallback((category: PlaceCategory) => {
    const { maps } = window.kakao;
    const svg = createPictogramMarkerSvg(category);
    return new maps.MarkerImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      new maps.Size(32, 42),
      { offset: new maps.Point(16, 42) },
    );
  }, []);

  // ──────────────────────────────────────────────
  // 선택된 마커를 픽토그램으로, 이전 선택 해제
  // ──────────────────────────────────────────────
  const selectMarker = useCallback(
    (idx: number) => {
      // 이전 선택 마커를 도트로 복귀
      if (selectedIdxRef.current !== null && selectedIdxRef.current !== idx) {
        const prev = markersDataRef.current[selectedIdxRef.current];
        if (prev) {
          prev.marker.setImage(createDotImage(prev.category));
          prev.marker.setZIndex(0);
        }
      }
      // 새 마커를 픽토그램으로 변경
      const data = markersDataRef.current[idx];
      if (data) {
        data.marker.setImage(createPictogramImage(data.category));
        data.marker.setZIndex(5);
        selectedIdxRef.current = idx;
      }
    },
    [createDotImage, createPictogramImage],
  );

  const deselectMarker = useCallback(() => {
    if (selectedIdxRef.current !== null) {
      const prev = markersDataRef.current[selectedIdxRef.current];
      if (prev) {
        prev.marker.setImage(createDotImage(prev.category));
        prev.marker.setZIndex(0);
      }
      selectedIdxRef.current = null;
    }
  }, [createDotImage]);

  // ──────────────────────────────────────────────
  // 줌 레벨에 따라 라벨 표시/숨김
  // ──────────────────────────────────────────────
  const updateLabelsForZoom = useCallback((level: number) => {
    const show = level <= ZOOM_THRESHOLD;
    markersDataRef.current.forEach(({ label }) => {
      if (show) {
        label.setMap(mapRef.current);
      } else {
        label.setMap(null);
      }
    });
  }, []);

  // ──────────────────────────────────────────────
  // Kakao Maps SDK 로드
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // 현재 위치 마커 (빨간 점)
  // ──────────────────────────────────────────────
  function placeUserMarker(userPos: any) {
    const { maps } = window.kakao;

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

  // ──────────────────────────────────────────────
  // 지도 초기화 + 현재 위치 요청
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const { maps } = window.kakao;
    const defaultCenter = new maps.LatLng(37.5665, 126.978); // 서울 fallback

    mapRef.current = new maps.Map(containerRef.current, {
      center: defaultCenter,
      level: 7,
    });

    // 지도 빈 영역 클릭 시 오버레이 닫기 + 선택 마커 해제
    maps.event.addListener(mapRef.current, "click", () => {
      deselectMarker();
      if (onMapClick) onMapClick();
    });

    // 줌 변경 시 라벨 표시/숨김
    maps.event.addListener(mapRef.current, "zoom_changed", () => {
      const level = mapRef.current.getLevel();
      updateLabelsForZoom(level);
    });

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = new maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        userPosRef.current = userPos;
        hasPositionedRef.current = true;
        mapRef.current.setCenter(userPos);
        mapRef.current.setLevel(5);
        placeUserMarker(userPos);
      },
      () => {
        // 위치 거부 시 서울 기본값 유지
      },
    );
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────
  // 마커 + 라벨 렌더링
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const { maps } = window.kakao;

    // 기존 마커 + 라벨 제거
    markersDataRef.current.forEach(({ marker, label }) => {
      marker.setMap(null);
      label.setMap(null);
    });
    markersDataRef.current = [];
    selectedIdxRef.current = null;

    if (places.length === 0) return;

    const currentLevel = mapRef.current.getLevel();
    const showLabels = currentLevel <= ZOOM_THRESHOLD;
    const bounds = new maps.LatLngBounds();

    places.forEach((place, idx) => {
      const position = new maps.LatLng(place.latitude, place.longitude);

      // 기본은 항상 도트 마커
      const markerImage = createDotImage(place.category);

      const marker = new maps.Marker({
        position,
        image: markerImage,
        map: mapRef.current,
      });

      // 가게 이름 라벨 (CustomOverlay)
      const labelContent = `<div style="
        font-size:11px;
        font-weight:600;
        color:#111;
        text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;
        white-space:nowrap;
        text-align:center;
        pointer-events:none;
        padding-top:6px;
      ">${place.name}</div>`;

      const label = new maps.CustomOverlay({
        position,
        content: labelContent,
        yAnchor: 0,
        map: showLabels ? mapRef.current : null,
      });

      maps.event.addListener(marker, "click", () => {
        selectMarker(idx);

        // 바텀시트 오버레이 위에 마커가 보이도록 지도를 약간 위쪽으로 오프셋
        const projection = mapRef.current.getProjection();
        const point = projection.pointFromCoords(position);
        point.y += 150; // 마커를 화면 상단 쪽으로 올림
        const offsetCenter = projection.coordsFromPoint(point);
        mapRef.current.panTo(offsetCenter);

        onMarkerClick(place);
      });

      markersDataRef.current.push({
        marker,
        label,
        category: place.category,
      });
      bounds.extend(position);
    });

    // 위치가 아직 설정되지 않은 경우에만 마커 기준으로 지도 범위 조정
    if (!hasPositionedRef.current) {
      if (places.length === 1) {
        mapRef.current.setCenter(
          new maps.LatLng(places[0].latitude, places[0].longitude),
        );
        mapRef.current.setLevel(4);
      } else {
        mapRef.current.setBounds(bounds);
      }
    }

    // 자동 선택: selectId로 진입한 경우 해당 마커를 선택 + panTo
    if (autoSelectPlaceId) {
      const targetIdx = places.findIndex((p) => p.id === autoSelectPlaceId);
      if (targetIdx !== -1) {
        hasPositionedRef.current = true;
        // 지도 범위 조정 애니메이션이 끝난 뒤 실행
        setTimeout(() => {
          selectMarker(targetIdx);
          const target = places[targetIdx];
          const position = new maps.LatLng(target.latitude, target.longitude);
          // 가게명 라벨이 보이는 줌 레벨로 확대
          mapRef.current.setLevel(5);
          // 오버레이가 마커를 가리지 않도록 위쪽으로 오프셋
          const projection = mapRef.current.getProjection();
          const point = projection.pointFromCoords(position);
          point.y += 150;
          const offsetCenter = projection.coordsFromPoint(point);
          mapRef.current.panTo(offsetCenter);
          onMarkerClick(target);
        }, 500);
      }
    }
  }, [
    loaded,
    places,
    onMarkerClick,
    createDotImage,
    selectMarker,
    autoSelectPlaceId,
  ]);

  // ──────────────────────────────────────────────
  // 현재 위치로 이동
  // ──────────────────────────────────────────────
  function handleMoveToCurrentLocation() {
    const map = mapRef.current;
    if (!map) return;

    if (userPosRef.current) {
      map.panTo(userPosRef.current);
      return;
    }

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
