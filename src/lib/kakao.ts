import { KakaoSearchResult } from "@/lib/types";

const KAKAO_SEARCH_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

export async function searchKakaoPlace(
  query: string
): Promise<KakaoSearchResult | null> {
  const url = `${KAKAO_SEARCH_URL}?query=${encodeURIComponent(query)}&size=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`카카오맵 검색 실패: ${response.status}`);
  }

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
