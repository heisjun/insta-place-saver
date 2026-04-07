import { scrapeInstagramCaption } from "@/lib/instagram";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || !url.includes("instagram.com")) {
    return NextResponse.json(
      { error: "유효하지 않은 인스타그램 URL입니다" },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeInstagramCaption(url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[instagram/scrape]", err);
    return NextResponse.json(
      {
        error: "캡션을 가져오지 못했습니다",
        fallback: true,
      },
      { status: 422 }
    );
  }
}
