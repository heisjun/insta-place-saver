export type PlaceCategory = "맛집" | "카페" | "디저트" | "술집" | "기타";

export interface Place {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  memo: string | null;
  instagram_url: string | null;
  instagram_caption: string | null;
  instagram_image_urls: string[] | null;
  visited: boolean;
  rating?: number | null;
  kakao_place_id: string | null;
  kakao_place_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedPlace {
  name: string;
  address: string | null;
  category: PlaceCategory;
  description: string;
}

export interface KakaoSearchResult {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
  id: string; // kakao place id
}

export interface ExtractedPlaceWithKakao extends ExtractedPlace {
  kakao: KakaoSearchResult | null;
}
