import { KakaoSearchResult } from "@/lib/types";

const KAKAO_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

/** "서울 마포구 광성로6길 24 2층" → "서울 마포구" */
function extractRegion(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/[가-힣]+\s*[시도]\s*[가-힣]+\s*[구군]/);
  return match ? match[0] : null;
}

async function searchOnce(query: string): Promise<KakaoSearchResult | null> {
  const url = `${KAKAO_SEARCH_URL}?query=${encodeURIComponent(query)}&size=1`;
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  });
  if (!response.ok) throw new Error(`카카오맵 검색 실패: ${response.status}`);
  const data = await response.json();
  const place = data.documents?.[0];
  if (!place) return null;
  return {
    place_name: place.place_name,
    address_name: place.address_name,
    road_address_name: place.road_address_name,
    x: place.x,
    y: place.y,
    place_url: place.place_url,
    id: place.id,
  };
}

export async function searchKakaoPlace(
  name: string,
  address: string | null
): Promise<KakaoSearchResult | null> {
  // 1차: 가게명 + 구 단위 (e.g. "괄호 서울 마포구")
  const region = extractRegion(address);
  if (region) {
    const result = await searchOnce(`${name} ${region}`);
    if (result) return result;
  }

  // 2차: 가게명만
  return searchOnce(name);
}
