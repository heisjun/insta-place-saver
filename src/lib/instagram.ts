// Instagram 캡션 크롤링 - Apify Instagram Scraper 사용
//
// Apify가 자체 서버에서 크롤링 후 JSON 반환 → TLS/IP/Cloudflare 문제 없음
// Actor ID: shu8hvrXbJbY3Eb9W (apify/instagram-scraper)
// 무료 플랜: $5/월 크레딧 제공, 100회 호출 시 약 $0.1~0.5 소비
//
// 환경변수: APIFY_TOKEN (apify.com → Settings → API tokens)

const SHORTCODE_REGEX =
  /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/;

const APIFY_ACTOR_ID = "shu8hvrXbJbY3Eb9W";
// run-sync-get-dataset-items: 실행 완료 후 결과를 바로 반환 (최대 300초)
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;

export interface ScrapeResult {
  caption: string;
  authorName: string;
  shortcode: string;
  imageUrls: string[];
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

  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN 환경변수가 설정되지 않았습니다");

  const res = await fetch(`${APIFY_RUN_URL}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directUrls: [`https://www.instagram.com/p/${shortcode}/`],
      resultsType: "posts",
      resultsLimit: 1,
    }),
    signal: AbortSignal.timeout(120_000), // Apify 실행 최대 2분 대기
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify 요청 실패: ${res.status} ${text}`);
  }

  const items: ApifyPost[] = await res.json();

  if (!items || items.length === 0) {
    throw new Error(
      "게시글 데이터를 가져오지 못했습니다. 비공개 계정이거나 삭제된 게시글일 수 있습니다."
    );
  }

  const post = items[0];
  const caption = post.caption ?? post.description ?? "";
  const authorName = post.ownerUsername ?? post.username ?? "";

  if (!caption) {
    throw new Error("캡션이 없는 게시글입니다.");
  }

  // 이미지 추출
  let imageUrls: string[] = [];
  if (post.displayUrl) {
    imageUrls.push(post.displayUrl);
  }
  if (post.images && Array.isArray(post.images)) {
    imageUrls.push(...post.images);
  }
  if (post.childPosts && Array.isArray(post.childPosts)) {
    post.childPosts.forEach((child) => {
      if (child.displayUrl) {
        imageUrls.push(child.displayUrl);
      }
    });
  }
  // 중복 제거, null 방지, 최대 6장으로 제한 (Supabase Storage 용량 관리 목적)
  imageUrls = [...new Set(imageUrls)].filter(Boolean).slice(0, MAX_IMAGES);

  return { caption, authorName, shortcode, imageUrls };
}

export const MAX_IMAGES = 6;

// Apify Instagram Scraper 응답 타입 (주요 필드만)
interface ApifyPost {
  caption?: string;
  description?: string;
  ownerUsername?: string;
  username?: string;
  shortCode?: string;
  url?: string;
  displayUrl?: string;
  images?: string[];
  childPosts?: { displayUrl?: string }[];
}
