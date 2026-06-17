---
name: self-review
description: 현재 브랜치의 변경 사항을 코드 컨벤션·잠재 버그·접근성·불필요 리렌더링 4축으로 셀프 리뷰하고 우선순위가 정렬된 마크다운 리포트를 생성한다. 사용자가 "리뷰해줘", "검토해줘", "PR 올리기 전에 봐줘"라고 하거나 기능 구현이 끝난 신호가 보일 때 사용한다.
---

# self-review — 4축 셀프 리뷰

## 목적

이 스킬은 "어떻게 코드를 고치라"가 아니라 **"어떤 기준으로 코드를 보라"**를 명시한다. AI는 4축의 각 항목을 차례로 점검하고, 발견을 *심각도·근거·수정 제안*으로 구조화한다.

## 입력

- 자동: `git diff main...HEAD` — 현재 브랜치가 main에서 분기한 이후의 모든 변경
- 옵션: 사용자가 특정 파일 경로를 지정하면 그 파일만 검토
- 옵션: 사용자가 `--staged` 같은 힌트를 주면 `git diff --staged`만 검토

## 판단 기준 — 4축

각 축마다 **체크 항목 → 발견 시 심각도 매핑**으로 판단한다.

### 축 1. 코드 컨벤션

| 체크 항목 | 발견 시 심각도 |
|---|---|
| 클라이언트 훅·이벤트 사용 컴포넌트에 `"use client"` 누락 | **blocker** |
| 서버 컴포넌트에 `"use client"` 불필요하게 추가 | warn |
| 카테고리 enum이 `맛집\|카페\|디저트\|술집\|기타` 외 값을 사용 | **blocker** |
| `@/` alias 대신 상대경로(`../../`) 3단계 이상 사용 | warn |
| 한국어 주석에서 "WHAT"만 설명 (코드만 봐도 아는 내용) | info |
| 파일 위치가 도메인과 맞지 않음 (place/* 컴포넌트가 map/*에 위치) | warn |
| 컨벤션 위반 commit 메시지로 작성된 흔적 | warn |

### 축 2. 잠재 버그

| 체크 항목 | 발견 시 심각도 |
|---|---|
| `useEffect`/`useMemo`/`useCallback` 의존성 배열 누락·과잉 | **blocker** |
| async 함수에서 `await` 누락 또는 race condition 가능성 | **blocker** |
| API 응답 `.json()` 호출 전 `res.ok` 미검증 | warn |
| Supabase 쿼리에 `user_id` 조건 누락 (RLS 의존도가 너무 높음) | **blocker** |
| null/undefined가 들어올 수 있는 값에 옵셔널 체이닝 없음 | warn |
| catch 블록에서 에러 무시 (`catch {}`) | warn |
| `Array.map`에 key 없거나 `index` 사용 (재정렬 가능 리스트) | warn |
| Apify/Gemini 외부 호출에 타임아웃 미설정 | info |

### 축 3. 접근성 (a11y)

| 체크 항목 | 발견 시 심각도 |
|---|---|
| `<div onClick>` 같은 비-시맨틱 클릭 핸들러 (버튼이어야 함) | **blocker** |
| `<input>`에 연결된 `<label>` 또는 `aria-label` 없음 | **blocker** |
| 이미지 `<img>` / `<Image>`에 `alt` 누락 | warn |
| 카테고리 색상만으로 정보 전달 (텍스트/아이콘 동반 없음) | warn |
| 키보드 포커스가 불가능한 인터랙티브 요소 (`tabIndex={-1}` 등) | warn |
| 모달·드로어에 `role="dialog"` + 포커스 트랩 누락 | info |

### 축 4. 불필요 리렌더링

| 체크 항목 | 발견 시 심각도 |
|---|---|
| 큰 리스트(>20 row) 렌더 컴포넌트에 `React.memo` 누락 + props가 안정적임 | warn |
| 매 렌더마다 새 객체/배열 리터럴을 자식에 prop으로 전달 + 자식이 메모화 | warn |
| `useState` 초기값이 비싼 계산인데 lazy initializer (`() => ...`) 미사용 | info |
| Context value를 매번 새 객체로 만들어 전체 트리 리렌더 유발 | warn |
| Zustand store에서 `selector` 없이 전체 상태 구독 | info |
| TanStack Query `queryKey`가 매 렌더 새 배열 (참조 동등성 깨짐) | warn |

## 판단의 메타 규칙

- **근거 우선**: 모든 발견은 "변경된 줄 어디에서 발견했는가"를 line 단위로 인용한다. 추측만으로 항목을 만들지 않는다.
- **노이즈 컨트롤**: info 항목이 5개를 넘으면 상위 3개만 보고하고 "외 N건"으로 합친다.
- **거짓 양성 회피**: 컴포넌트가 페이지 외부에서 import되지 않으면 (`grep` 확인) "재사용" 관련 지적은 보류.
- **이 프로젝트 컨텍스트 반영**: `lib/claude.ts`는 의도적으로 Gemini를 사용 — 파일명 불일치 지적 금지. `proxy.ts`는 Next.js 16의 `middleware.ts` 대체 — 잘못된 위치 지적 금지.

## 출력 포맷

```markdown
# Self-Review 리포트 (브랜치: <branch>, base: main)

**변경 요약**: <N>개 파일, +<add>/-<del> 라인
**총 발견**: blocker <X> · warn <Y> · info <Z>

---

## 🔴 Blocker (먼저 해결 필요)

### 1. <한 줄 요약>
- **축**: 코드 컨벤션 / 잠재 버그 / a11y / 리렌더링
- **위치**: `src/components/.../Foo.tsx:42`
- **근거**: <왜 문제인지 한 문장>
- **수정 제안**:
  ```tsx
  // 변경 전 → 변경 후 짧은 스니펫
  ```

## 🟡 Warn

(동일 포맷)

## 🟢 Info

- <위치>: <한 줄>
- <위치>: <한 줄>

---

## 다음 단계 권장

- blocker 0개 → `commit-and-pr` 진행 가능
- blocker 1개 이상 → 위 항목 수정 후 재실행
```

## 종료 조건

리포트 마지막에 다음 한 줄을 반드시 출력한다.

```
SELF_REVIEW_RESULT: blocker=<N>, warn=<N>, info=<N>
```

이 줄을 `dev-cycle` 오케스트레이터가 파싱해서 다음 단계로 진행할지 결정한다.
