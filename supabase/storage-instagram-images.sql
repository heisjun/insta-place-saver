-- =============================================
-- Storage 버킷: instagram-images
-- Supabase 대시보드 → SQL Editor에서 실행
--
-- 목적: Instagram CDN URL은 oe(만료 시각) 서명이 포함되어 24~72시간 후 만료됨.
--       크롤링 시점에 이미지를 Supabase Storage로 옮겨 영구 호스팅.
-- =============================================

-- public 버킷 생성 (이미지 자체가 공개 콘텐츠이므로 anonymous read 허용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('instagram-images', 'instagram-images', true)
ON CONFLICT (id) DO NOTHING;

-- 경로 규칙: {user_id}/{shortcode}-{index}.{ext}
-- storage.foldername(name)[1] 이 user_id 와 일치해야 INSERT/DELETE 가능

-- 업로드: 자기 폴더에만
CREATE POLICY "Users can upload own instagram images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'instagram-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 덮어쓰기(같은 shortcode 재크롤링 시): 자기 폴더만
CREATE POLICY "Users can update own instagram images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'instagram-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 삭제: 자기 폴더만
CREATE POLICY "Users can delete own instagram images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'instagram-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 조회: 누구나 (public bucket이지만 RLS 명시)
CREATE POLICY "Anyone can view instagram images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'instagram-images');
