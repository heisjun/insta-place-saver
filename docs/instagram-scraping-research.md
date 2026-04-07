# Instagram 크롤링 시도 및 실패 분석

> 작성일: 2026-04-07  
> 목적: 인스타그램 게시글 URL로 캡션을 자동 추출하는 기능 구현 시도 및 실패 원인 정리  
> 독자: 팀원, 기술 논의용

---

## 배경

사용자가 인스타그램 게시글 URL을 앱에 입력하면, 서버가 해당 게시글의 캡션을 자동으로 가져와 AI로 가게 정보를 추출하는 기능이 핵심 요구사항이다.

공식 Instagram API(Basic Display API, Graph API)는 **앱 심사 및 승인이 필요**하기 때문에, 개인 프로젝트 특성상 비공식 방법을 탐색했다.

---

## 시도 1: Instagram 비공식 GraphQL API (doc_id 방식)

### 방법

Instagram 웹에서 게시글 데이터를 불러올 때 사용하는 내부 GraphQL 엔드포인트를 직접 호출하는 방식.

```
POST https://www.instagram.com/api/graphql
Content-Type: application/x-www-form-urlencoded

variables={"shortcode":"<POST_SHORTCODE>"}
doc_id=10015901848480474
lsd=AVqbxe3J_YA
```

브라우저에서 인스타그램 접속 후 DevTools → Network 탭에서 `graphql` 요청을 찾아 `doc_id`와 요청 형식을 추출했다.

인증을 위해 브라우저에서 로그인한 상태의 쿠키(`INSTAGRAM_COOKIE`)와 앱 식별자(`X-Ig-App-Id`)를 헤더에 포함했다.

**기대한 응답 구조:**
```json
{
  "data": {
    "xdt_shortcode_media": {
      "edge_media_to_caption": {
        "edges": [{ "node": { "text": "캡션 내용" } }]
      },
      "owner": { "username": "작성자" }
    }
  }
}
```

### 실패 원인

서버에서 요청 시 JSON 대신 `<!DOCTYPE html>` HTML 페이지가 반환됐다.

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

Instagram이 반환한 HTML은 로그인/동의 페이지였다. 원인은 다음 중 하나 이상으로 판단된다:

1. **브라우저 핑거프린트 불일치**: Instagram은 쿠키 외에도 브라우저 환경(User-Agent, `Sec-Fetch-*` 헤더, JS 실행 여부 등)을 종합적으로 검증한다. 서버에서 보낸 요청은 이 검증을 통과하지 못한다.
2. **`ig_did` 기기 바인딩**: 쿠키의 `ig_did` 값은 특정 브라우저 인스턴스에 바인딩되어 있어, 다른 환경(서버)에서 동일 쿠키를 사용하면 비정상 요청으로 감지된다.
3. **`lsd` 토큰 고정값 문제**: `lsd` 값이 동적으로 발급되는 CSRF 토큰인데, 하드코딩된 값(`AVqbxe3J_YA`)을 사용해 검증에 실패했을 가능성이 있다.

### 시도한 보완책

- `Origin`, `Referer`, `Accept-Language`, `X-CSRFToken` 헤더 추가
- Instagram 홈페이지에서 `lsd` 토큰 동적 추출 시도 → 추출 자체도 실패 (동일한 HTML 차단)
- User-Agent를 Mac Chrome으로 변경

→ 모두 동일하게 HTML 반환, 돌파 실패

---

## 시도 2: Instagram Embed 페이지 파싱

### 방법

Instagram이 서드파티 웹사이트 퍼가기용으로 제공하는 embed 페이지를 파싱하는 방식.

```
GET https://www.instagram.com/p/<SHORTCODE>/embed/captioned/
```

인스타그램 웹에서 "게시물 퍼가기"를 선택하면 아래와 같은 `<blockquote>` 코드를 제공한다:

```html
<blockquote class="instagram-media" 
  data-instgrm-permalink="https://www.instagram.com/p/DWT3ZjzksOW/..."
  ...>
</blockquote>
<script async src="//www.instagram.com/embed.js"></script>
```

`embed.js`가 브라우저에서 실행될 때 위 embed URL을 호출해 실제 게시물 데이터를 가져오는 구조다. 서버에서 직접 이 URL을 호출해 HTML을 파싱하면 캡션을 얻을 수 있을 것이라 가정했다.

**파싱 시도한 패턴들:**
- `class="Caption"` 요소
- `"caption":"..."` JSON 패턴
- `og:description` 메타 태그
- `window.__additionalData`, `window._sharedData` JSON 블록
- `__bbox` 내부 데이터 구조

### 실패 원인

784KB 크기의 HTML을 수신했으나, 실제 게시물 데이터가 없었다.

```python
# 페이지 타이틀 확인
title: "Instagram"  # 실제 게시물 제목이 아님

# shortcode는 존재하지만 게시물 데이터 없음
"DWT3ZjzksOW" in html → True
"han_coff" (작성자명) in html → False

# 에러 페이지 확인
"PolarisErrorRoot.entrypoint" in html → True
```

반환된 페이지는 게시물 내용이 아닌 **에러/로딩 페이지**였다. `embed.js`는 브라우저 환경에서 JS가 실행된 후 동적으로 게시물 데이터를 불러오는 방식이기 때문에, 서버에서 정적 HTML을 파싱하는 방법으로는 캡션을 얻을 수 없다.

---

## 시도 3: Instagram oEmbed API

### 방법

Instagram이 공식으로 제공하는 oEmbed 엔드포인트 호출.

```
GET https://api.instagram.com/oembed/?url=https://www.instagram.com/p/<SHORTCODE>/
```

공개 게시물에 대해 인증 없이 캡션 데이터를 반환한다는 문서를 참고했다.

### 실패 원인

HTTP 200이지만 **응답 바디가 비어있음** (`content-length: 0`).

```
< HTTP/1.1 200 OK
< content-length: 0
```

Instagram이 이 엔드포인트의 인증 없는 접근을 차단한 것으로 보인다. 현재는 **Meta 개발자 앱의 access token** (`APP_ID|APP_SECRET`) 이 필요하다.

---

## 시도 4: `?__a=1` 비공개 JSON API

### 방법

과거에 동작했던 Instagram 내부 JSON API.

```
GET https://www.instagram.com/p/<SHORTCODE>/?__a=1&__d=dis
```

과거에는 로그인 없이 게시물 데이터를 JSON으로 반환했다.

### 실패 원인

**404 Not Found** 반환. 해당 엔드포인트는 완전히 비활성화됐다.

```html
<title>Page Not Found • Instagram</title>
```

---

## 종합 분석

### Instagram 서버 측 차단 메커니즘

현재 Instagram은 다음과 같은 다층 보호를 적용하고 있다:

```
요청 수신
  ├─ User-Agent 검사 (봇 시그니처 필터링)
  ├─ IP 레퓨테이션 검사 (데이터센터 IP 차단)
  ├─ Sec-Fetch-* 헤더 검사 (브라우저 출처 확인)
  ├─ 쿠키 유효성 검사
  │    └─ ig_did (기기 ID) 바인딩 확인
  │    └─ sessionid 유효성 확인
  └─ JS 실행 여부 확인 (Challenge 방식)
```

서버에서 아무리 쿠키를 포함해도, 실제 브라우저 환경이 아니기 때문에 위 체크 중 하나 이상에서 실패한다.

---

## 대안 방안 (팀 논의 필요)

### 방안 A: 수동 캡션 붙여넣기 (현재 구현됨)

크롤링 실패 시 사용자가 직접 캡션을 붙여넣는 폴백 UI.

- **장점**: 구현 완료, 안정적, Instagram 정책 변화에 영향 없음
- **단점**: UX 저하 (앱 전환 후 복사·붙여넣기 필요)
- **적합 상황**: MVP, 개인 소규모 사용

### 방안 B: Puppeteer (헤드리스 브라우저)

실제 Chrome 브라우저를 서버에서 실행해 크롤링.

```
Server → Puppeteer(Chrome) → Instagram (실제 브라우저로 인식) → 캡션 추출
```

- **장점**: 실제 브라우저이므로 차단 가능성 낮음
- **단점**:
  - 메모리 사용량 큼 (인스턴스당 ~300MB)
  - Vercel 무료 플랜 실행 불가 (함수 메모리 한도 1GB, 실행시간 제한)
  - `@sparticuz/chromium` 등 패키지로 Lambda/Vercel 배포 가능하나 복잡
  - 크롤링 감지될 경우 CAPTCHA 발생 가능
- **적합 상황**: 사용자가 많아지거나 UX 개선이 필요할 때

### 방안 C: Meta 공식 oEmbed API

Meta 개발자 앱을 등록하고 App Access Token을 사용.

```
GET https://graph.facebook.com/v18.0/instagram_oembed
  ?url=https://www.instagram.com/p/<SHORTCODE>/
  &access_token=<APP_ID>|<APP_SECRET>
```

- **장점**: 공식 API, 안정적
- **단점**:
  - 반환되는 `title` 필드가 캡션 전체가 아닌 일부(약 200자)일 수 있음
  - Meta 개발자 앱 등록 및 설정 필요
  - 공개 게시물만 접근 가능
- **적합 상황**: 안정적인 크롤링이 필요하고 공개 게시물만 처리하는 경우

### 방안 D: Instagram Basic Display API (공식)

Meta 개발자 앱 심사를 통해 공식 API 접근.

- **장점**: 가장 안정적이고 공식적
- **단점**: **앱 심사 필요** (개인 프로젝트는 심사 통과 어려움), 승인까지 수 주 소요
- **적합 상황**: 서비스 공식 출시 시

---

## 현재 적용된 해결책

크롤링 실패 시 사용자에게 **캡션 직접 붙여넣기 폼**을 노출하는 폴백 UI를 구현함.

```
URL 입력 → 크롤링 시도
  ├─ 성공 → AI 분석 → 가게 카드 표시
  └─ 실패 → 에러 메시지 + 캡션 붙여넣기 폼 노출
                └─ 캡션 입력 → AI 분석 → 가게 카드 표시
```

인스타그램 앱에서 캡션 텍스트를 길게 눌러 복사 후 붙여넣으면 동일한 흐름으로 진행된다.

---

## 참고

- [Instagram Graph API 문서](https://developers.facebook.com/docs/instagram-api)
- [Instagram oEmbed 문서](https://developers.facebook.com/docs/instagram/oembed)
- [Puppeteer + Vercel 배포 가이드](https://github.com/Sparticuz/chromium)
