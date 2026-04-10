import Groq from "groq-sdk";
import { ExtractedPlace } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `당신은 인스타그램 맛집/카페 게시글 분석 전문가입니다.
사용자가 제공한 캡션 텍스트에서 가게 정보를 추출하세요.

추출 규칙:
1. 가게명: 이모지 구조화 형식이 있으면 최우선으로 사용 (아래 참고). 없으면 @멘션, 본문 순서로 찾기
2. 주소: 이모지 구조화 형식이 있으면 최우선으로 사용. 층수/호수는 제외하고 도로명/지번까지만 추출 (예: "서울 마포구 광성로6길 24"). 없으면 null
3. 카테고리: 맛집, 카페, 디저트, 술집, 기타 중 하나
4. 설명: 어떤 곳인지 1줄 요약 (메뉴 특징, 분위기 등)

이모지 구조화 형식 (한국 인스타그램에서 흔히 사용):
- 🏷️ 또는 📍 뒤: 정식 상호명 (가장 신뢰도 높음)
- 🏠 또는 📌 뒤: 주소
- ⏰ 또는 🕐 또는 🔒 뒤: 영업시간 (무시)
- 본문 앞쪽의 소개/감상 문구는 가게명으로 혼동하지 말 것

주의사항:
- 게시글 하나에 여러 가게가 언급될 수 있음 → 모두 추출
- 광고 문구, 할인 정보, 이벤트 내용은 무시
- 가게 정보가 없는 캡션이면 places를 빈 배열로 반환
- 반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이)

응답 형식:
{
  "places": [
    {
      "name": "가게명",
      "address": "주소 (없으면 null)",
      "category": "맛집 | 카페 | 디저트 | 술집 | 기타",
      "description": "간단 설명"
    }
  ]
}`;

const MAX_RETRIES = 3;

export async function extractPlacesFromCaption(
  caption: string
): Promise<ExtractedPlace[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: caption },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const text = completion.choices[0].message.content ?? '{"places":[]}';

      const parsed = JSON.parse(text);
      const result = Array.isArray(parsed.places) ? parsed.places : [];

      return result as ExtractedPlace[];
    } catch (err) {
      lastError = err;
      console.warn(`[extract] 시도 ${attempt}/${MAX_RETRIES} 실패:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise((res) => setTimeout(res, 500 * attempt));
      }
    }
  }

  throw lastError;
}
