// Instagram 캡션 크롤링
//
// 현재 상태: 모든 서버 크롤링 방법 차단됨
// - Instagram 본진: TLS 핑거프린팅 + ig_did 기기 바인딩으로 차단
// - 미러 사이트(Picuki, Imginn 등): Cloudflare Bot Management + IP 차단
//
// 대안:
// A) 수동 캡션 붙여넣기 (현재 구현된 폴백 UI)
// B) Meta 공식 oEmbed API (APP_ID|APP_SECRET 필요)
// C) Puppeteer (@sparticuz/chromium, Vercel 배포 복잡)

const SHORTCODE_REGEX =
  /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/;

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

  // 서버 크롤링 현재 불가 → 폴백 UI로 전환
  throw new Error(
    "인스타그램 캡션 자동 추출이 현재 제한됩니다. 캡션을 직접 붙여넣어 주세요."
  );
}
