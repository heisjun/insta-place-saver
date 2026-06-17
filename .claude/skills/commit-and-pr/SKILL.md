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

### 5. PR 본문 구성 — *의사결정 맥락 4섹션 의무*

PR 본문은 단순 변경 목록이 아니라 *왜 이 작업을 했고, 왜 이 방식으로 했는지*가 PR 하나만 읽어도 파악되도록 작성한다. `.github/pull_request_template.md`의 섹션 위에 다음 4개를 *반드시* 포함한다.

#### 5-1. 배경 (Why)
- 관찰된 문제·현상 (구체적 증상, 가능하면 로그·에러 스니펫)
- 근본 원인 (코드·인프라·외부 시스템 어디서 비롯됐는지)
- 왜 *지금* 해결해야 하는지 (사용자 영향, 비용, 릴리즈 일정 등)

#### 5-2. 대안 비교
- 고려한 옵션 **최소 3개** 표 형식으로
- 각 옵션의 장점·단점·비용을 같은 축으로 비교
- 옵션 명은 짧고 식별 가능하게 (A/B/C 또는 도구명)

#### 5-3. 선택한 방안과 이유
- 어떤 옵션을 골랐는지 + *왜* 그것이 *현재 상황*에 맞는지
- 단순 "best practice라서"가 아닌 *프로젝트 상황 의존적인 근거* (예: 포폴 단계, 무료 플랜, 트래픽 규모, 팀 크기)

#### 5-4. 받아들이는 트레이드오프
- 이 선택으로 *못 하게 되는 것*, *나중에 다시 봐야 할 것*
- 한계가 정말 없으면 "한계 없음"으로 명시 (자명하다는 신호)

#### 5-5. 변경 사항 (기존 그대로)
- 3~7개 bullet, 파일별이 아닌 *기능 단위*로 묶음
- 위 1~4섹션이 *왜·무엇을*을 설명했으니 여기는 *어디를*만 간결하게

#### 5-6. 배포 전 필수 작업
- 사용자가 머지 후 *수동으로* 해야 하는 것 (SQL 실행, 환경변수 추가, 콘솔 설정 등)
- 빠뜨리면 무슨 일이 생기는지 *결과*까지 명시

#### 5-7. 체크리스트
- 템플릿의 체크박스는 *상태를 알 수 있을 때만* 체크. 모르면 빈칸 유지.

### 6. PR 본문 작성의 메타 규칙

- **트레이드오프가 정말 없는 자명한 변경**(오타 수정, 주석 추가)은 5-2/5-3/5-4를 생략 가능. 단, *생략한다는 사실*을 PR 본문 하단에 한 줄로 명시.
- **대안 비교 표를 채울 수 없으면 작성 중단**. 자료가 없거나 의사결정 근거가 약하다는 신호 → 사용자에게 "이 작업의 다른 옵션을 검토하지 못했습니다. 추가 정보 주세요" 라고 보고.
- **사용자에게 보이는 변화가 없는 PR**(리팩토링·테스트만)도 *왜 지금 리팩토링하는지*를 5-1에 적는다.

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
