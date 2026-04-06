# Contributing Guide

## 브랜치 전략

```
main
└── feature/<step>-<short-description>   ← PR 단위
```

- `main`: 항상 배포 가능한 상태 유지. 직접 push 금지.
- 모든 작업은 feature 브랜치에서 진행 후 PR로 merge.

**브랜치 이름 예시**

```
feature/step-1-project-setup
feature/step-2-auth
feature/step-3-api
feature/step-4-add-page
feature/step-5-map
feature/step-6-places-list
feature/step-7-pwa
```

---

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/ko/) 형식을 따릅니다.

```
<type>(<scope>): <subject>

[body]

[footer]
```

### Type

| Type | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변화 없는 코드 개선 |
| `style` | 코드 포맷, UI 스타일 변경 |
| `docs` | 문서 추가/수정 |
| `chore` | 빌드 설정, 의존성, 환경 변수 등 |
| `test` | 테스트 추가/수정 |
| `ci` | CI/CD 설정 변경 |

### Scope (선택)

영향받는 영역: `auth`, `map`, `add`, `places`, `api`, `supabase`, `instagram`, `claude`, `kakao`, `pwa`

### 규칙

- subject는 **현재형 동사**로 시작, 끝에 마침표 없음
- 50자 이내 권장
- 한국어 사용 가능

### 예시

```
feat(auth): 카카오 소셜 로그인 구현

fix(instagram): doc_id 변경으로 인한 크롤링 실패 대응

chore: Supabase, TanStack Query 의존성 추가

feat(map): 카테고리별 마커 색상 구분 및 커스텀 오버레이 추가

refactor(api): extract 라우트 에러 핸들링 개선
```

---

## PR 컨벤션

### 제목 형식

```
[Step N] <type>: <설명>
```

예시:
```
[Step 1] chore: 프로젝트 초기 셋업 및 Supabase 연결
[Step 2] feat: 카카오/구글 소셜 로그인 구현
[Step 3] feat: 인스타그램 크롤링 및 AI 추출 API 구현
```

### PR 크기

- Step 하나 = PR 하나를 기준으로 함
- 단, Step이 크면 `feat`/`chore` 등으로 분리 가능

### 리뷰 및 머지

- PR 설명은 PR 템플릿을 사용
- `Squash and merge` 사용 (히스토리 클린)
