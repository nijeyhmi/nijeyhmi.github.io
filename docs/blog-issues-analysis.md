# 블로그 문제 분석 보고서

- 분석일: 2026-11-22
- 대상: `nijeyhmi.github.io` (main @ `3796f00`), 라이브 사이트 https://nijeyhmi.github.io
- 범위: 분석만 했습니다. 프로젝트 파일은 수정하지 않았습니다.
- 검증 방법: 소스 정적 분석, 라이브 사이트 HTTP 확인, 헤드리스 Chrome(CDP)으로 레이아웃 측정과 콘솔/네트워크 오류 수집, `.env` 토큰을 사용한 **읽기 전용** Notion API 조회(DB 스키마와 블록 타입 집계). 토큰 값은 출력하거나 기록하지 않았습니다.

---

## 1. 개요

### 기술 스택
| 항목 | 내용 |
|---|---|
| 프레임워크 | Astro 4.16.18 (정적 출력, `output` 기본값 `static`) + React 18 (`@astrojs/react`) |
| 스타일 | Tailwind CSS 3.4 (`@astrojs/tailwind`, base styles 자동 주입) + `@tailwindcss/typography` |
| Notion | `@notionhq/client` 2.3.0, `notion-to-md` 3.1.8 |
| Markdown 렌더 | `react-markdown` 10.1.0 (remark/rehype 플러그인 없음) |
| 배포 | GitHub Actions `.github/workflows/deploy.yml` → `npm run build` → `peaceiris/actions-gh-pages@v4`로 `gh-pages` 브랜치에 `./dist` 푸시 |
| 비밀값 | 로컬: `.env`에 `NOTION_TOKEN`, `NOTION_DATABASE_ID` 둘 다 있음(`.gitignore` 대상, git 이력에도 없음). CI: `secrets.NOTION_TOKEN`, `secrets.NOTION_DATABASE_ID`를 env로 주입(`deploy.yml:12-14`) |

### 데이터 흐름 (현재 구조)
경로가 두 개로 나뉘어 있고, 서로 다른 시점의 데이터를 씁니다. 이 분리가 핵심 문제입니다.

1. **목록, 태그, 추천글(클라이언트 측)**
   `scripts/generatePosts.js`를 개발자가 **로컬에서 수동 실행**(`npm run generate:posts`)하면 `public/posts-page-N.json`, `posts-meta.json`, `recommended.json`, `tags.json`, `tags/<tag>.json`이 생성되고, 이 파일들을 **git에 커밋**합니다(커밋 `3796f00`).
   브라우저에서는 `Container.jsx`(`client:load`)가 `fetch("/posts-page-1.json")` 같은 요청으로 이 파일들을 불러옵니다.
2. **상세 페이지(빌드 시 SSG)**
   `astro build` 단계에서 `src/pages/posts/[id].astro`의 `getStaticPaths()`가 `src/lib/notion.js`를 통해 **Notion API를 직접 호출**합니다. `notion-to-md`로 Markdown을 만든 뒤, `PostDetail.jsx`가 `react-markdown`으로 정적 HTML을 렌더합니다.

`npm run build`(=`astro build`)는 `generatePosts.js`를 실행하지 않습니다. 그래서 목록 JSON은 마지막 수동 실행 시점에 멈춰 있고, 상세 페이지는 빌드 시점의 Notion 데이터를 씁니다.

### 현재 실제 상태 (측정값)
- Notion DB의 페이지 수: **18개**. 커밋된 JSON의 글 수: **16개**(`public/posts-meta.json`). 2025-05-29, 2025-06-26에 작성된 글 2개가 목록에 없습니다.
- 라이브 사이트의 상세 페이지: 목록 16개 중 **10개만 존재하고 6개는 404**입니다.
- 라이브 상세 페이지의 Notion 이미지: 전부 서명 URL(`X-Amz-Expires=3600`, 서명 시각 2025-05-07)이며, 현재 요청하면 **403**을 반환합니다.
- 라이브 사이트 마지막 수정 시각: 2025-05-07 12:52 UTC. 그 뒤로 재배포가 없었습니다.

---

## 2. 문제 목록

### ISSUE-01. 상세 페이지가 처음 10개 글만 생성되고 나머지는 404
- **심각도**: 높음
- **증상**: 목록 2페이지의 글(예: "리액트 앱을 다시 빠르게 만드는 법", "Vue 프로젝트에 Vite 도입하기" 등 6개)을 클릭하면 GitHub Pages 404가 뜹니다.
- **근본 원인**: `getStaticPaths`가 `getPosts()`를 인자 없이 호출합니다. 이때 기본값이 `pageSize = 10`이고 커서 순회를 하지 않기 때문에 첫 10개만 경로로 생성됩니다.
  - `src/pages/posts/[id].astro:7-13`
    ```js
    export async function getStaticPaths() {
      const {posts} = await getPosts();   // pageSize 기본 10, has_more 무시
      return posts.map((post) => ({ params: { id: post.id } }));
    }
    ```
  - `src/lib/notion.js:9-12` (`pageSize = 10` 기본값), `:45-49` (`hasMor` 오타로 반환하지만 호출부에서 사용하지 않음)
- **재현/확인**: `curl -o /dev/null -w '%{http_code}' https://nijeyhmi.github.io/posts/1de296c3-3d92-80ca-8eb7-e876150fdd27/` 요청 시 `404`. 16개 ID를 모두 확인한 결과 앞 10개는 200, 뒤 6개는 404였습니다.
- **영향 범위**: 11번째 이후 모든 글. 글이 늘어날수록 404가 늘어납니다. Notion DB가 100개를 넘으면 페이지네이션 없이 조회하는 다른 함수도 같은 문제를 겪습니다(ISSUE-14 참고).
- 힌트: `has_more`/`next_cursor`로 끝까지 순회해야 합니다.

### ISSUE-02. 상세 페이지에서 Footer가 본문 중간에 겹쳐 표시됨
- **심각도**: 높음
- **증상**: 글 상세 페이지에서 Footer가 첫 화면 높이 바로 아래(본문 중간)에 나타납니다. Footer의 흰 배경(`bg-white`)이 본문 일부를 가리고, 실제 문서 끝에는 Footer가 없습니다.
- **근본 원인**: `html, body { height: 100% }` 다음에 `h-full`이 연쇄되어 Footer 바로 앞 박스의 높이가 **뷰포트 높이로 고정**됩니다. 본문은 그 박스 밖으로 overflow됩니다. Footer는 일반 흐름상 overflow된 내용이 아니라 박스 높이 뒤에 배치되므로 화면 중간에 놓입니다.
  - `src/layouts/Layout.astro:27-33` — `html, body { height: 100%; }`
  - `src/layouts/Layout.astro:18-22` — 래퍼 두 개가 `h-full`이고, 그 안에 `<slot/>` 다음으로 `<Footer/>`가 옵니다.
    ```astro
    <div class="max-w-full w-full h-full m-auto">
      <div class="max-w-full w-full h-full mx-auto">
        <slot/>
        <Footer/>
    ```
  - `src/components/PostDetail.jsx:4-5` — PostDetail 루트 두 단계도 `h-full`(=부모 100% = 뷰포트 높이)
  - `src/components/PostDetail.jsx:7` — 안쪽은 `min-h-[100vh]`이고 본문은 이 값을 넘어 overflow됩니다.
- **측정값 (CDP, 1440×900)**:
  | 페이지 | 문서 높이 | Footer top | Footer 직전 요소 박스 높이 / scrollHeight |
  |---|---|---|---|
  | 긴 글 (Toss Simplicity24 리뷰) | 5985px | **960px** | 900 / 5925 |
  | 짧은 글 (리액트의 메모이제이션) | 1019px | 960px | 900 / 900 |
  | 홈 (hydrate 후) | 2279px | 2220px (정상) | — |
- **홈에서는 정상인 이유**: `index.astro`의 `<Container client:load/>`는 `astro-island`(`display: contents`)로 감싸지고, Container 루트에 `h-full`이 없습니다. 그래서 래퍼 높이는 900px로 고정되지만 Footer는 실제 내용 뒤에 배치됩니다. 다만 래퍼 자체(`wrapperH=900`)도 내용과 상관없이 뷰포트 높이로 고정되어 있어, 같은 패턴이 다른 페이지에서 언제든 재발할 수 있습니다.
- **부수 현상**: 홈은 SSR 시점에 `posts=[]`인 빈 목록입니다. JS가 실행되기 전에는 Footer가 915px 근처(`min-h-[95vh]` 바로 아래)에 있다가, fetch가 끝나면 아래로 밀려납니다(레이아웃 이동, CLS).
- **재현/확인**: 아무 상세 페이지에서 스크롤하면 첫 화면 바로 아래에 "© 2025 nijeyhmi's Blog" 줄이 본문 위에 겹쳐 보입니다.
- **영향 범위**: 모든 상세 페이지. Layout을 쓰면서 `h-full`을 가진 컴포넌트가 들어가는 모든 페이지.
- 힌트: 고정 높이(`height:100%`/`h-full`) 대신 sticky footer 패턴(`min-h-screen` + flex column)을 써야 합니다.

### ISSUE-03. 목록/태그/추천글 데이터가 빌드 파이프라인에 연결되지 않아 오래된 상태로 남음
- **심각도**: 높음
- **증상**: Notion에 새 글을 써도 목록에 나타나지 않습니다. 현재 Notion에는 18개 글이 있지만 목록에는 16개만 보입니다("채널데브톡" 2025-06-26, "모닥불 EP.12 …" 2025-05-29가 누락).
- **근본 원인**:
  - `package.json` scripts: `"build": "astro build"`만 있고 `generate:posts`는 별도의 수동 스크립트입니다(`package.json:4-10`).
  - `.github/workflows/deploy.yml:28-29`에서는 `npm run build`만 실행합니다. CI에서 JSON을 다시 생성하지 않고, 커밋된 `public/*.json`을 그대로 배포합니다.
  - 커밋 `3796f00`("블로그 build 파일 추가")에서 생성물(`public/posts-*.json`, `public/tags/*.json`)을 소스 저장소에 커밋했습니다.
  - 목록(JSON, 수동 생성 시점)과 상세 페이지(빌드 시점 Notion)의 데이터 시점이 서로 다릅니다. 그래서 목록에는 있는데 상세 페이지가 없거나, 그 반대인 경우가 생깁니다. ISSUE-01과 겹치면 새 글이 생기는 순간 "상위 10개" 집합이 바뀌어 기존 글의 상세 페이지도 사라질 수 있습니다.
- **재현/확인**: Notion DB를 조회하면 18건, `public/posts-meta.json`은 `{"total": 16}`입니다.
- **영향 범위**: 목록, 페이지네이션 total, 태그 목록과 태그별 글, 추천글 전부.
- 힌트: JSON 생성을 `build` 단계에 넣고, 생성물은 git에서 제외하는 방향입니다.

### ISSUE-04. 재배포 트리거가 없어 Notion 변경이 사이트에 반영되지 않음
- **심각도**: 중간
- **증상**: 2025-05-07 이후 Notion에 글이 추가되었지만 사이트는 그대로입니다(라이브 `last-modified: Wed, 07 May 2025 12:52:16 GMT`).
- **근본 원인**: `.github/workflows/deploy.yml:3-6` — `on: push: branches: [main]`만 있습니다. `schedule`(cron), `workflow_dispatch`, `repository_dispatch` 트리거가 없습니다. 정적 사이트이므로 Notion을 수정해도 코드를 push하지 않으면 재빌드되지 않습니다.
- **영향 범위**: 콘텐츠 갱신 전반. ISSUE-05(이미지 만료)와 겹치면 문제가 더 커집니다.

### ISSUE-05. Notion 이미지가 1시간 뒤 만료되는 서명 URL로 박제되어 모두 깨짐
- **심각도**: 높음
- **증상**: 상세 페이지의 이미지가 전부 깨지고 alt 텍스트 "image.png"만 보입니다(스크린샷으로 확인).
- **근본 원인**: Notion에 업로드된 이미지(`image.type === "file"`)의 URL은 `prod-files-secure.s3...` 형태의 서명 URL이며 `X-Amz-Expires=3600`입니다. `notion-to-md`가 이 URL을 그대로 Markdown에 넣고(`src/lib/notion.js:59-60`), 빌드 시점의 정적 HTML에 고정됩니다.
- **재현/확인**: 라이브 "Toss Simplicity24 리뷰" 페이지의 이미지 URL은 `X-Amz-Date=20250507T125035Z`, `X-Amz-Expires=3600`이며, 현재 요청하면 **HTTP 403**입니다.
- **영향 범위**: 이미지가 있는 글 9개 이상(Notion 조회 기준 `image:file` 블록을 가진 글: Lexical Editor, Toss Simplicity24 리뷰(9장), Storybook 적용 관련 에러, 코드 리뷰에 대한 고찰, 개발 문화에 대한 고찰, 리액트 DnD, 디자인 시스템 등). 배포 후 약 1시간이 지나면 항상 깨집니다.
- 힌트: 빌드 시 이미지를 다운로드해 정적 자산으로 포함하는 방식입니다.

### ISSUE-06. Notion → Markdown → HTML 변환 품질 문제 (미지원/깨지는 블록)
- **심각도**: 높음
- **근본 원인**: `notion-to-md`는 GFM 문법(표, 체크박스)과 raw HTML(`<details>` 등)을 출력합니다. 그런데 `PostDetail.jsx`의 `ReactMarkdown`에는 플러그인이 하나도 없습니다(`src/components/PostDetail.jsx:1,18`).
  ```jsx
  <ReactMarkdown>{content.mdContent}</ReactMarkdown>   // remarkGfm, rehypeRaw, 하이라이터 모두 없음
  ```
  `package.json`에도 `remark-gfm`, `rehype-raw`, 코드 하이라이터 의존성이 없습니다.
- **블록별 확인 결과** (Notion 블록 집계 + 라이브 HTML 검사):
  | Notion 블록 | 결과 | 확인 위치 |
  |---|---|---|
  | `table` (디자인 시스템 글, 표 3개) | `<table>`이 아니라 `\| Material \|`, `\| --- \|` 같은 파이프 텍스트가 그대로 노출 | `/posts/1de296c3-3d92-806c-af63-c158221fed1a/` |
  | `to_do` (디자인 시스템, 8개) | 체크박스가 아니라 `[x] 브랜딩과…` 텍스트로 노출 | 같은 글 |
  | `toggle` (코드 리뷰에 대한 고찰) | `<details><summary>` HTML이 이스케이프되어 `&lt;details&gt;` 문자열로 노출 | `/posts/1de296c3-3d92-800f-9ecf-f61f54902b7e/` |
  | `bookmark` (9개 글, 30개 이상) | 링크 텍스트가 전부 "bookmark"로 표시됨(`[bookmark](url)`). 제목/미리보기 없음 | 개발 문화에 대한 고찰 등 |
  | `code` | `<pre><code class="language-javascript">`까지는 나오지만 **구문 하이라이트 없음**(README의 "코드 블럭 하이라이트" 기능 미구현) | Lexical Editor 등 |
  | rich text `color` annotation | 색상 손실 (Markdown으로 표현 불가) | Lexical Editor |
  | `callout` | 아이콘/배경 없이 blockquote로 표현됨(추정, n2m 기본 동작) | 개발 문화, 재사용성의 6가지 기준 |
  | 문단 안의 `<Component>` 같은 텍스트 | raw HTML로 해석되어 사라질 가능성 있음(추정, "Function components cannot be…" 글은 현재 404라 라이브 확인 불가) | — |
  | 중첩 리스트 | n2m 들여쓰기로 표현되며 대체로 정상(스크린샷 기준). 단, 리스트 자식 문단이 리스트 밖으로 빠지는 경우가 보임(추정) | Toss 리뷰 |
- **재현/확인**: 위 URL들을 열어 보면 됩니다. 표는 `|`로 시작하는 텍스트 줄로 확인됩니다.
- **영향 범위**: 표, 토글, 북마크, 체크박스, 코드가 있는 대부분의 글.

### ISSUE-07. 상세 페이지 날짜가 목록 날짜와 다름 (잘못된 날짜 소스)
- **심각도**: 중간
- **증상**: 목록에서는 "Toss Simplicity24 리뷰"가 `2024-11-14`인데, 상세 페이지에서는 `2025. 04. 23.`(Notion 페이지를 DB로 옮긴 날짜)로 표시됩니다.
- **근본 원인**:
  - 목록: `scripts/generatePosts.js:36`이 `page.properties.created.date.start`를 ISO 문자열로 그대로 씁니다.
  - 상세: `src/lib/notion.js:64-70`이 속성이 아니라 `page.created_time`(시스템 생성 시각)을 `toLocaleDateString("ko-KR")`로 포맷합니다.
  - 형식도 서로 다릅니다(`2024-11-14` 대 `2025. 04. 23.`). 또 CI(UTC 환경)에서 `toLocaleDateString`이 시간대를 지정하지 않아, `created_time`(UTC 기준) 날짜가 KST 기준과 하루 어긋날 수 있습니다(추정).
- **확인**: Notion 조회 결과 다수 글이 `created`(2022~2024)와 `created_time`(2025-04-21~05-03)이 서로 다릅니다.
- **영향 범위**: 모든 상세 페이지의 날짜.

### ISSUE-08. 한글 태그 필터 시 404 + 처리되지 않은 예외, 태그 파일명 대소문자 불일치
- **심각도**: 높음
- **증상**: "리뷰", "번역" 태그를 클릭하면 콘솔에 `GET /tags/.json 404`와 처리되지 않은 Promise 예외가 생깁니다. 첫 목록은 표시되지만, 태그 상태에서 페이지를 바꾸면 데이터가 갱신되지 않습니다.
- **근본 원인**: 태그 키를 만드는 규칙이 세 군데에서 서로 다릅니다.
  1. 생성 스크립트 `scripts/generatePosts.js:90` — `const safeTag = tag;` → 원래 대소문자 그대로 저장합니다(예: `React.json`). 직전 커밋에는 `encodeURIComponent(tag.toLowerCase())`였는데 `3796f00`에서 바뀌었습니다.
  2. 태그 클릭 `src/components/Container.jsx:78` — `encodeURIComponent(tag.toLowerCase())` → `react`, `%EB%A6%AC%EB%B7%B0`
  3. useEffect `src/components/Container.jsx:21` — `activeTag.toLowerCase().replace(/[^a-z0-9-_]/gi, "")` → **한글이 전부 제거되어 빈 문자열**이 되고 `/tags/.json`을 요청합니다.
  - 응답 상태를 확인하지 않고 `res.json()`을 호출하고(`Container.jsx:22-23`), `.catch`도 없어서 404 HTML을 파싱하다 예외가 납니다.
  - **대소문자 문제(잠재)**: 커밋된 파일은 `react.json`, `storybook.json`, `vue.json`처럼 소문자입니다. 현재 스크립트는 `React.json`을 쓰지만, Windows(대소문자 비구분 FS)에서 기존 소문자 파일을 덮어쓰면서 이름이 유지된 것으로 추정됩니다. Linux/CI에서 생성하면 `React.json`이 되고, 프론트는 `react.json`을 요청하므로 **영문 대문자 태그 전부 404**가 납니다. 라이브 확인 결과 `/tags/React.json`은 404, `/tags/react.json`은 200입니다.
- **재현/확인**: 홈 → Tag "리뷰" 클릭 → DevTools 콘솔/네트워크 확인(CDP 측정 결과 `HTTP 404 https://nijeyhmi.github.io/tags/.json` + `Runtime.exceptionThrown`).
- **영향 범위**: 한글 태그 2개(현재), 이후 재생성 시 대문자 태그 3개(Storybook, React, Vue).

### ISSUE-09. 태그 필터/페이지네이션 상태 관리 로직 결함 (중복 fetch, 경쟁 상태)
- **심각도**: 중간
- **근본 원인** (`src/components/Container.jsx`):
  - `selectTag`(`:64-89`)가 직접 fetch하고 state를 바꾸며, 같은 state 변경이 `useEffect([activeTag, page])`(`:19-41`)를 다시 실행시켜 **같은 데이터를 두 번 요청**합니다. 응답 순서에 따라 결과가 덮어써질 수 있습니다(경쟁 상태, 요청 취소/무시 처리 없음).
  - `selectTag`의 태그 선택 분기에서는 `setPosts(data)`로 **페이지 분할 전 전체 목록**을 넣습니다(`:83`). 그 뒤 effect가 10개로 자릅니다. effect가 실패하면(ISSUE-08) 전체 목록이 그대로 남습니다.
  - 태그 해제 분기(`:65-76`)도 effect와 똑같이 `posts-page-1.json`과 `posts-meta.json`을 중복 요청합니다.
  - `posts-meta.json`은 마운트 시점에도 두 effect(`:37-39`, `:43-49`)에서 중복으로 요청됩니다.
  - `pageSize`가 effect보다 아래(`:51`)에 선언되어 있습니다. 클로저 실행 시점 덕분에 지금은 동작하지만 읽기 어렵고 깨지기 쉽습니다.
  - 모든 fetch에 `res.ok` 확인, `.catch`, 로딩/에러 UI가 없습니다(`Container.jsx`, `Sidebar.jsx:7-11`).
  - 페이지/태그 상태가 URL(쿼리스트링)에 반영되지 않아, 새로고침하거나 뒤로가기를 하면 항상 1페이지/전체로 돌아갑니다. 공유 링크도 만들 수 없습니다.
- **영향 범위**: 홈 목록 UX와 네트워크 낭비.

### ISSUE-10. 페이지네이션 현재 페이지 강조 로직 오류 (잠재 버그)
- **심각도**: 낮음 (현재 2페이지뿐이라 드러나지 않음)
- **근본 원인**: `src/components/Pagination.jsx:20` — `idx + 1 === page`로 비교합니다. 그룹 내 인덱스와 실제 페이지 번호를 비교하므로, 6페이지 이상(두 번째 그룹)에서는 강조가 사라지거나 엉뚱한 위치에 표시됩니다. `pageNum === page`가 맞습니다.
  - 그 밖에: `Container.jsx:56`의 `Math.ceil(total / pageSize || 1)`은 연산자 우선순위 때문에 의도와 다를 수 있습니다(total이 0이면 1이 되어 결과적으로는 동작함). 이전/다음 버튼에 `aria-label`이 없고 `aria-current`도 없습니다.
- **영향 범위**: 글이 51개 이상일 때.

### ISSUE-11. 모바일/좁은 화면에서 레이아웃이 깨지고 왼쪽이 잘림
- **심각도**: 중간
- **증상**: 390px 너비 스크린샷에서 글 제목 왼쪽이 잘리고("exical Editor", "oss Simplicity24") 사이드바가 오른쪽으로 넘칩니다. 잘린 왼쪽으로는 스크롤할 수 없습니다.
- **근본 원인**:
  - 고정 폭: `Container.jsx:93` `w-[1200px]`, `Sidebar.jsx:17,33,54` `w-[300px]`, `PostDetail.jsx:7` `w-[1050px]`. 반응형 breakpoint(`md:` 등)가 하나도 없습니다.
  - `Container.jsx:92`의 `flex … justify-center` 부모 안에서 자식이 부모보다 넓으면 **양쪽으로 overflow**되고, 왼쪽으로 넘친 부분은 스크롤할 수 없습니다(flex 중앙 정렬 + overflow의 알려진 동작).
  - `Layout.astro:11` viewport meta가 `width=device-width`만 있고 `initial-scale=1`이 없습니다(경미).
- **확인**: CDP에서 390px 모바일 에뮬레이션 시 실제 레이아웃 뷰포트가 473px로 늘어나고, 스크린샷에서 왼쪽이 잘립니다.
- **영향 범위**: 모바일 사용자 전체, 데스크톱 1250px 미만 창.

### ISSUE-12. Notion API 오류 처리 방식 때문에 빌드가 엉뚱한 곳에서 실패하거나 빈 페이지가 생성될 수 있음
- **심각도**: 중간
- **근본 원인**:
  - `src/lib/notion.js:50-53` — `getPosts` 실패 시 `[]`를 반환합니다. 그런데 정상일 때는 `{posts,…}` 객체를 반환하므로, `[id].astro:8`의 `const {posts} = …`가 `undefined`가 되고 `posts.map`에서 TypeError가 납니다. 원인(토큰/DB ID 오류, 레이트리밋)이 가려집니다.
  - `src/lib/notion.js:81-84` — `getPostDetail` 실패 시 `{}`를 반환하고, `PostDetail.jsx:12`의 `content.tags.map`에서 TypeError가 납니다.
  - 빌드 중 글마다 `pages.retrieve` + `n2m.pageToMarkdown`(블록 재귀 조회)을 호출하므로 요청 수가 많습니다. 이번 분석 중 읽기 전용 조회만으로도 **`rate_limited`(429)**가 발생했습니다. 재시도나 동시성 제한 로직이 없습니다(`@notionhq/client` 기본 재시도에만 의존).
- **영향 범위**: CI 빌드 안정성. 글이 늘수록 위험이 커집니다.

### ISSUE-13. 게시 여부(Published/Status) 필터가 없음
- **심각도**: 중간
- **근본 원인**: Notion DB 속성은 `title`, `summary`, `created`, `tags`, `isRecommended`뿐이고 상태 속성이 없습니다. `generatePosts.js:19-29`와 `notion.js:14-24`도 필터 없이 조회합니다. 그래서 DB에 있는 모든 페이지(작성 중인 초안 포함)가 공개됩니다. 예를 들어 "채널데브톡"(summary 비어 있음)은 초안일 가능성이 있습니다(추정).
- **영향 범위**: 콘텐츠 공개 정책.

### ISSUE-14. 기타 Notion 데이터 처리의 잠재 문제
- **심각도**: 낮음
- **근본 원인**:
  - 제목/요약이 첫 rich_text 조각만 사용합니다: `title?.[0]?.plain_text`, `summary?.rich_text?.[0]?.plain_text` (`generatePosts.js:33,35`, `notion.js:28,30,62`). 제목 일부에 굵게/코드 서식이 섞이면 뒤쪽이 잘립니다. 현재는 모두 1조각이라 드러나지 않습니다.
  - 정렬 키 `created`가 같은 글이 많습니다(2024-01-30에 5개). 보조 정렬 키가 없어 순서가 일정하지 않을 수 있습니다.
  - `created` 속성이 비어 있는 글은 정렬 시 맨 뒤로 가고 날짜는 `null`로 표시됩니다(잠재).
  - slug가 Notion 페이지 UUID(`/posts/1de296c3-…`)라 URL이 읽기 어렵고 SEO에 불리합니다. 페이지를 다른 DB로 옮기면 ID가 바뀌어 링크가 깨집니다(실제로 ID 접두사가 `1dc…`, `1de…`, `1e8…`로 섞여 있어 이관 흔적이 보임).
  - `getRecommendedPosts`, `getCursorForPage`(`notion.js:87-150`)는 어디서도 쓰이지 않는 데드 코드입니다. `hasMor` 오타(`notion.js:47`)도 있습니다.
  - `generatePosts.js:85-87` — `tags` 디렉터리를 비우지 않아, Notion에서 태그를 삭제하거나 이름을 바꿔도 옛 JSON 파일이 남습니다. `posts-page-N.json`도 글 수가 줄면 남은 파일이 정리되지 않습니다.
  - `generatePosts.js:90` — 태그명을 파일명에 그대로 씁니다. 태그에 `/`, `?`, `:` 같은 문자가 들어가면 경로 오류나 Windows 금지 문자 문제가 생깁니다.

### ISSUE-15. Header의 sticky에 z-index가 없어 스크롤 시 요소가 헤더 위로 올라옴
- **심각도**: 낮음 (추정, 육안 확인 필요)
- **근본 원인**: `src/components/Header.jsx:5`은 `sticky top-0 bg-white`이고 `z-index`가 없습니다. DOM상 뒤에 오는 positioned 요소(`Container.jsx:94` 배너 `relative overflow-hidden`, `Sidebar.jsx:35` `relative`)는 같은 stacking 순서에서 나중에 그려지므로, 스크롤하면 헤더 위를 덮습니다.
- **영향 범위**: 홈 스크롤 시 시각적 결함.

### ISSUE-16. 잘못되었거나 효과 없는 Tailwind 클래스, 스타일 코드 정리 필요
- **심각도**: 낮음
- **근본 원인**:
  - 존재하지 않는 유틸리티: `m-r-[24px]` (`Header.jsx:8`), `m-b-[60px]` (`Container.jsx:98`) → 적용되지 않습니다(`mr-`, `mb-`의 오기).
  - 충돌하는 패딩: `pl-[10px] pr-[8px] py-[4px] px-[10px]` (`Sidebar.jsx:43,79,82`).
  - `border-lg`(`Container.jsx:94`)는 존재하지 않는 클래스입니다.
  - `src/styles/global.css`는 어디서도 import하지 않습니다(`@astrojs/tailwind`가 base styles를 자동 주입하므로 사용되지 않는 파일).
  - `tailwind.config.js:9`이 ESM(`"type": "module"`) 파일인데 `require(...)`를 씁니다. Tailwind의 jiti 로더 덕분에 현재는 동작하지만 비표준입니다.
  - `Layout.astro`의 `<style>`은 scoped(`data-astro-cid`)라 의도와 다르게 동작할 여지가 있습니다(현재는 html/body에 cid가 붙어 적용됨).

### ISSUE-17. 메타/SEO/접근성 문제
- **심각도**: 낮음~중간
- **근본 원인**:
  - `Layout.astro:8` `<html lang="en">` — 콘텐츠가 한국어입니다.
  - `Layout.astro:12` `type="image/svg+xml"`로 지정했지만 실제 파일은 `favicon.png`(16×16 PNG)입니다(`640632d`에서 svg를 png로 바꾸면서 type은 그대로 둠).
  - `Layout.astro:14` — 모든 페이지 title이 `NHYELOG.DEV`로 고정입니다. 상세 페이지에서 글 제목을 title로 넘기지 않습니다. `meta description`, Open Graph, canonical, sitemap, RSS도 없습니다.
  - 홈 목록은 `client:load`에서만 렌더되어 정적 HTML에 글 목록이 없습니다(SSR 시 `posts=[]`). 크롤러/JS 미실행 환경에서는 빈 페이지이고, 초기 레이아웃 이동도 생깁니다.
  - 제목 계층: 목록의 각 글 제목이 `<h1>`(`PostList.jsx:22`)이고 헤더 로고가 `<h2>`(`Header.jsx:10`)입니다.
  - `alt=""`: 프로필 사진(`Sidebar.jsx:60`)은 의미 있는 이미지인데 대체 텍스트가 없습니다. 아이콘 링크(GitHub/LinkedIn, `Sidebar.jsx:65-73`)와 다크모드 버튼(`Header.jsx:15-17`)에는 접근 가능한 이름이 없습니다.
  - 리스트 key: `PostDetail.jsx:12-14` 태그 map에 `key`가 없습니다(React 경고). `PostList.jsx:13`, `Sidebar.jsx:36`는 index를 key로 씁니다.
  - 커스텀 404 페이지(`src/pages/404.astro`)가 없어 GitHub 기본 404가 노출되고 홈으로 돌아갈 방법이 없습니다.
- **참고**: 이 사이트는 SPA 라우팅이 아니라 `/posts/<id>/index.html` 정적 생성 방식이므로, "SPA 새로고침 시 404" 문제는 해당되지 않습니다. 404는 ISSUE-01 때문에 생깁니다. `base: '/'`도 사용자 사이트(`nijeyhmi.github.io`) 루트에 배포되므로 절대 경로 fetch(`/tags.json` 등)는 정상입니다.

### ISSUE-18. 미구현/동작하지 않는 UI 요소
- **심각도**: 낮음
- **근본 원인**:
  - 다크모드 아이콘(`Header.jsx:15-17`)에 클릭 핸들러가 없습니다.
  - 사이드바 "Portfolio", "TIL"(`Sidebar.jsx:78-85`)은 링크가 아닌 `<li>` 텍스트입니다. `src/components/Portfolio.jsx`는 어디서도 쓰이지 않는 데드 코드입니다.
  - 상세 페이지에 목록으로 돌아가는 링크, 이전/다음 글 링크가 없습니다(헤더 로고 링크만 있음).
  - README가 안내하는 기능(검색, 다크모드, 코드 하이라이트, `gh-pages` 라이브러리 사용)과 실제 구현이 다릅니다. `fuse.js`, `dotenv`(Astro 쪽)는 사용되지 않거나 스크립트에서만 씁니다.

### ISSUE-19. 성능: 대용량 정적 이미지
- **심각도**: 낮음~중간
- **근본 원인**: `public/banner.png` 2.9MB(130px 높이 배너), `public/portrait.png` 353KB(85px 프로필). 압축/리사이즈나 `astro:assets` 최적화를 하지 않았고, `width/height`, `loading="lazy"`가 없습니다(`Container.jsx:95`, `Sidebar.jsx:60`). 첫 화면 LCP에 직접 영향을 줍니다.

### ISSUE-20. CI/배포 설정 개선 필요 사항
- **심각도**: 낮음
- **근본 원인** (`.github/workflows/deploy.yml`):
  - `npm install`(`:26`) 사용 → lockfile과 다른 버전이 설치될 수 있습니다(`npm ci` 권장). 의존성 캐시도 없습니다.
  - `generate:posts` 단계가 없습니다(ISSUE-03).
  - 빌드 실패 시 원인 파악을 어렵게 하는 오류 삼킴 코드가 있습니다(ISSUE-12).
  - 과거 커밋 `c6ce982`("배포 에러 확인용 콘솔 추가")에서 `NOTION_TOKEN` 값을 `console.log`로 출력하는 코드가 있었습니다(`902e174`에서 제거됨). 그 시기의 Actions 로그에 **토큰이 노출되었을 가능성**이 있습니다(GitHub가 secret을 마스킹하므로 실제 노출 여부는 추정). 토큰 재발급을 검토해야 합니다.
  - Actions 실행 이력은 API 조회 결과 0건입니다(보존 기간 만료로 추정). 과거 빌드 성공/실패 여부는 확인할 수 없습니다.

---

## 3. 확인하지 못한 사항 / 추가 조사 필요

1. **로컬 `astro build` 미실행**: 빌드는 모든 글에 대해 Notion API를 호출하고, 분석 중 이미 레이트리밋(429)이 발생해서 실행하지 않았습니다. 대신 라이브 사이트(2025-05-07 빌드)로 결과를 검증했습니다. 현재 18개 글 기준으로 빌드할 때 상위 10개 집합이 바뀌는지(=기존 글 404 이동)는 실제 빌드로 확인해야 합니다.
2. **최근 2개 글("채널데브톡", "모닥불 EP.12")의 렌더링**: 블록 타입만 집계했습니다(bookmark 포함 확인). 실제 HTML 렌더 결과는 보지 않았습니다.
3. **"Function components cannot be…" 글**: 문단에 `<…>` 형태 텍스트가 있어 raw HTML로 해석되어 사라질 가능성이 있습니다. 라이브에서 404라 확인하지 못했습니다(추정).
4. **callout/quote/중첩 리스트의 정확한 시각적 결과**: 일부만 스크린샷으로 확인했습니다. 블록별 전수 시각 검증은 하지 않았습니다.
5. **ISSUE-15(헤더 z-index)**: 코드상 추론이며 스크롤 상태 스크린샷으로는 검증하지 않았습니다.
6. **GitHub Pages 소스 설정**: Pages API가 비인증 요청에 404를 반환해서, 배포 소스(gh-pages 브랜치 / Actions)를 직접 확인하지 못했습니다. 라이브 HTML이 `deploy.yml` 산출물과 일치하므로 gh-pages 브랜치 배포로 추정합니다. 로컬 `origin/gh-pages` ref는 오래된 상태(1f23eca)이고, 원격 최신은 `852f3b9`입니다(git fetch는 하지 않음).
7. **CI 환경 변수 전달**: `import.meta.env.NOTION_TOKEN`이 CI의 process env에서 정상적으로 읽히는지는 과거 라이브 빌드에 상세 페이지 10개가 생성된 것으로 간접 확인했습니다. 현재 secret이 유효한지(만료/폐기 여부)는 알 수 없습니다.
8. **Notion DB에 없는 속성 기반 기능**(Published 상태, slug 속성 등)은 Notion 쪽 스키마 변경이 필요할 수 있어 사용자 확인이 필요합니다.
