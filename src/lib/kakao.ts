import { KakaoSearchResult } from "@/lib/types";

const KAKAO_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

/**
 * "서울 종로구 진흥로 474 1층" → "서울 종로구"
 * "경기도 수원시 팔달구 ..." → "경기도 수원시 팔달구"
 * 주소 앞부분의 시/도+구/군/시 단위만 추출해 키워드 검색에 사용
 */
function extractRegion(address: string | null): string | null {
  if (!address) return null;
  // 구/군 레벨 우선 추출, 없으면 시 레벨 fallback
  const guMatch = address.match(/^.+?[구군]/);
  if (guMatch) return guMatch[0].trim();
  const siMatch = address.match(/^.+?시/);
  return siMatch ? siMatch[0].trim() : null;
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
