-- =============================================
-- InstaPlaceSaver — Supabase SQL 마이그레이션
-- Supabase 대시보드 → SQL Editor에서 실행
-- =============================================

-- places 테이블
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  category TEXT NOT NULL CHECK (category IN ('맛집', '카페', '디저트', '술집', '기타')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  memo TEXT,
  instagram_url TEXT,
  instagram_caption TEXT,
  visited BOOLEAN DEFAULT FALSE,
  kakao_place_id TEXT,
  kakao_place_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 CRUD
CREATE POLICY "Users can view own places"
  ON places FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own places"
  ON places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own places"
  ON places FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own places"
  ON places FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_places_user_id ON places(user_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_user_category ON places(user_id, category);
