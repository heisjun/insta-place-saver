---
ADR: 003
제목: AI 모델 선정 (캡션 → 가게 정보 추출)
상태: 승인됨
날짜: 2026-04-07
---

# ADR-003: AI 모델 선정

## 배경

인스타그램 캡션 텍스트에서 가게명, 주소, 카테고리, 설명을 추출하기 위해 LLM을 사용한다.
개인 프로젝트이므로 무료 또는 저비용 모델이 필요하다.

## 결정

**Google Gemini 2.5 Flash** (`gemini-2.5-flash`) 사용
- 파일: `src/lib/claude.ts` (파일명은 하위 호환성 유지를 위해 유지)
- 패키지: `@google/generative-ai`
- 키 발급: [aistudio.google.com](https://aistudio.google.com)

## 경위

1. **초기 설계**: Claude API (`claude-sonnet-4-20250514`) 로 설계
2. **Claude API 유료 확인**: Claude Pro 구독과 별개로 API 사용량 기반 과금
3. **Gemini 전환 결정**: AI Studio 키로 무료 사용 가능
4. **모델 탐색**:
   - `gemini-1.5-flash` → 404 (미지원)
   - `gemini-2.0-flash` → 429 (무료 쿼터 0, Google Cloud Console 키 문제)
   - `gemini-2.5-flash` → ✅ AI Studio 키로 정상 동작

## 근거

- AI Studio 무료 키로 충분한 쿼터 제공
- 캡션 분석 수준의 태스크에 충분한 성능
- `gemini-2.5-flash`는 thinking 모드 지원으로 응답 품질 우수

## 주의사항

- `src/lib/claude.ts` 파일명은 변경하지 않음 (import 경로 일관성)
- 파일 최상단 주석으로 실제 Gemini 사용임을 명시
- 쿼터 초과 시 Google AI Studio에서 유료 플랜 전환 필요
