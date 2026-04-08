import { searchKakaoPlace } from "@/lib/kakao";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "query가 필요합니다" }, { status: 400 });
  }

  try {
    const result = await searchKakaoPlace(query, null);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[map/search]", err);
    return NextResponse.json(
      { error: "카카오맵 검색에 실패했습니다" },
      { status: 500 }
    );
  }
}
