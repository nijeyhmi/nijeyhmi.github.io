# 개인 블로그 'HYELOG'

## 🔧 프로젝트 개요

- **프로젝트 이름**: 개인 개발 블로그
- **기술 스택**: Astro 4, React 18, Tailwind CSS, Notion API, GitHub Pages
- **목적**: 개발 관련 글을 Notion API를 통해 불러와 GitHub Pages를 통해 배포하는 블로그

---

## ✅ 주요 기능

### 1. Notion 글 수집 및 렌더링

- `scripts/fetch-notion.js`가 Notion DB의 모든 글을 가져와 `src/generated/posts.json`을 만듭니다(`npm run build` 전에 `prebuild`로 자동 실행).
  - DB 전체 페이지네이션, 레이트리밋(429) 재시도
  - Notion에 업로드한 이미지/파일은 만료되는 URL이므로 `public/notion-images/`로 내려받아 함께 배포
- 상세 페이지는 Astro Markdown 파이프라인으로 렌더링합니다: 표·체크박스(GFM), 토글(`<details>`), 콜아웃, 코드 하이라이트(Shiki)
- 생성물(`src/generated/`, `public/notion-images/`)은 git에 커밋하지 않습니다.

### 2. 글 목록

- 최신순 목록, 페이지네이션(10개씩), 태그 필터, 추천 글(`isRecommended`)
- 태그/페이지 상태는 URL 쿼리(`?tag=React&page=2`)에 반영됩니다.

### 3. 배포

- GitHub Actions(`.github/workflows/deploy.yml`) → `gh-pages` 브랜치
- 실행 조건: `main` push, 매일 03:00 KST(cron), Actions 탭의 수동 실행(`workflow_dispatch`)

---

## 🛠️ 로컬 개발

```bash
# .env 에 NOTION_TOKEN, NOTION_DATABASE_ID 설정
npm ci
npm run fetch:notion   # Notion → src/generated/posts.json (최초 1회, 글을 고친 뒤 다시 실행)
npm run dev
npm run build          # prebuild(fetch:notion) + astro build
npm run preview
```

## Notion DB 속성

| 속성 | 타입 | 용도 |
|---|---|---|
| `title` | 제목 | 글 제목 |
| `summary` | 텍스트 | 목록 요약 |
| `created` | 날짜 | 작성일, 정렬 기준 |
| `tags` | 다중 선택 | 태그 |
| `isRecommended` | 체크박스 | 사이드바 추천 글 |

DB의 모든 글이 공개됩니다(게시 상태 필터 없음).

---

## 🔍 향후 확장 기능

1. 댓글
2. 검색
3. 다크 모드
