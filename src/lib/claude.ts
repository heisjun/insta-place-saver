import Anthropic from "@anthropic-ai/sdk";
import { ExtractedPlace } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 인스타그램 맛집/카페 게시글 분석 전문가입니다.
사용자가 제공한 캡션 텍스트에서 가게 정보를 추출하세요.

추출 규칙:
1. 가게명: 정확한 상호명. 해시태그(#가게명), @멘션, 본문에서 찾기
2. 주소/위치: 지역명, 역 이름, 동네 이름 등. 모르면 null
3. 카테고리: 맛집, 카페, 디저트, 술집, 기타 중 하나
4. 설명: 어떤 곳인지 1줄 요약 (메뉴 특징 등)

주의사항:
- 게시글 하나에 여러 가게가 언급될 수 있음 → 모두 추출
- 광고 문구, 할인 정보, 이벤트 내용은 무시
- 가게 정보가 없는 캡션이면 빈 배열 반환
- 반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이)

응답 형식:
[
  {
    "name": "가게명",
    "address": "주소 또는 위치 힌트 (없으면 null)",
    "category": "맛집 | 카페 | 디저트 | 술집 | 기타",
    "description": "간단 설명"
  }
]`;

export async function extractPlacesFromCaption(
  caption: string
): Promise<ExtractedPlace[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: caption }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // ```json 코드 펜스 제거 후 파싱
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) return [];
  return parsed;
}
