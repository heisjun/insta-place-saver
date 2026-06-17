---
name: scaffold-component
description: 새 React 컴포넌트의 파일 위치·Server/Client 구분·테스트 골격을 판단해 생성한다. 사용자가 "X 컴포넌트 만들어줘"라고 요청하거나 dev-cycle의 1단계로 호출될 때 사용한다.
---

# scaffold-component — 컴포넌트 골격 생성

## 목적

컴포넌트 이름과 도메인 힌트만 받고 **위치·Server/Client·테스트 케이스 셋**을 *판단*해 일관된 골격을 만든다.

## 입력

| 키 | 필수 | 설명 |
|---|---|---|
| `name` | ✅ | PascalCase 컴포넌트명 (예: `MemoEditor`) |
| `domainHint` | ❌ | 사용자 자연어 힌트 (예: "지도 핀 클릭 시 뜨는 모달") |
| `route` | ❌ | 페이지 전용일 때 라우트 경로 (예: `/places/[id]`) |

## 판단 기준

### 1. 파일 위치 판단 트리

```
페이지 전용인가? (route 인자가 있거나 한 페이지에서만 쓰임)
├─ YES → src/app/<route>/_components/<Name>.tsx
└─ NO → 도메인 추론으로 src/components/<domain>/<Name>.tsx
        - 이름이 Map|Marker|Overlay|Kakao 포함 → map
        - 이름이 Place|Filter|Rating|Url|Extract 포함 → place
        - 이름이 Header|Nav|Footer|Layout 포함 → layout
        - 이름이 Provider 포함 → providers
        - 매칭 없음 → 사용자에게 "어느 도메인으로 둘까요?" 질문
```

### 2. Server vs Client 판단

| 신호 | 결정 |
|---|---|
| 상태(useState), 이펙트(useEffect), 이벤트 핸들러 사용 | `"use client"` |
| 브라우저 API (window, document, localStorage) | `"use client"` |
| framer-motion, lucide-react, 사용자 입력 처리 | `"use client"` |
| TanStack Query 훅 사용 | `"use client"` |
| 순수 표시용 + props만 받음 | Server (기본) |

판단이 모호하면 보수적으로 Server로 만든다. 구현 단계에서 `"use client"` 추가는 비용이 작다.

### 3. 테스트 케이스 최소 셋 — *어떤 케이스를 만들지 판단*

다음 4축 중 해당하는 것만 생성한다.

| 축 | 생성 조건 | 케이스 이름 |
|---|---|---|
| 렌더 | 항상 | `필수 props로 렌더된다` |
| 상호작용 | onClick/onChange/onSubmit prop이 있을 때 | `<핸들러>가 호출된다` |
| 조건부 분기 | 카테고리·visited·rating 같은 enum/boolean prop | `<prop 값>일 때 <표현>이 변한다` |
| 엣지 | 배열 prop 또는 긴 텍스트 가능성 | `빈 배열일 때 빈 상태가 보인다` |

### 4. 이름 검증

- PascalCase 위반 → 자동 변환 후 사용자에게 알림
- 이미 같은 이름의 파일 존재 → 중단하고 사용자 확인 요청
- 한 글자 이름·예약어(`Component`, `Page`) → 거부

## 출력

### 생성 파일

```
<path>/<Name>.tsx
<path>/<Name>.test.tsx
```

### 컴포넌트 템플릿 (Client 예시)

```tsx
"use client";

interface <Name>Props {
  // TODO: props 정의
}

export default function <Name>({}: <Name>Props) {
  return (
    <div>
      {/* TODO: 구현 */}
    </div>
  );
}
```

### 테스트 템플릿

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import <Name> from "./<Name>";

describe("<Name>", () => {
  it("필수 props로 렌더된다", () => {
    render(<<Name> />);
    // expect(screen.getByRole("...")).toBeInTheDocument();
  });

  // 판단 기준에 따라 추가된 케이스만 남김
});
```

### 응답 메시지

```
✅ scaffold-component 완료
- 위치: <path>/<Name>.tsx (Client / Server)
- 도메인 판단 근거: <한 줄>
- 테스트 케이스 N건 생성 (이유 표시)

구현 후 self-review 또는 `npm run test:watch`로 확인하세요.
```

## 거부 조건

- 동일 파일이 이미 존재
- 이름이 PascalCase로 변환 불가
- 도메인 추론 실패 + 사용자 힌트 없음 → 질문으로 전환
