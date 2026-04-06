// Instagram 비공식 GraphQL API를 사용한 캡션 크롤링
//
// 주의: doc_id와 응답 JSON 경로는 Instagram 변경 시 깨질 수 있음.
// 동작하지 않으면 Chrome DevTools → instagram.com 접속 → Network 탭에서
// graphql 요청을 찾아 새 doc_id와 응답 구조를 확인 후 업데이트.

const SHORTCODE_REGEX =
  /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/;
const GRAPHQL_URL = "https://www.instagram.com/api/graphql";
const DOC_ID = "10015901848480474"; // 2025년 기준 동작

export interface ScrapeResult {
  caption: string;
  authorName: string;
  shortcode: string;
}

export function extractInstagramUrl(text: string): string | null {
  const match = text.match(SHORTCODE_REGEX);
  if (!match) return null;
  return `https://www.instagram.com/p/${match[1]}/`;
}

export async function scrapeInstagramCaption(
  url: string
): Promise<ScrapeResult> {
  const match = url.match(SHORTCODE_REGEX);
  if (!match) throw new Error("유효하지 않은 인스타그램 URL입니다");
  const shortcode = match[1];

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Ig-App-Id": process.env.INSTAGRAM_X_IG_APP_ID!,
      Cookie: process.env.INSTAGRAM_COOKIE!,
      Referer: "https://www.instagram.com/",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: new URLSearchParams({
      variables: JSON.stringify({ shortcode }),
      doc_id: DOC_ID,
      lsd: "AVqbxe3J_YA",
    }),
  });

  if (!response.ok) {
    throw new Error(`Instagram 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  const media = data?.data?.xdt_shortcode_media;

  if (!media) {
    throw new Error("게시글 데이터를 찾을 수 없습니다. 비공개 계정이거나 삭제된 게시글일 수 있습니다.");
  }

  const caption =
    media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const authorName = media.owner?.username ?? "";

  return { caption, authorName, shortcode };
}
