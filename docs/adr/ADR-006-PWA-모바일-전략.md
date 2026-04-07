---
ADR: 006
제목: PWA 및 모바일 공유 전략
상태: 승인됨
날짜: 2026-04-07
---

# ADR-006: PWA 및 모바일 공유 전략

## 배경

핵심 사용 시나리오: 인스타그램 앱에서 게시글을 직접 공유해서 가게를 저장하는 플로우.

## 결정

**PWA(Progressive Web App) + Web Share Target API** 사용

## Web Share Target 작동 방식

```
인스타그램 앱 → 공유하기 → 내 앱 선택
→ /add?shared_url=https://instagram.com/p/xxx
→ 자동 크롤링 + AI 분석
```

`manifest.ts`에 `share_target` 등록:
```json
{
  "share_target": {
    "action": "/add",
    "method": "GET",
    "params": { "url": "shared_url", "text": "shared_text" }
  }
}
```

## iOS vs Android

| | Android Chrome | iOS Safari |
|---|---|---|
| Web Share Target | ✅ 지원 | ❌ 미지원 |
| 홈 화면 추가 | ✅ | ✅ |
| 공유 시트 등록 | ✅ PWA로 가능 | ❌ 네이티브 앱만 가능 |

**iOS 제약**: Apple이 Safari에서 Web Share Target을 의도적으로 미구현. OS 공유 시트는 네이티브 앱에만 허용.

**iOS 대안 (현재 미구현)**:
- URL 복사 후 앱에서 붙여넣기 (현재 지원)
- iOS 단축어(Shortcuts) 앱 연동

## 현재 구현 상태

- Android: 홈 화면에 앱 추가 후 인스타그램 공유 시 앱으로 바로 전달
- iOS: URL 복사 → 앱 열어서 붙여넣기 방식

## 네이티브 앱 전환 고려 시점

사용자가 늘어나거나 iOS 공유 기능이 중요해지면 React Native 전환 검토.
현재는 웹앱으로 MVP 검증 우선.
