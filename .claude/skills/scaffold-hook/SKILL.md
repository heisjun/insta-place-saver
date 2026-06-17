---
name: scaffold-hook
description: 새 커스텀 훅의 카테고리(query/mutation/state)를 판단해 골격과 vitest 테스트를 생성한다. 사용자가 "use<X> 훅 만들어줘"라고 요청하거나 dev-cycle의 1단계로 호출될 때 사용한다.
---

# scaffold-hook — 훅 골격 생성

## 목적

훅 이름·용도 힌트로부터 **카테고리·QueryClient 설정 필요 여부·테스트 패턴**을 판단해 일관된 골격을 만든다.

## 입력

| 키 | 필수 | 설명 |
|---|---|---|
| `name` | ✅ | camelCase, `use`로 시작 (예: `useMemoDraft`) |
| `purposeHint` | ❌ | "장소 메모 임시 저장", "이미지 미리 불러오기" 등 |
| `endpoint` | ❌ | API 경로 (`/api/places` 등) — query/mutation 판단 보조 |

## 판단 기준

### 1. 카테고리 판단 트리

```
훅 이름·힌트에 동사가 있는가?
├─ get / fetch / list / find → query
├─ save / update / delete / create / send → mutation
└─ 동사 없음 / on / handle / state → state-logic

endpoint가 명시되어 있는가?
├─ method: GET → query
├─ method: POST/PUT/DELETE → mutation
└─ 없음 → 위 규칙
```

### 2. 도메인 위치

- 카카오맵 관련 → `src/hooks/useKakao<X>.ts` (네이밍만)
- 그 외 → `src/hooks/<name>.ts`
- 페이지 전용이면 `src/app/<route>/_hooks/<name>.ts`

### 3. 테스트 패턴 판단

| 카테고리 | 테스트 패턴 |
|---|---|
| query | `QueryClient` wrapper + `fetch` mock + `waitFor`로 `data` 검증 |
| mutation | `QueryClient` wrapper + `mutate()` 호출 후 invalidate/cache 확인 |
| state-logic | `renderHook` + `act`로 상태 전환만 검증 (외부 의존성 없음) |

### 4. 부수 조건

- query 카테고리는 자동으로 `staleTime`, `gcTime` 기본값 코멘트로 표시
- mutation 카테고리는 `onSuccess`에서 `queryClient.invalidateQueries({ queryKey: [...] })` 자리 표시
- 모든 훅 파일은 `"use client"` 헤더 포함 (React Query 훅은 클라이언트 전용)

## 출력

### 생성 파일

```
<path>/<name>.ts
<path>/<name>.test.ts
```

### 훅 템플릿 — query

```ts
"use client";

import { useQuery } from "@tanstack/react-query";

export function <name>(/* params */) {
  return useQuery({
    queryKey: ["<key>"],
    queryFn: async () => {
      const res = await fetch("<endpoint>");
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
```

### 훅 템플릿 — mutation

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function <name>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => {
      const res = await fetch("<endpoint>", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("요청 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["<key>"] });
    },
  });
}
```

### 훅 템플릿 — state-logic

```ts
"use client";

import { useState, useCallback } from "react";

export function <name>() {
  const [value, setValue] = useState(/* 초기값 */);
  const reset = useCallback(() => setValue(/* 초기값 */), []);
  return { value, setValue, reset };
}
```

### 테스트 템플릿 — query/mutation

```ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { <name> } from "./<name>";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("<name>", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
  });

  it("성공 응답을 반환한다", async () => {
    const { result } = renderHook(() => <name>(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### 응답 메시지

```
✅ scaffold-hook 완료
- 카테고리 판단: query / mutation / state-logic (근거 한 줄)
- 위치: <path>/<name>.ts
- 테스트 패턴: <pattern>
```

## 거부 조건

- 이름이 `use`로 시작하지 않음
- 같은 이름의 훅이 이미 존재
- endpoint가 외부 URL (보안상 차단)
