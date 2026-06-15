---
name: commit-and-pr
description: 변경 사항을 분석해 Conventional Commits 메시지와 PR 본문 초안을 생성한다. 자동 실행하지 않고 사용자 승인 후 commit/PR을 실행한다. 사용자가 "커밋해", "PR 올려"라고 하거나 self-review가 blocker 0으로 끝났을 때 사용한다.
---

# commit-and-pr — 커밋·PR 초안 생성

## 목적

변경 사항으로부터 **type·scope·subject 판단**과 **PR 본문 구성**을 자동화한다. 단, 어떤 명령도 자동 실행하지 않는다. 항상 초안 → 사용자 승인 → 실행 흐름을 유지한다.

## 입력

- 자동: `git status`, `git diff main...HEAD`, `git log main..HEAD`, 현재 브랜치명
- 옵션: 사용자가 명시한 type/scope (예: "fix로 해줘", "scope는 map") — 우선 적용

## 판단 기준

### 1. type 추론 트리

```
변경된 파일 분석 (우선순위 순)
├─ .md만 변경 → docs
├─ test/*, *.test.* 만 변경 → test
├─ package.json / eslint.config / tsconfig / vitest.config / .github/* → chore
├─ 새 파일에 새 export 함수/컴포넌트가 있음 → feat
├─ 기존 코드의 동작이 바뀌지 않고 구조만 변경 (이름 변경, 분리, 추출) → refactor
├─ 이전 커밋이나 diff에 "fix", "버그", "오류", "수정" 키워드가 있음 → fix
├─ CSS/Tailwind 클래스만 변경, 로직 변화 없음 → style
└─ 위 어디에도 안 맞음 → feat (가장 흔한 default)
```

### 2. scope 추론 트리

변경된 파일 경로에서 다음 키워드 매핑을 우선순위대로 적용한다.

| 경로 패턴 | scope |
|---|---|
| `src/app/api/auth/`, `src/app/login/` | `auth` |
| `src/app/api/instagram/`, `lib/instagram.ts` | `instagram` |
| `src/app/api/extract/`, `lib/claude.ts` | `extract` (※ 파일명은 claude지만 scope는 extract 권장) |
| `src/app/api/map/`, `src/components/map/` | `map` |
| `src/app/add/`, `src/components/place/UrlInput.tsx`, `src/components/place/ExtractResult.tsx` | `add` |
| `src/app/places/`, `src/app/api/places/` | `places` |
| `src/lib/supabase/`, `src/proxy.ts` | `supabase` |
| `public/manifest`, `public/sw`, `manifest.ts` | `pwa` |
| 여러 도메인이 섞임 / 매칭 없음 | scope 생략 |

### 3. subject 작성 규칙

- 현재형 한국어 동사로 시작 (`추가`, `수정`, `변경`, `리팩토링`, `개선`)
- 50자 이내 권장, 70자 hard limit
- 끝에 마침표 없음
- 변경의 *목적*을 한 줄로 (구현 디테일이 아닌)
- 예시 톤:
  - ❌ `useState를 useReducer로 바꾸고 컴포넌트 4개 수정`
  - ✅ `장소 추가 폼 상태 관리 유니온 타입으로 단순화`

### 4. PR 제목 형식

```
[Step <N>] <type>(<scope>): <subject>
```

- `<N>`은 브랜치명에서 추출. `feature/step-23-foo` → `23`
- 브랜치명이 step 패턴이 아니면 `[Step ?]` 대신 `[type(scope)]` 단독 사용

### 5. PR 본문 구성

`.github/pull_request_template.md`를 따르되, AI가 채울 수 있는 섹션은 다음 기준으로 작성한다.

- **개요**: subject보다 한 줄 더 자세히. 사용자에게 보이는 변화 중심.
- **변경 사항**: 3~7개 bullet. 파일별이 아닌 *기능 단위*로 묶음.
- **구현 메모**: 비자명한 결정(왜 이렇게 했는지)이 있을 때만 작성. 없으면 "특이사항 없음".
- **체크리스트**: 템플릿의 체크박스는 *상태를 알 수 있을 때만* 체크. 모르면 빈칸 유지.

## 출력

### Phase 1 — 초안 제시 (실행 X)

```markdown
## 커밋 메시지 초안

```
<type>(<scope>): <subject>

<선택적 body — 2~3줄 부연 설명>
```

## PR 제목 초안

[Step N] <type>(<scope>): <subject>

## PR 본문 초안

(PR 템플릿에 채워진 내용)

---

승인하면 다음을 실행합니다:
1. `git add <변경 파일 목록>`
2. `git commit -m "..."`
3. (필요 시) `git push -u origin <branch>`
4. `gh pr create --base main --head <branch> --title "..." --body "..."`

진행하려면 "응", "진행해", "ㅇㅋ" 등으로 답해주세요.
```

### Phase 2 — 사용자 승인 시에만 실행

- 한 번에 모든 명령을 실행하지 말고, `git add` → `git commit` → `git push` → `gh pr create` 순서로 *분리*해서 실행하고 각 단계의 결과를 사용자에게 보고한다.
- `git push --force` / `--no-verify` / `gh pr merge` 는 **절대 자동 실행하지 않는다**.
- 실패 시 사용자에게 보고하고 추가 입력을 기다린다.

## 판단의 메타 규칙

- 작업 사이클이 여러 커밋으로 나뉘었다면, *마지막 커밋부터 PR 시점까지의 누적 diff*를 기준으로 PR 본문을 작성한다.
- 사용자가 PR 본문을 직접 쓰는 게 더 좋은 경우(보안 변경, 인시던트 대응)에는 "민감 변경이 감지되어 본문을 채우지 않았습니다. 직접 작성해주세요."로 출력하고 멈춘다.
  - 감지 신호: 변경 파일에 `lib/supabase/`, `proxy.ts`, `.env*`, `migration.sql` 포함 + 추가/삭제 라인 합산 > 50

## 거부 조건

- 변경 사항이 없음 (`git diff --quiet`)
- 현재 브랜치가 `main` (직접 푸시 금지 정책)
- `.env.local`, 시크릿 의심 파일이 staged 영역에 있음 → 사용자에게 즉시 경고
