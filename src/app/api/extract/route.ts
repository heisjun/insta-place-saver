import { extractPlacesFromCaption } from "@/lib/claude";
import { searchKakaoPlace } from "@/lib/kakao";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { caption } = await request.json();

  if (!caption || typeof caption !== "string") {
    return NextResponse.json(
      { error: "caption이 필요합니다" },
      { status: 400 }
    );
  }

  // 1. Claude AI로 가게 정보 추출
  let extracted;
  try {
    extracted = await extractPlacesFromCaption(caption);
  } catch (err) {
    console.error("[extract] Claude 추출 실패", err);
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다" },
      { status: 500 }
    );
  }

  if (extracted.length === 0) {
    return NextResponse.json({ places: [] });
  }

  // 2. 각 가게에 대해 카카오맵 검색 병렬 실행
  const places = await Promise.all(
    extracted.map(async (place) => {
      const query = place.address
        ? `${place.name} ${place.address}`
        : place.name;

      try {
        const kakao = await searchKakaoPlace(query);
        return { ...place, kakao };
      } catch {
        return { ...place, kakao: null };
      }
    })
  );

  return NextResponse.json({ places });
}
