# 블로그 수정 제안서

- 작성일: 2026-11-22
- 기준: `main @ 3796f00`, 입력 문서 `docs/blog-issues-analysis.md` (ISSUE-01 ~ ISSUE-20)
- 성격: **제안만 담았습니다.** 프로젝트 파일 수정, 패키지 설치, 커밋, Notion API 호출은 하지 않았습니다. 승인을 받은 뒤 적용합니다.
- 확인한 것: 소스 전체, `package.json`, 설치된 `node_modules`의 실제 버전, `notion-to-md`와 `@astrojs/markdown-remark` 내부 구현, 관련 git 이력

---

## 0. 분석 문서 검증 결과

분석 문서의 주장을 소스와 대조했습니다. **대부분 정확합니다.** 줄 번호도 맞습니다. 다른 점과 새로 찾은 점은 아래와 같습니다.

| 항목 | 판정 | 내용 |
|---|---|---|
| ISSUE-01 ~ 03, 05, 07 ~ 12 | 일치 | 코드상 원인과 줄 번호 모두 일치합니다. |
| ISSUE-06 toggle | **보완 필요** | `rehype-raw`만 추가해서는 해결되지 않습니다. `notion-to-md`의 `toggle()`(`node_modules/notion-to-md/build/utils/md.js:135-142`)은 `<summary>…</summary>` 바로 다음 줄에 자식 Markdown을 빈 줄 없이 붙입니다. CommonMark의 HTML 블록 규칙에 따라 빈 줄이 나올 때까지는 raw HTML로 처리되므로, 토글 안의 첫 문단과 리스트가 Markdown으로 변환되지 않습니다. 후처리로 빈 줄을 넣어야 합니다. |
| ISSUE-06 `<Component>` 텍스트 | **위험 증가** | 지금은 raw HTML이 이스케이프되어 문자열로 보입니다. raw HTML을 허용하는 순간(toggle 때문에 필요) 문단 안의 `<Component>` 같은 텍스트는 알 수 없는 태그로 해석되어 **사라집니다.** raw HTML을 켤 때 rich text의 `<`, `>`를 이스케이프하는 처리가 함께 들어가야 합니다(1-4 참조). |
| ISSUE-06 code | 추가 발견 | `notion-to-md` 3.1.8은 code 블록의 rich_text 조각을 `"\n"`으로 이어 붙입니다(`notion-to-md.js:405`). 코드 블록 안에 서식이 섞여 조각이 나뉘거나 2000자를 넘으면 줄바꿈이 잘못 끼어듭니다. custom transformer로 `""` 연결로 바꾸는 것을 권장합니다. |
| ISSUE-06 table | 추가 발견(경미) | n2m은 표 행을 100개까지만 가져옵니다(`notion-to-md.js` table 분기의 `getBlockChildren(…, 100)`). 현재 글에는 영향이 없습니다. |
| ISSUE-02 | 추가 발견(추정) | `body { height:100% }` 때문에 sticky 헤더의 containing block(body)이 뷰포트 높이로 고정됩니다. 긴 글에서 약 1화면을 지나 스크롤하면 **헤더도 함께 위로 사라집니다.** 같은 수정(1-2)으로 해결됩니다. |
| ISSUE-06 의존성 | 정정 | `remark-gfm 4.0.1`, `rehype-raw 7.0.0`, `shiki 1.29.2`는 `node_modules`에 이미 **간접 의존성**(astro → `@astrojs/markdown-remark 5.3.0`)으로 설치되어 있습니다. 다만 `package.json`에 직접 선언되어 있지 않아 그대로 import하면 안 됩니다(phantom dependency). |
| ISSUE-20 토큰 노출 | 확인 | `c6ce982`(2025-04-30)과 `2e17ed5`에 `console.log('… NOTION_TOKEN =', import.meta.env.NOTION_TOKEN)`이 실제로 있었습니다. GitHub가 secret을 마스킹하지만, 빌드 로그 외에 로컬 dev 서버 출력 등에도 남았을 수 있으므로 재발급을 권장합니다. |

---

## 1. 요약 (권장 방향)

### 1-1. 데이터 소스를 "빌드 전 1회 Notion 수집"으로 통일 (ISSUE-01, 03, 07, 08, 12의 근본 해결)

현재는 수동 JSON(목록)과 빌드 중 API 호출(상세)로 경로가 둘이라 데이터 시점이 어긋납니다. 이를 하나로 합칩니다.

```
npm run build
 ├─ prebuild: node scripts/fetch-notion.js
 │    ├─ DB 전체 조회 (has_more/next_cursor로 끝까지 순회)
 │    ├─ 글마다 notion-to-md로 Markdown 변환 (순차 처리 + 429 재시도)
 │    ├─ Notion 업로드 이미지를 public/notion-images/ 로 다운로드, Markdown의 URL을 로컬 경로로 교체
 │    └─ src/generated/posts.json 작성 (메타 + markdown)   ← git 제외
 └─ astro build
      ├─ index.astro: posts.json의 메타만 Container에 props로 전달 (fetch 없음)
      └─ posts/[id].astro: getStaticPaths가 posts.json 전체로 경로 생성, Markdown을 HTML로 렌더
```

- `astro build` 단계에서는 Notion을 **호출하지 않습니다.** 레이트리밋과 오류는 prebuild 한 곳에서만 처리하고, 실패하면 빌드를 명확히 중단합니다.
- 목록, 태그, 추천글, 상세 페이지가 **같은 JSON**에서 나오므로 서로 어긋날 수 없습니다.
- `public/posts-*.json`, `public/tags/`, `recommended.json`, `tags.json`은 더 이상 쓰지 않으므로 저장소에서 제거합니다.

**대안 비교**

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A (권장)** prebuild 스크립트 + 생성 JSON | 위 구조 | 변경 범위가 작고 Astro 4 그대로 사용, 디버깅 쉬움 | 스크립트를 직접 관리해야 함 |
| B. Astro Content Layer 로더 | Astro 5로 올리고 Notion loader 작성 | Astro 공식 데이터 계층, 캐시 | Astro 5 마이그레이션 필요(React/Tailwind 통합 버전도 함께 올려야 함). 이번 범위에 비해 큼 |
| C. 현 구조 유지 + 버그만 수정 | getStaticPaths 페이지네이션 + CI에서 generate:posts 실행 | 가장 작은 변경 | 두 경로가 계속 남아 같은 종류의 문제가 다시 생김, API 호출 2배 |

### 1-2. 홈 목록은 "빌드 시 props 주입 + 클라이언트 메모리 필터링"

- `index.astro`에서 `posts.json`의 메타(본문 제외)를 `<Container client:load posts={…} />`로 넘깁니다. 태그 필터와 페이지네이션은 배열 연산으로만 처리합니다.
- 효과: ISSUE-08(한글/대소문자 태그 파일명), ISSUE-09(중복 fetch, 경쟁 상태, 에러 처리 부재)의 원인인 **fetch 자체가 사라집니다.** SSR HTML에 1페이지 목록이 들어가 초기 레이아웃 이동과 SEO(ISSUE-17 일부)도 개선됩니다.
- 비용: 글 메타가 HTML에 직렬화됩니다. 글 18개 기준 수 KB이고, 수백 개까지는 문제가 없습니다.
- 대안: `/page/[n]`, `/tags/[tag]/[n]` 정적 라우트로 전부 SSG하는 방법(JS 불필요, SEO 최상). 태그 클릭이 페이지 이동이 되므로 UX가 바뀌고 작업량이 1.5배 정도입니다. 글이 수백 개를 넘거나 SEO가 중요해지면 그때 전환하는 것을 권장합니다.

### 1-3. 만료되는 Notion 이미지(S3 서명 URL) 처리: 빌드 시 다운로드

| 안 | 내용 | 평가 |
|---|---|---|
| **A (권장)** 빌드 시 `public/notion-images/<blockId>.<ext>`로 다운로드 | n2m `image` custom transformer에서 다운로드 후 경로 교체. 디렉터리는 git 제외, CI에서는 `actions/cache`로 재사용 | 만료 문제를 근본 해결, 외부 서비스 불필요. 저장소 용량 증가 없음 |
| B. 다운로드한 이미지를 git에 커밋 | A와 같고 커밋까지 함 | 이미지가 쌓일수록 저장소가 커짐 |
| C. 외부 이미지 호스팅(Cloudinary, R2 등)에 업로드 | 업로드 후 그 URL 사용 | 계정과 키 관리 필요, 과한 구성 |
| D. 1시간마다 재빌드 | cron으로 URL 갱신 | 근본 해결이 아님. 최대 1시간 동안 깨지고 Actions 분량을 낭비 |

- `type === "external"` 이미지(외부 URL)는 만료되지 않으므로 그대로 둡니다.
- 같은 문제가 있는 `file`, `pdf`, `video`(업로드 파일) 블록도 같은 함수로 처리합니다.

### 1-4. Markdown → HTML 렌더링: Astro 내장 Markdown 파이프라인 재사용

- `react-markdown`(플러그인 없음) 대신 **`@astrojs/markdown-remark`의 `createMarkdownProcessor`**를 씁니다. Astro가 `.md` 파일에 쓰는 것과 같은 파이프라인입니다. **GFM(표, 체크박스), raw HTML(rehype-raw), Shiki 구문 하이라이트가 기본으로 포함**되어 있습니다(`@astrojs/markdown-remark/dist/index.js:59,72,78,90`에서 확인).
- 상세 페이지는 상호작용이 없으므로 `PostDetail.jsx`를 `PostDetail.astro`로 바꾸고 `set:html`로 출력합니다. React 런타임이 필요 없습니다.
- 대안: `react-markdown`을 유지하고 `remark-gfm` + `rehype-raw` + `rehype-highlight`(highlight.js)를 붙이는 방법도 가능합니다. 의존성이 3개 늘고 하이라이트 품질은 Shiki보다 떨어집니다. 권장하지 않습니다.
- raw HTML 허용에 따른 보완:
  1. rich text의 `<`, `>`를 `&lt;`, `&gt;`로 이스케이프(인라인 code 서식 제외)해서 `<Component>` 같은 텍스트가 사라지지 않게 합니다.
  2. toggle 출력에 빈 줄을 넣는 후처리를 합니다.
  3. 콘텐츠 작성자가 본인뿐이므로 sanitize는 넣지 않습니다(XSS 위험 낮음). 공동 작성자가 생기면 `rehype-sanitize`를 추가합니다.

### 1-5. 배포 트리거: 수동 실행 + 하루 1회 cron

- 이미지를 다운로드하면 이미지 갱신용 재빌드는 필요 없습니다. cron은 **Notion에 새 글을 쓰면 자동으로 반영**하기 위한 용도입니다.
- 권장: `workflow_dispatch`(Actions 탭에서 수동 실행) + `schedule: '0 18 * * *'`(매일 KST 03:00) + 기존 `push`.
- 주의: GitHub는 **공개 저장소에 60일 동안 커밋이 없으면 schedule 워크플로를 자동으로 비활성화**합니다. 커밋이 드문 블로그라면 비활성화 알림 메일을 받을 수 있습니다. 이 경우 Actions 탭에서 다시 켜야 합니다.
- 선택: Notion을 수정한 직후 바로 반영하려면 `repository_dispatch`를 추가하고 iOS 단축어나 북마클릿으로 호출할 수 있습니다(PAT 필요). 기본 제안에는 포함하지 않습니다.

---

## 2. 작업 단계

| Phase | 목표 | 포함 이슈 | 선행 조건 |
|---|---|---|---|
| **Phase 0** | 사용자 사전 작업 | ISSUE-20(토큰), ISSUE-13(속성 결정) | 없음 |
| **Phase 1** | 핵심 불만 해결: 글이 제대로 렌더되고, 모든 글이 열리고, 이미지가 보이고, Footer가 맨 아래에 있게 함 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 12, 20(CI 부분) | Phase 0 |
| **Phase 2** | 모바일 대응, 게시 필터, 데이터 품질, 시각 결함 | 11, 13, 14, 15, 06(callout/bookmark 개선), 17(title/lang/404) | Phase 1 |
| **Phase 3** | 정리, SEO, 성능, 미구현 UI | 16, 17(나머지), 18, 19 | Phase 2 (독립적으로도 가능) |

---

## 3. Phase 0 — 사용자 사전 작업

1. **Notion 토큰 재발급(권장)**: Notion → Settings → Connections → 해당 integration → Secret 재발급. 그다음 로컬 `.env`의 `NOTION_TOKEN`과 GitHub 저장소 Settings → Secrets and variables → Actions의 `NOTION_TOKEN`을 함께 교체합니다.
2. **게시 상태 속성 결정**(ISSUE-13, 6장 결정 사항 D1): 정하지 않으면 Phase 1은 필터 없이 진행하고 Phase 2에서 추가합니다.
3. **GitHub Pages 설정 확인**: Settings → Pages → Source가 `Deploy from a branch` / `gh-pages` / `/(root)`인지 확인합니다. 현재 워크플로(peaceiris)는 이 설정을 전제로 합니다.
4. **Actions 권한**: Settings → Actions → General → Workflow permissions가 `Read and write`인지 확인합니다. 또는 1-8에서 워크플로에 `permissions: contents: write`를 명시합니다.

---

## 4. Phase 1 — 핵심 문제 해결

### 1-1. 새 Notion 수집 스크립트 (ISSUE-01, 03, 05, 06, 07, 12)

- **해결 방안**: `scripts/generatePosts.js`를 대체하는 `scripts/fetch-notion.js`를 작성하고 `prebuild`에 연결합니다.
- **변경할 파일**
  - 신규 `scripts/fetch-notion.js`
  - 삭제 `scripts/generatePosts.js` (전체 1-116)
  - `package.json:4-10` scripts
  - `.gitignore` 끝에 추가
- **코드**

```jsonc
// package.json
"scripts": {
  "dev": "astro dev",
  "fetch:notion": "node scripts/fetch-notion.js",
  "prebuild": "node scripts/fetch-notion.js",
  "build": "astro build",
  "preview": "astro preview",
  "format": "prettier --write ."
}
```

```gitignore
# generated from Notion at build time
src/generated/
public/notion-images/
```

```js
// scripts/fetch-notion.js (요지)
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { Client, APIErrorCode, isNotionClientError } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  throw new Error("NOTION_TOKEN / NOTION_DATABASE_ID 환경변수가 없습니다.");
}
const IMG_DIR = path.resolve("public/notion-images");
const OUT = path.resolve("src/generated/posts.json");

// 429/5xx 재시도 (ISSUE-12)
async function withRetry(fn, tries = 5) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      const retryable = isNotionClientError(e) &&
        (e.code === APIErrorCode.RateLimited || e.code === APIErrorCode.ServiceUnavailable
         || e.code === APIErrorCode.InternalServerError);
      if (!retryable || i >= tries - 1) throw e;
      const wait = Number(e.headers?.get?.("retry-after")) * 1000 || 1000 * 2 ** i;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// rich text의 < > 이스케이프 (raw HTML 허용 시 텍스트 소실 방지)
const escapeRichText = (rt = []) => rt.forEach((t) => {
  if (!t.annotations?.code) t.plain_text = t.plain_text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
});

const notion = new Client({ auth: NOTION_TOKEN });
// n2m이 호출하는 blocks.children.list를 감싸서 이스케이프와 재시도를 적용
const n2mClient = {
  ...notion,
  blocks: {
    ...notion.blocks,
    children: {
      list: async (args) => {
        const res = await withRetry(() => notion.blocks.children.list(args));
        for (const b of res.results) {
          if (b.type === "code") continue;
          escapeRichText(b[b.type]?.rich_text);
        }
        return res;
      },
    },
  },
};
const n2m = new NotionToMarkdown({ notionClient: n2mClient });

const plain = (rt = []) => rt.map((t) => t.plain_text).join("");   // ISSUE-14: 첫 조각만 쓰던 문제

async function download(url, id) {
  const ext = path.extname(new URL(url).pathname) || ".png";
  const file = `${id}${ext.toLowerCase()}`;
  const dest = path.join(IMG_DIR, file);
  try { await fs.access(dest); return `/notion-images/${file}`; } catch {}
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패 ${res.status}: ${id}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return `/notion-images/${file}`;
}

// ISSUE-05: 이미지
n2m.setCustomTransformer("image", async (block) => {
  const img = block.image;
  const src = img.type === "file" ? await download(img.file.url, block.id) : img.external.url;
  const alt = plain(img.caption).replace(/[\[\]]/g, "");
  return `![${alt}](${src})`;
});
// ISSUE-06: 북마크 텍스트가 "bookmark"로 나오던 문제
for (const type of ["bookmark", "link_preview", "embed"]) {
  n2m.setCustomTransformer(type, async (block) => {
    const { url, caption } = block[type];
    return `[${plain(caption) || url}](${url})`;
  });
}
// ISSUE-06: code 조각을 "\n"으로 잇던 문제
n2m.setCustomTransformer("code", async (block) => {
  const code = block.code.rich_text.map((t) => t.plain_text).join("");
  const lang = (block.code.language || "plaintext").replace(/\s+/g, "");
  return "```" + lang + "\n" + code + "\n```";
});

// toggle 안의 Markdown이 변환되도록 빈 줄 삽입
const fixToggle = (md) =>
  md.replace(/(<summary>[\s\S]*?<\/summary>)\n/g, "$1\n\n").replace(/\n<\/details>/g, "\n\n</details>");

// ISSUE-07: 날짜는 created 속성(YYYY-MM-DD)을 그대로 사용, 없으면 created_time을 KST로 변환
const toDate = (page) =>
  page.properties.created?.date?.start?.slice(0, 10) ??
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(page.created_time));

async function queryAll() {   // ISSUE-01: 전체 페이지네이션
  const pages = []; let cursor;
  do {
    const res = await withRetry(() => notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
      // filter: { property: "published", checkbox: { equals: true } },  // Phase 2 (D1)
      sorts: [{ property: "created", direction: "descending" },
              { timestamp: "created_time", direction: "descending" }],   // ISSUE-14 보조 정렬
    }));
    pages.push(...res.results); cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

await fs.mkdir(IMG_DIR, { recursive: true });
await fs.mkdir(path.dirname(OUT), { recursive: true });
const posts = [];
for (const page of await queryAll()) {            // 순차 처리(레이트리밋 대응)
  const p = page.properties;
  const blocks = await n2m.pageToMarkdown(page.id);
  posts.push({
    id: page.id,
    title: plain(p.title?.title) || "제목 없음",
    summary: plain(p.summary?.rich_text),
    tags: p.tags?.multi_select.map((t) => t.name) ?? [],
    date: toDate(page),
    isRecommended: p.isRecommended?.checkbox ?? false,
    markdown: fixToggle(n2m.toMarkdownString(blocks).parent ?? ""),
  });
  console.log(`✓ ${posts.length} ${posts.at(-1).title}`);
}
await fs.writeFile(OUT, JSON.stringify(posts, null, 2));
console.log(`총 ${posts.length}개 글 생성`);
```

- **의존성**: 추가 없음. `dotenv`, `@notionhq/client`, `notion-to-md`는 이미 있고 `fetch`는 Node 20 내장입니다.
- **검증 방법**
  1. `npm run fetch:notion` 실행 → "총 18개 글 생성"(현재 DB 기준)이 출력되는지 확인합니다.
  2. `src/generated/posts.json`에서 `markdown`에 `prod-files-secure` 문자열이 **0건**인지 확인합니다(`grep -c prod-files-secure`).
  3. `public/notion-images/`에 Toss 리뷰 이미지 9장 등이 생성되었는지 확인합니다.
  4. `.env`의 토큰을 일부러 틀리게 바꿔 실행하면 즉시 실패(exit 1)하는지 확인합니다.
- **위험도/주의사항**: 중간.
  - `n2mClient` 래퍼는 n2m 내부가 `notionClient.blocks.children.list`를 쓴다는 점에 의존합니다(3.1.8에서 확인). n2m 버전을 올리면 다시 확인해야 합니다. `package.json`의 `"notion-to-md": "^3.1.8"`을 `"3.1.8"`로 고정하는 것을 권장합니다.
  - 순차 처리이므로 글 18개 기준 수집에 약 30초~1분이 걸립니다. 글이 100개를 넘으면 동시성 2~3으로 바꾸는 것을 검토합니다.
  - `created` 속성 이름은 현재 DB 스키마(`title`, `summary`, `created`, `tags`, `isRecommended`)를 그대로 사용합니다.

### 1-2. Footer가 본문 중간에 나오는 문제 (ISSUE-02)

- **해결 방안**: 고정 높이(`height:100%`, `h-full`)를 제거하고 sticky footer 패턴(`min-h-screen` + flex column)을 적용합니다.
- **변경할 파일**: `src/layouts/Layout.astro:16-33`, `src/components/PostDetail.jsx:4-7`(1-4에서 `.astro`로 교체), `src/components/Header.jsx:5`
- **코드**

```astro
<!-- src/layouts/Layout.astro -->
<body class="min-h-screen flex flex-col bg-white">
  <Header />
  <main class="flex-1 w-full">
    <slot />
  </main>
  <Footer />
</body>
<!-- 기존 <style> html,body { height:100% } 블록(27-33) 삭제 -->
```

```diff
// src/components/Header.jsx:5  (ISSUE-15와 함께)
- <nav className="w-full h-[60px] sticky top-0 left-0 bg-white">
+ <nav className="w-full h-[60px] sticky top-0 left-0 z-50 bg-white border-b">
```

- 상세 페이지 래퍼의 `h-full`, `min-h-[100vh]`는 1-4에서 제거합니다. `Container.jsx:93`의 `min-h-[95vh]`도 제거합니다(Footer가 레이아웃에서 바닥에 붙으므로 필요 없음).
- **검증 방법**: `npm run build && npm run preview` → 긴 글(Toss Simplicity24 리뷰)과 짧은 글(리액트의 메모이제이션)에서 Footer가 문서 맨 끝에 있는지 확인합니다. DevTools에서 `document.querySelector('footer').getBoundingClientRect().top + scrollY ≈ document.documentElement.scrollHeight - 59`인지 확인합니다. 긴 글을 끝까지 스크롤했을 때 헤더가 계속 고정되어 있는지도 확인합니다.
- **위험도**: 낮음. Footer는 `<div>`인데 `<footer>`로 바꾸는 것을 권장합니다(`Footer.jsx:3`).

### 1-3. 데이터 읽기 모듈 (ISSUE-03, 12)

- **변경할 파일**: 신규 `src/lib/posts.js`, 삭제 `src/lib/notion.js`(1-150 전체: 빌드 중 API 호출, 오류 삼킴, 데드 코드 `getRecommendedPosts`/`getCursorForPage`, `hasMor` 오타가 함께 정리됨)
- **코드**

```js
// src/lib/posts.js
import fs from "node:fs";
import path from "node:path";

let cache;
export function getAllPosts() {
  if (cache) return cache;
  const file = path.resolve("src/generated/posts.json");
  if (!fs.existsSync(file)) {
    throw new Error("src/generated/posts.json이 없습니다. `npm run fetch:notion`을 먼저 실행하세요.");
  }
  return (cache = JSON.parse(fs.readFileSync(file, "utf-8")));
}

export function getPostSummaries() {   // 본문을 뺀 목록용 메타
  return getAllPosts().map(({ markdown, ...meta }) => ({ ...meta, url: `/posts/${meta.id}/` }));
}
```

- **검증 방법**: JSON을 지운 상태에서 `npx astro build`를 실행하면 위 메시지로 실패하는지 확인합니다.
- **위험도**: 낮음. `npm run dev` 전에 한 번 `npm run fetch:notion`을 실행해야 합니다(README에 명시).

### 1-4. 상세 페이지 렌더링 교체 (ISSUE-01, 06, 07, 17 일부)

- **해결 방안**: 모든 글로 경로를 생성하고, Astro Markdown 파이프라인(GFM + raw HTML + Shiki)으로 렌더합니다.
- **변경할 파일**
  - `src/pages/posts/[id].astro:1-23` 전체 교체
  - 신규 `src/lib/markdown.js`
  - `src/components/PostDetail.jsx`(1-27) → 신규 `src/components/PostDetail.astro`로 교체
  - `src/layouts/Layout.astro:8,14` (`title` prop, `lang`)
  - `package.json` dependencies
- **코드**

```js
// src/lib/markdown.js
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

let processor;
export async function renderMarkdown(md) {
  processor ??= createMarkdownProcessor({
    gfm: true,                      // 표, 체크박스, 취소선
    smartypants: false,             // 따옴표 자동 변환 끔(코드 설명 글 보호)
    syntaxHighlight: "shiki",
    shikiConfig: { theme: "github-light", wrap: false },
  });
  return (await (await processor).render(md)).code;
}
```

```astro
---
// src/pages/posts/[id].astro
import Layout from "../../layouts/Layout.astro";
import PostDetail from "../../components/PostDetail.astro";
import { getAllPosts } from "../../lib/posts";
import { renderMarkdown } from "../../lib/markdown";

export function getStaticPaths() {
  return getAllPosts().map((post) => ({ params: { id: post.id }, props: { post } }));
}
const { post } = Astro.props;
const html = await renderMarkdown(post.markdown);
---
<Layout title={`${post.title} | NHYELOG.DEV`} description={post.summary}>
  <PostDetail post={post} html={html} />
</Layout>
```

```astro
---
// src/components/PostDetail.astro
const { post, html } = Astro.props;
const date = post.date?.replaceAll("-", ". ");
---
<article class="w-full max-w-[1050px] mx-auto px-6 pb-24">
  <header class="border-b mb-10 pt-6">
    <h1 class="text-3xl md:text-4xl font-bold mb-2">{post.title}</h1>
    <time datetime={post.date} class="text-gray-400">{date}</time>
    <ul class="flex flex-wrap gap-2 mt-2 pb-5">
      {post.tags.map((tag) => <li class="bg-gray-200 rounded-xl py-1 px-2 text-sm">{tag}</li>)}
    </ul>
  </header>
  <div class="prose prose-neutral max-w-none prose-pre:overflow-x-auto prose-img:mx-auto
              [&_table]:block [&_table]:overflow-x-auto" set:html={html} />
  <a href="/" class="inline-block mt-16 text-gray-500 hover:underline">← 목록으로</a>
</article>
```

```astro
---
// src/layouts/Layout.astro 상단
const { title = "NHYELOG.DEV", description = "nijeyhmi의 개발 블로그" } = Astro.props;
---
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
```

- **새 의존성**
  - `@astrojs/markdown-remark@5.3.0`: astro 4.16.18이 내부에서 쓰는 버전과 **정확히 같은 버전**으로 선언합니다(이미 `node_modules`에 있어 추가 설치량은 0). `"^5.3.0"` 대신 astro와 맞춘 `"5.3.0"` 고정을 권장합니다.
  - 제거 후보: `react-markdown`(더 이상 사용하지 않음).
- **검증 방법**
  1. `npm run build` 후 `dist/posts/*/index.html`이 **18개**(`ls dist/posts | wc -l`)인지 확인합니다.
  2. 디자인 시스템 글(`1de296c3-3d92-806c-af63-c158221fed1a`): `<table>` 3개, `<input type="checkbox" disabled>` 8개가 있는지 확인합니다.
  3. 코드 리뷰에 대한 고찰(`1de296c3-3d92-800f-9ecf-f61f54902b7e`): `&lt;details` 문자열이 없고 `<details>`가 있으며, 토글 내부가 `<p>`, `<ul>`로 변환되었는지 확인합니다.
  4. Lexical Editor 글: `<pre class="astro-code github-light"` + `<span style="color:…">`로 하이라이트되었는지 확인합니다.
  5. "Function components cannot be…" 글에서 `<…>` 텍스트가 그대로 보이는지 확인합니다.
  6. Toss 리뷰: 날짜가 `2024. 11. 14`인지, 이미지 9장이 `/notion-images/…`로 200을 반환하는지 확인합니다.
  7. 빌드 로그의 `[Shiki] The language … doesn't exist` 경고를 확인합니다(Notion 언어명 중 Shiki에 없는 것은 plaintext로 대체되며 빌드는 계속됩니다).
- **위험도/주의사항**: 중간.
  - Tailwind typography의 `pre` 배경과 Shiki 인라인 배경이 겹칠 수 있습니다. Shiki 인라인 스타일이 우선하므로 대체로 괜찮지만 육안 확인이 필요합니다.
  - `@astrojs/markdown-remark`는 Astro 내부 패키지에 가깝습니다. Astro 5로 올리면 6.x로 함께 올려야 합니다(`createMarkdownProcessor` API는 6.x에도 있습니다).

### 1-5. 홈 Container: props 기반으로 재작성 (ISSUE-08, 09, 10)

- **변경할 파일**: `src/pages/index.astro:1-8`, `src/components/Container.jsx:1-115`(전면 수정), `src/components/Sidebar.jsx:4-12`(recommended fetch 제거, props로 받음), `src/components/Pagination.jsx:20`
- **코드**

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Layout.astro";
import Container from "../components/Container";
import { getPostSummaries } from "../lib/posts";
const posts = getPostSummaries();
---
<Layout>
  <Container client:load posts={posts} />
</Layout>
```

```jsx
// src/components/Container.jsx (핵심 로직)
import { useEffect, useMemo, useState } from "react";
const PAGE_SIZE = 10;
const PAGES_PER_GROUP = 5;

const readQuery = () => {
  if (typeof window === "undefined") return { tag: null, page: 1 };
  const q = new URLSearchParams(window.location.search);
  return { tag: q.get("tag"), page: Math.max(1, Number(q.get("page")) || 1) };
};

const Container = ({ posts }) => {
  const [{ tag: activeTag, page }, setState] = useState({ tag: null, page: 1 });

  // URL 쿼리와 동기화 (새로고침, 뒤로가기, 공유 링크)
  useEffect(() => {
    const sync = () => setState(readQuery());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = (next) => {
    const q = new URLSearchParams();
    if (next.tag) q.set("tag", next.tag);
    if (next.page > 1) q.set("page", String(next.page));
    history.pushState(null, "", q.size ? `?${q}` : location.pathname);
    setState(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))], [posts]);
  const recommended = useMemo(() => posts.filter((p) => p.isRecommended), [posts]);
  const filtered = useMemo(
    () => (activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts),
    [posts, activeTag]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const startPage = Math.floor((current - 1) / PAGES_PER_GROUP) * PAGES_PER_GROUP + 1;
  const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);

  const selectTag = (tag) => navigate({ tag: activeTag === tag ? null : tag, page: 1 });
  const navigatePage = (p) => navigate({ tag: activeTag, page: p });
  // …JSX는 기존 구조를 유지하고 visible / tags / recommended를 하위 컴포넌트에 전달
};
```

```diff
// src/components/Pagination.jsx:20 (ISSUE-10)
- ${idx + 1 === page ? "bg-green-50 font-bold" : ""}
+ ${pageNum === page ? "bg-green-50 font-bold" : ""}
// 버튼에 aria-current={pageNum === page ? "page" : undefined}, 이전/다음에 aria-label 추가
```

- 목록 날짜 표시: `PostList.jsx:26` `{post.created}` → `{post.date?.replaceAll("-", ". ")}`(상세 페이지와 같은 형식).
- **삭제할 파일**(git에서 제거): `public/posts-meta.json`, `public/posts-page-1.json`, `public/posts-page-2.json`, `public/recommended.json`, `public/tags.json`, `public/tags/*.json`(7개). ISSUE-08의 한글 키 제거, 대소문자 파일명 문제, ISSUE-14의 오래된 태그 파일 잔존 문제가 모두 함께 사라집니다.
- **검증 방법**
  1. 홈 → "리뷰", "번역", "React" 태그 클릭 → 네트워크 탭에 JSON 요청이 **0건**이고 콘솔 오류가 없는지 확인합니다.
  2. 태그 선택 → 2페이지 → 새로고침 → 같은 상태가 유지되는지, 뒤로가기가 동작하는지 확인합니다.
  3. JS를 끈 상태에서 홈 HTML에 1페이지 글 제목 10개가 있는지 확인합니다(`curl`로 `dist/index.html` 확인).
- **위험도/주의사항**: 낮음~중간.
  - SSR 시점에는 URL 쿼리를 모르므로 `?tag=…`로 들어오면 hydrate 직후 목록이 한 번 바뀝니다(짧은 깜빡임). 허용 가능한 수준으로 판단합니다.
  - `URLSearchParams.size`는 최신 브라우저에서만 지원합니다. 걱정되면 `q.toString()`으로 판단합니다.

### 1-6. 배포 워크플로 개선 (ISSUE-04, 20)

- **변경할 파일**: `.github/workflows/deploy.yml:1-34`
- **코드**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:            # Actions 탭에서 수동 실행
  schedule:
    - cron: "0 18 * * *"        # 매일 03:00 KST (D3에서 주기 결정)

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
      NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Restore Notion images cache
        uses: actions/cache@v4
        with:
          path: public/notion-images
          key: notion-images-${{ github.run_id }}
          restore-keys: notion-images-
      - run: npm ci
      - run: npm run build          # prebuild(fetch-notion) → astro build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- **검증 방법**: push 후 Actions 로그에서 "총 N개 글 생성" 확인 → 라이브 사이트에서 18개 상세 페이지가 모두 200인지 확인(분석 문서의 curl 루프 재사용) → Actions 탭의 "Run workflow" 버튼이 보이는지 확인합니다.
- **위험도/주의사항**: 낮음.
  - `npm ci`는 `package-lock.json`이 `package.json`과 일치해야 합니다. 의존성 변경 후 lockfile을 함께 커밋해야 합니다.
  - 이미지 캐시는 Notion에서 이미지를 **교체**해도 block ID가 같으면 옛 파일을 재사용합니다. 파일명에 Notion URL 경로의 파일명 해시를 섞으면 해결됩니다(구현 시 `id + 원본 파일명 해시` 사용을 권장).
  - cron 실행 시 Notion 내용이 바뀌지 않아도 gh-pages에 커밋이 생길 수 있습니다. peaceiris는 변경이 없으면 커밋을 건너뜁니다.

---

## 5. Phase 2 — 모바일, 게시 필터, 품질

### 2-1. 반응형 레이아웃 (ISSUE-11)

- **변경할 파일**: `src/components/Container.jsx:92-98`, `src/components/Sidebar.jsx:15,17,33,54`
- **코드**

```diff
// Container.jsx
- <div className="flex items-start flex-row justify-center px-[24px]">
-   <div className="w-[1200px] min-h-[95vh]">
-     <div className="flex justify-center items-center border-lg mx-auto mt-[24px] mb-[40px] max-w-[1050px] relative h-[130px] …">
+ <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
+     <div className="flex justify-center items-center mx-auto mt-6 mb-10 max-w-[1050px] relative h-[100px] md:h-[130px] …">
  …
- <div className="flex justify-evenly min-h-[50px]">
-   <div className="w-full max-w-[700px] m-b-[60px] px-[24px] min-h-[47px]">
+ <div className="flex flex-col lg:flex-row lg:justify-evenly gap-10">
+   <div className="w-full lg:max-w-[700px] mb-[60px] lg:px-6">

// Sidebar.jsx
- <div className="mb-[100px] pt-0 px-[24px] pb-[50px] border-l-2">
-   <div className="w-[300px]">
+ <aside className="w-full lg:w-[300px] shrink-0 mb-[100px] lg:px-6 pb-[50px] border-t-2 pt-6 lg:border-t-0 lg:pt-0 lg:border-l-2">
+   <div>
```

- 배너 이미지: `className="w-full h-full object-cover"`.
- **검증 방법**: DevTools 기기 모드 390px, 768px, 1024px, 1440px에서 가로 스크롤이 없는지(`document.documentElement.scrollWidth === innerWidth`), 제목 왼쪽이 잘리지 않는지 확인합니다. 상세 페이지의 표와 코드 블록은 자체 가로 스크롤이 생기는지 확인합니다.
- **위험도**: 낮음. 데스크톱 화면이 기존과 약간 달라질 수 있어 육안 확인이 필요합니다.

### 2-2. 게시 상태 필터 (ISSUE-13)

> **[적용 시 결정] 의도적으로 적용하지 않음.** 사용자 결정(D1)에 따라 지금처럼 DB의 모든 글을 공개합니다. `scripts/fetch-notion.js`의 `queryAll()`에 그 내용을 주석으로 남겼습니다. 필요해지면 아래 방법으로 추가하면 됩니다.

- **해결 방안**: 사용자가 Notion DB에 체크박스 속성(예: `published`)을 추가하고, 공개할 글을 모두 체크한 뒤 필터를 켭니다.
- **변경할 파일**: `scripts/fetch-notion.js`의 `queryAll()` filter 주석 해제
- **안전장치**: 속성이 아직 없을 때 모든 글이 사라지지 않도록, 시작할 때 `notion.databases.retrieve`로 속성 존재 여부를 확인하고 없으면 필터 없이 진행하면서 경고를 출력합니다.

```js
const db = await withRetry(() => notion.databases.retrieve({ database_id: NOTION_DATABASE_ID }));
const filter = db.properties.published?.type === "checkbox"
  ? { property: "published", checkbox: { equals: true } }
  : (console.warn("⚠ published 속성 없음: 전체 글을 공개합니다."), undefined);
```

- **검증 방법**: 테스트 글 하나의 체크를 해제하고 `npm run fetch:notion` → 글 수가 1 줄었는지 확인합니다.
- **위험도**: 중간. 기존 글을 체크하기 전에 속성만 추가하면 **글이 모두 사라집니다.** 반드시 "속성 추가 → 기존 글 전부 체크 → 배포" 순서로 진행해야 합니다.

### 2-3. 데이터 처리 잔여 항목 (ISSUE-14)

- 제목/요약 전체 조각 연결, 보조 정렬, 태그 파일명 문제, 데드 코드는 Phase 1에서 이미 해결됩니다.
- 남는 항목: **slug**. URL을 `/posts/<uuid>/`에서 읽기 쉬운 slug로 바꾸는 것은 선택 사항입니다(D5). 바꾼다면 Notion에 `slug` 텍스트 속성을 추가하고, 비어 있으면 UUID로 대체하며, 기존 UUID URL은 `src/pages/posts/[id].astro`에서 `<meta http-equiv="refresh">` 리다이렉트 페이지로 유지해 외부 링크가 깨지지 않게 합니다.

### 2-4. callout, 북마크 표현 개선 (ISSUE-06 잔여)

- **callout**: n2m의 blockquote 출력 대신 custom transformer로 `<div class="callout">`을 출력합니다. 빈 줄을 넣어 안쪽 Markdown이 변환되게 합니다.

```js
n2m.setCustomTransformer("callout", async (block) => {
  const icon = block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "💡";
  const text = await n2m.blockToMarkdown({ type: "paragraph", paragraph: { rich_text: block.callout.rich_text } });
  return `<div class="callout"><span class="callout-icon">${icon}</span><div>\n\n${text}\n\n</div></div>`;
});
```

  스타일은 `PostDetail.astro`에 `.callout { display:flex; gap:.75rem; padding:1rem; border-radius:.5rem; background:#f7f6f3 }`를 추가합니다. 주의: callout의 **자식 블록**은 n2m이 이 출력 뒤에 별도로 붙이므로 박스 밖에 나옵니다. 자식 블록이 있는 callout이 있는지 확인이 필요합니다.
- **북마크 미리보기 카드**: 빌드 시 각 URL의 OG 태그(title/description/image)를 가져와 카드로 만드는 것은 외부 요청이 늘고 실패 가능성이 있어 기본 제안에서 제외합니다(D6). Phase 1의 "URL 또는 caption 텍스트 링크"로 충분하다고 판단합니다.
- **글자 색 annotation**: Markdown으로 표현할 수 없으므로 무시합니다(필요하면 `<span style="color">` 출력 transformer로 가능하지만 효과 대비 복잡도가 큽니다).

### 2-5. 헤더 z-index (ISSUE-15)

- Phase 1의 1-2에서 `z-50`을 함께 적용합니다. 여기서는 육안 검증만 합니다.

### 2-6. 기본 메타와 404 (ISSUE-17 일부)

- `lang="ko"`, viewport, favicon type, 글별 title/description은 Phase 1의 1-4에서 적용합니다.
- 신규 `src/pages/404.astro`: Layout + "페이지를 찾을 수 없습니다" + 홈 링크. GitHub Pages는 루트의 `404.html`을 자동으로 사용합니다.
- **검증 방법**: `/posts/없는-id/` 접속 시 커스텀 404가 보이는지 확인합니다.

---

## 6. Phase 3 — 정리, SEO, 성능

### 3-1. Tailwind 클래스와 스타일 정리 (ISSUE-16)

| 위치 | 변경 |
|---|---|
| `Header.jsx:8` | `m-r-[24px]` → `mr-6` |
| `Container.jsx:98` | `m-b-[60px]` → `mb-[60px]`(Phase 2에서 반영) |
| `Container.jsx:94` | `border-lg` 삭제 |
| `Sidebar.jsx:43,79,82` | `pl-[10px] pr-[8px] py-[4px] px-[10px]` → `px-[10px] py-1` |
| `src/styles/global.css` | 사용되지 않으므로 삭제(내용 확인 후) |
| `tailwind.config.js:9` | `require(...)` → `import typography from "@tailwindcss/typography"` + `plugins: [typography]` |

### 3-2. SEO와 접근성 (ISSUE-17 나머지)

- 사이트맵: `@astrojs/sitemap`. Astro 4와 호환되는 **3.x**를 사용합니다(정확한 버전은 설치 시 `npm view @astrojs/sitemap@3 peerDependencies`로 astro `^4` 지원 여부를 확인한 뒤 고정). `astro.config.mjs`에 `site: "https://nijeyhmi.github.io"`가 필요합니다.
- RSS(선택): `@astrojs/rss` 4.x.
- Open Graph(`og:title`, `og:description`, `og:url`)와 canonical을 `Layout.astro` props로 추가합니다.
- 제목 계층: `PostList.jsx:22` `<h1>` → `<h2>`, `Header.jsx:10` 로고 `<h2>` → `<span>`, 홈에는 시각적으로 숨긴 `<h1>`을 하나 둡니다.
- `alt`: `Sidebar.jsx:60` → `alt="녜진 프로필 사진"`, GitHub/LinkedIn 링크에 `aria-label`, 배너 `alt=""` 유지(장식 이미지).
- 리스트 key: `PostList.jsx`와 `Sidebar.jsx`의 index key를 tag 문자열로 바꿉니다(`PostDetail`은 1-4에서 `.astro`로 바뀌어 해당 없음).

### 3-3. 미구현 UI (ISSUE-18) — 사용자 결정(D4)에 따름

| 요소 | 제거안 | 구현안 |
|---|---|---|
| 다크모드 버튼 (`Header.jsx:15-17`) | 버튼 삭제 | Tailwind `darkMode: "class"` + `<head>` 인라인 스크립트로 `localStorage`/`prefers-color-scheme` 반영 + 토글. 모든 컴포넌트에 `dark:` 클래스, `prose-invert`, Shiki dual theme(`themes: { light, dark }`) 필요. 0.5~1일 추가 |
| Portfolio / TIL (`Sidebar.jsx:78-85`) | 삭제, `Portfolio.jsx` 삭제 | 외부 URL(노션 포트폴리오, TIL 저장소 등)로 `<a>` 연결. URL을 알려 주시면 됩니다 |
| 이전/다음 글 | — | `getStaticPaths`에서 인접 글을 props로 넘겨 하단에 링크 표시(작음) |
| README | 실제 구현과 맞게 갱신 | — |

- 사용하지 않는 의존성 정리: `fuse.js`(검색 미구현), `react-markdown`(Phase 1 이후 미사용). 검색을 구현한다면 `fuse.js`를 유지하고 1-5의 메모리 목록에 붙이면 됩니다.

### 3-4. 정적 이미지 최적화 (ISSUE-19)

- `public/banner.png`(2.9MB), `public/portrait.png`(353KB)를 `src/assets/`로 옮기고 `astro:assets`의 `<Image>`로 바꾸면 빌드 시 WebP 변환과 리사이즈가 됩니다. `sharp`는 astro 의존성으로 이미 설치되어 있습니다.
- 다만 두 이미지는 React 컴포넌트(`Container.jsx`, `Sidebar.jsx`) 안에 있어 `<Image>`를 직접 쓸 수 없습니다. 가장 간단한 방법은 **원본 파일을 한 번 압축/리사이즈해서 교체**하는 것입니다(배너는 폭 2100px WebP로 약 100~200KB, 프로필은 170px WebP로 약 10KB 예상). 그리고 `width`/`height`, 프로필에는 `loading="lazy"`를 추가합니다.
- Notion 이미지(`public/notion-images/`)도 빌드 시 `sharp`로 최대 폭 1600px WebP 변환을 추가할 수 있습니다(선택, `sharp`를 직접 의존성으로 선언해야 함).

---

## 7. 새 의존성 정리

| 패키지 | 버전 | Phase | 이유 | 비고 |
|---|---|---|---|---|
| `@astrojs/markdown-remark` | `5.3.0` (고정) | 1 | GFM + raw HTML + Shiki 렌더 | astro 4.16.18의 내부 의존성과 같은 버전. 추가 다운로드 없음 |
| `@astrojs/sitemap` | `3.x` (astro 4 호환 버전 확인 후 고정) | 3 | sitemap | 선택 |
| `@astrojs/rss` | `4.x` | 3 | RSS | 선택 |

- **제거**: `react-markdown`(Phase 1), `fuse.js`(Phase 3, 검색을 구현하지 않으면)
- **버전 고정 권장**: `notion-to-md` `^3.1.8` → `3.1.8`(내부 동작에 의존하는 래퍼 때문)
- `remark-gfm`, `rehype-raw`, `shiki`를 **직접 추가할 필요는 없습니다**(`@astrojs/markdown-remark`가 포함).

---

## 8. 사용자 결정이 필요한 사항

| ID | 결정 | 선택지 | 권장 |
|---|---|---|---|
| D1 | 게시 상태 속성 | (a) 체크박스 `published` (b) Status 속성(`Draft`/`Published`) (c) 필터 없음 | (a). 속성 이름도 알려 주세요. 추가 후 **기존 글 전부 체크**를 직접 해야 합니다 |
| D2 | 이미지 저장 방식 | (a) 빌드 시 다운로드, git 제외 + Actions 캐시 (b) 다운로드 후 git 커밋 (c) 외부 호스팅 | (a) |
| D3 | 자동 배포 주기 | (a) 매일 1회 (b) 6시간마다 (c) 수동 실행만 (d) 수동 + `repository_dispatch` | (a) + 수동 실행 |
| D4 | 다크모드, Portfolio, TIL 버튼 | 제거 / 구현 (Portfolio·TIL은 연결할 URL 필요) | 다크모드는 일단 제거하고 나중에 구현, Portfolio/TIL은 URL이 있으면 링크, 없으면 제거 |
| D5 | URL slug | (a) UUID 유지 (b) Notion `slug` 속성 + 옛 URL 리다이렉트 | 이번에는 (a). 나중에 (b) |
| D6 | 북마크 미리보기 카드 | (a) 텍스트 링크 (b) 빌드 시 OG 메타를 가져와 카드 | (a) |
| D7 | 홈 목록 방식 | (a) props + 클라이언트 필터 (b) 정적 페이지 라우트 | (a) |
| D8 | 코드 하이라이트 테마 | `github-light` 등 Shiki 테마 중 선택 | `github-light` |
| D9 | 기존 커밋된 JSON 삭제 | `public/posts-*.json`, `public/tags/` 등을 git에서 삭제 | 삭제 |
| D10 | Notion 토큰 재발급 | 재발급 / 유지 | 재발급 |

### 사용자가 직접 해야 하는 작업

1. **Notion 토큰 재발급** 후 `.env`와 GitHub Secret `NOTION_TOKEN`을 교체합니다(D10).
2. **GitHub Secrets 확인**: `NOTION_TOKEN`, `NOTION_DATABASE_ID`가 현재 유효한지 확인합니다. 마지막 배포가 2025-05-07이라 만료/폐기 여부를 알 수 없습니다.
3. **Pages 설정 확인**: Source = `gh-pages` 브랜치 `/ (root)`.
4. **Actions 권한**: Workflow permissions = Read and write(또는 워크플로의 `permissions` 명시로 대체).
5. **Notion DB 수정**(D1, D5 선택 시): 속성 추가와 기존 글 체크.
6. **schedule 재활성화**: 60일 동안 커밋이 없어 비활성화 알림이 오면 Actions 탭에서 다시 켭니다.
7. 적용 후 첫 배포에서 **Actions 탭의 "Run workflow"로 수동 실행**해 결과를 확인합니다.

---

## 9. 예상 작업량

| Phase | 작업 | 예상 시간 | 비고 |
|---|---|---|---|
| Phase 0 | 토큰 재발급, 설정 확인, 결정 | 사용자 15~30분 | |
| Phase 1 | 수집 스크립트, 레이아웃, 상세 렌더링, Container 재작성, CI | **1~1.5일** | 실제 Notion 데이터로 블록별 렌더 결과를 육안 검증하는 시간이 가장 큼. 레이트리밋을 피하려면 수집은 1~2회만 실행하고 이후에는 생성된 JSON으로 반복 작업 |
| Phase 2 | 반응형, 게시 필터, callout, 404 | 0.5~1일 | slug 전환(D5-b)을 하면 +0.5일 |
| Phase 3 | 클래스 정리, SEO, 이미지 압축, 미구현 UI | 0.5일 | 다크모드 구현을 선택하면 +0.5~1일 |

**권장 적용 순서**: Phase 1을 하나의 브랜치/PR로 묶어 적용하고 로컬 `npm run build && npm run preview`로 검증한 뒤 배포합니다. Phase 1의 1-2(Footer)는 다른 항목과 독립적이므로 가장 먼저, 따로 적용해도 됩니다.

---

## 10. 적용 결과 (2026-11-22)

- 브랜치: `fix/blog-issues` (main에서 분기). **커밋, push, 배포는 하지 않았습니다.** 모든 변경은 작업 트리에 커밋되지 않은 상태로 남아 있습니다.
- 사용자 결정: Phase 1~3 전부 적용, D1 게시 필터는 적용하지 않음, D4 다크모드/Portfolio/TIL은 제거, 나머지는 권장안대로 적용.

### 10-1. 이슈별 처리 내용

| 이슈 | 결과 | 내용 |
|---|---|---|
| 01 | 해결 | `getStaticPaths`가 생성된 JSON 전체를 사용합니다. 상세 페이지 18/18개가 생성됩니다. |
| 02 | 해결 | `Layout.astro`: `body.min-h-screen flex flex-col` + `main.flex-1`. `height:100%`와 `h-full` 체인을 제거했습니다. |
| 03 | 해결 | `scripts/fetch-notion.js`를 `prebuild`로 연결했습니다. 커밋되어 있던 `public/posts-*.json`, `recommended.json`, `tags.json`, `public/tags/`를 삭제했고, 생성물은 `.gitignore`에 추가했습니다. |
| 04 | 해결 | `deploy.yml`: `workflow_dispatch` + 매일 18:00 UTC(03:00 KST) cron + `concurrency` + `permissions: contents: write`를 추가했습니다. |
| 05 | 해결 | 업로드 이미지/파일을 `public/notion-images/<blockId>-<경로해시>.<ext>`로 다운로드합니다(21개, 2.1MB). Actions에서는 `actions/cache`로 재사용하고, 더 이상 쓰지 않는 파일은 정리합니다. |
| 06 | 해결 | `@astrojs/markdown-remark` `createMarkdownProcessor`(GFM + raw HTML + Shiki `github-light`)로 렌더합니다. custom transformer로 image, file/pdf/video/audio, bookmark/link_preview/embed(URL 또는 caption 텍스트 링크), code(조각을 `""`로 연결, 언어 이름 매핑), callout(`<div class="callout">`, 자식 블록 포함)을 처리합니다. 토글은 빈 줄 후처리로 해결했고, rich text의 `<` `>`를 이스케이프합니다. **적용 중 추가 발견**: 표 셀 안의 줄바꿈 때문에 GFM 표가 깨지는 문제가 있어 셀의 줄바꿈은 `<br>`, `\|`는 이스케이프로 처리했습니다. 인라인 코드 앞뒤에 typography가 붙이는 백틱도 제거했습니다. |
| 07 | 해결 | 목록과 상세 모두 `created` 속성(`YYYY-MM-DD`)을 사용하고 `YYYY. MM. DD`로 표시합니다. 속성이 없으면 `created_time`을 KST 기준 날짜로 변환합니다. |
| 08 | 해결 | 태그 JSON fetch 자체를 없앴습니다. 홈은 props로 받은 배열을 메모리에서 필터링합니다. |
| 09 | 해결 | Container를 재작성했습니다. 중복 fetch와 경쟁 상태가 없어졌고, URL 쿼리(`?tag=…&page=…`)와 동기화하며 뒤로가기도 지원합니다. |
| 10 | 해결 | `pageNum === page`로 비교하고 `aria-current`, `aria-label`을 추가했습니다. 페이지가 1개뿐이면 페이지네이션을 숨깁니다. |
| 11 | 해결 | 고정 폭을 제거하고 `lg:` breakpoint를 적용했습니다(모바일에서는 사이드바가 아래로 감). 표와 코드 블록은 자체 가로 스크롤을 가집니다. viewport에 `initial-scale=1`을 추가했습니다. |
| 12 | 해결 | 빌드 중 Notion 호출을 없앴습니다. 수집 스크립트는 429/5xx에 지수 백오프로 재시도하고, 실패하면 exit 1로 빌드를 중단합니다(토큰은 출력하지 않음). 환경변수가 없을 때도 즉시 실패합니다. `src/lib/notion.js`(데드 코드와 오류 삼킴 포함)는 삭제했습니다. |
| 13 | **적용 안 함(의도)** | D1 결정에 따름. |
| 14 | 해결(slug 제외) | 제목/요약의 모든 rich text 조각을 연결합니다. `created_time`을 보조 정렬 키로 씁니다. 태그 파일이 없어져 파일명 문제도 사라졌습니다. slug는 D5에 따라 UUID를 유지합니다. |
| 15 | 해결 | 헤더에 `z-50`을 추가했습니다. 긴 글 맨 아래까지 스크롤해도 헤더 top이 0인 것을 확인했습니다. |
| 16 | 해결 | 잘못된 클래스(`m-r-`, `m-b-`, `border-lg`, 충돌하는 패딩)를 정리했습니다. `global.css`를 삭제했고, `tailwind.config.js`는 ESM import로 바꿨습니다. |
| 17 | 해결 | `lang="ko"`, favicon type, 글별 title/description, OG, canonical, `@astrojs/sitemap`(`sitemap-index.xml`), 커스텀 `404.astro`를 추가했습니다. 목록 제목은 `h2`로 바꾸고 홈에 `sr-only` `h1`을 두었습니다. alt와 aria-label을 넣고 key는 tag로 바꿨습니다. 홈 SSR HTML에 1페이지 글 10개가 포함됩니다. RSS는 넣지 않았습니다(선택 항목). |
| 18 | 해결 | 다크모드 버튼, Portfolio/TIL 버튼, `Portfolio.jsx`를 제거했습니다. 상세 페이지에 이전/다음 글과 목록 링크를 추가했고, 상세 페이지의 태그는 `/?tag=…` 링크로 연결됩니다. README를 실제 구현에 맞게 다시 썼습니다. |
| 19 | 해결 | `banner.png`(2.9MB)는 `banner.webp`(163KB)로, `portrait.png`(353KB)는 170px `portrait.webp`(1.9KB)로 바꿨습니다(sharp로 1회 변환). width/height와 lazy loading을 적용했습니다. Notion 이미지는 원본 그대로 둡니다(WebP 변환 안 함). |
| 20 | 해결(토큰 제외) | `npm ci`, npm 캐시, 이미지 캐시를 적용했습니다. 토큰 재발급은 사용자가 직접 합니다. |

### 10-2. 의존성 변경

- 추가: `@astrojs/markdown-remark@5.3.0`(고정, astro 4.16.18 내부 버전과 같음), `@astrojs/sitemap@3.2.1`(고정, Astro 4 시기인 2024-10 릴리스)
- 고정: `notion-to-md` `^3.1.8` → `3.1.8`
- 제거: `react-markdown`, `fuse.js`
- `npm install` 시 `npm audit` 경고가 나왔지만 이번 범위에서는 처리하지 않았습니다.

### 10-3. 검증 결과

로컬에서 `npm run build`(prebuild 포함)를 실행한 뒤 `astro preview`와 헤드리스 Chrome(CDP)으로 측정했습니다.

| 항목 | 결과 |
|---|---|
| Notion 수집 | 18개 글, 파일 21개. 2회 실행했고 레이트리밋 없이 완료 |
| 상세 페이지 | `dist/posts/*` 18개, preview에서 18/18 HTTP 200 |
| 이미지 | HTML 전체에서 `amazonaws`/`prod-files-secure` 0건. Toss 리뷰 이미지 9/9 로드 성공(naturalWidth > 0) |
| 표 / 체크박스 | 디자인 시스템 글: `<table>` 3개(셀 줄바꿈 표 포함), 파이프 텍스트 문단 0개, checkbox 8개 |
| 토글 | 코드 리뷰에 대한 고찰: `<details>` 2개, `&lt;details` 0건, 내부가 `<h3>`/`<ul>`로 변환됨 |
| 코드 | Shiki 하이라이트 적용(Vue/Vite 글 18블록, Lexical 5블록 등). 스크린샷으로 확인 |
| `<Component>` 텍스트 | Function components 글: `<FancyButton ref={ref}>`가 인라인 코드로 그대로 보임 |
| Footer | 긴 글(Toss): 문서 높이 10596, footer 10537~10596(맨 끝). 짧은 글: 994 / 935~994. 홈: 2283 / 2224~2283 |
| 태그 필터 | "리뷰" 3개, "번역" 2개, "React" 5개. 네트워크 요청 0건, 콘솔/HTTP 오류 0건. `?tag=리뷰`로 새로고침해도 상태 유지, 뒤로가기 동작, `?page=2`는 8개 + aria-current=2 |
| 모바일 390px | 홈과 상세(디자인 시스템) 모두 `scrollWidth 390 = innerWidth 390`(가로 넘침 없음). 스크린샷에서 잘림 없음 |
| 404 | 없는 경로에서 커스텀 404("페이지를 찾을 수 없습니다") 표시 |
| sitemap | `dist/sitemap-index.xml`, `sitemap-0.xml` 생성 |

### 10-4. 남은 문제 / 확인하지 못한 것

- **GitHub Actions에서는 실행해 보지 않았습니다**(push 금지). 첫 CI 실행에서 Secret 유효성, `npm ci`(lockfile 일치), 캐시 동작을 확인해야 합니다.
- 북마크는 텍스트 링크입니다(D6). 미리보기 카드는 구현하지 않았습니다.
- Notion 글자 색 annotation은 여전히 표현되지 않습니다.
- `?tag=…`로 직접 들어오면 SSR은 전체 목록이고, hydrate 직후 필터 결과로 바뀝니다(짧은 깜빡임).
- Browserslist(caniuse-lite) 데이터가 오래되었다는 빌드 경고가 있습니다. 동작에는 영향이 없습니다.
- RSS와 Notion 이미지 WebP 최적화는 하지 않았습니다(선택 항목).

### 10-5. 사용자가 직접 해야 할 일

1. 변경 사항을 검토한 뒤 `fix/blog-issues` 브랜치를 커밋하고 push 또는 PR로 올립니다. 삭제된 `public/*.json`, `public/tags/`, png 파일과 새로 생긴 webp 파일도 함께 커밋합니다.
2. **Notion 토큰 재발급**: `.env`와 GitHub Secret `NOTION_TOKEN`을 교체합니다.
3. GitHub Secrets `NOTION_TOKEN`, `NOTION_DATABASE_ID`가 유효한지 확인합니다.
4. Settings → Pages: Source가 `gh-pages` 브랜치 `/(root)`인지 확인합니다.
5. Settings → Actions → General: 워크플로가 `permissions: contents: write`를 명시하지만, 조직/저장소 설정에서 이를 막고 있지 않은지 확인합니다.
6. main에 병합한 뒤 Actions 탭에서 "Run workflow"로 첫 배포를 실행하고, 라이브 사이트에서 18개 글과 이미지를 확인합니다.
7. 로컬 개발 시 `npm run fetch:notion`을 먼저 실행해야 `npm run dev`가 동작합니다(README 참고).
8. 저장소에 60일 동안 커밋이 없어 cron이 비활성화되면 Actions 탭에서 다시 켭니다.
