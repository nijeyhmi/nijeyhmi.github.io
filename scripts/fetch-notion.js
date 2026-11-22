// Notion DB의 모든 글을 한 번에 가져와 src/generated/posts.json 으로 저장합니다.
// - DB 전체 페이지네이션
// - 429/5xx 재시도
// - Notion 업로드 파일(서명 URL, 1시간 만료)을 public/notion-images/ 로 다운로드
// `npm run build` 전에 prebuild 로 자동 실행됩니다.
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Client, APIErrorCode, isNotionClientError } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("❌ NOTION_TOKEN / NOTION_DATABASE_ID 환경변수가 없습니다.");
  process.exit(1);
}

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "public", "notion-images");
const IMG_URL = "/notion-images";
const OUT = path.join(ROOT, "src", "generated", "posts.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RETRYABLE = new Set([
  APIErrorCode.RateLimited,
  APIErrorCode.ServiceUnavailable,
  APIErrorCode.InternalServerError,
  "notionhq_client_request_timeout",
]);

async function withRetry(fn, tries = 6) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const retryable = isNotionClientError(e) && RETRYABLE.has(e.code);
      if (!retryable || i >= tries - 1) throw e;
      const retryAfter = Number(e.headers?.get?.("retry-after"));
      const wait = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** i;
      console.warn(`⏳ ${e.code} → ${wait}ms 후 재시도 (${i + 1}/${tries - 1})`);
      await sleep(wait);
    }
  }
}

const plain = (rt = []) => rt.map((t) => t.plain_text).join("");

// raw HTML을 허용하므로 본문 텍스트의 < > 는 이스케이프한다. (인라인 code 서식은 제외)
const escapeRichText = (rt) => {
  if (!Array.isArray(rt)) return;
  for (const t of rt) {
    if (t.annotations?.code || typeof t.plain_text !== "string") continue;
    t.plain_text = t.plain_text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};

const notion = new Client({ auth: NOTION_TOKEN });

// notion-to-md 3.1.8은 notionClient.blocks.children.list 만 사용한다.
// 이 호출을 감싸서 재시도와 이스케이프를 적용한다.
const n2mClient = {
  blocks: {
    children: {
      list: async (args) => {
        const res = await withRetry(() => notion.blocks.children.list(args));
        for (const b of res.results) {
          if (b.type === "code") continue;
          const body = b[b.type];
          escapeRichText(body?.rich_text);
          if (b.type === "table_row") {
            // 표 셀 안의 줄바꿈과 | 는 GFM 표를 깨뜨리므로 <br>, \| 로 바꾼다.
            for (const cell of body.cells) {
              escapeRichText(cell);
              for (const t of cell) {
                t.plain_text = t.plain_text.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
              }
            }
          }
        }
        return res;
      },
    },
  },
};
const n2m = new NotionToMarkdown({ notionClient: n2mClient });

// ---------- 파일 다운로드 ----------
const usedFiles = new Set();

async function download(url, blockId) {
  const u = new URL(url);
  const ext = (path.extname(decodeURIComponent(u.pathname)) || ".bin").toLowerCase();
  // 서명 쿼리를 뺀 S3 경로 해시: 같은 블록에서 파일을 교체하면 이름이 바뀐다.
  const hash = crypto.createHash("sha1").update(u.pathname).digest("hex").slice(0, 8);
  const file = `${blockId}-${hash}${ext}`;
  const dest = path.join(IMG_DIR, file);
  usedFiles.add(file);
  try {
    await fs.access(dest);
    return `${IMG_URL}/${file}`;
  } catch {}
  for (let i = 0; ; i++) {
    const res = await fetch(url);
    if (res.ok) {
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return `${IMG_URL}/${file}`;
    }
    if (i >= 2) throw new Error(`파일 다운로드 실패 (HTTP ${res.status}): block ${blockId}`);
    await sleep(1000 * 2 ** i);
  }
}

const escapeAlt = (s) => s.replace(/[\[\]\n]/g, " ").trim();

// ---------- custom transformers ----------
n2m.setCustomTransformer("image", async (block) => {
  const img = block.image;
  const src = img.type === "file" ? await download(img.file.url, block.id) : img.external.url;
  return `![${escapeAlt(plain(img.caption))}](${src})`;
});

for (const type of ["file", "pdf", "video", "audio"]) {
  n2m.setCustomTransformer(type, async (block) => {
    const body = block[type];
    if (body.type !== "file") return undefined; // external 은 기본 처리
    const src = await download(body.file.url, block.id);
    const name = escapeAlt(plain(body.caption)) || body.name || path.basename(src);
    if (type === "video") return `<video controls src="${src}"></video>`;
    return `[${name}](${src})`;
  });
}

for (const type of ["bookmark", "link_preview", "embed"]) {
  n2m.setCustomTransformer(type, async (block) => {
    const { url, caption } = block[type];
    if (!url) return "";
    return `[${escapeAlt(plain(caption)) || url}](${url})`;
  });
}

const LANG_ALIAS = {
  "plain text": "plaintext",
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
  "objective-c": "objc",
  "visual basic": "vb",
  "vb.net": "vb",
  "java/c/c++/c#": "java",
  markup: "html",
  webassembly: "wasm",
  "notion formula": "plaintext",
  mermaid: "mermaid",
};

n2m.setCustomTransformer("code", async (block) => {
  const code = block.code.rich_text.map((t) => t.plain_text).join("");
  const raw = (block.code.language || "plaintext").toLowerCase();
  const lang = LANG_ALIAS[raw] ?? raw.replace(/\s+/g, "");
  const fence = code.includes("```") ? "````" : "```";
  return `${fence}${lang}\n${code}\n${fence}`;
});

n2m.setCustomTransformer("callout", async (block) => {
  const { icon, rich_text } = block.callout;
  const emoji = icon?.type === "emoji" ? icon.emoji : "💡";
  const text = await n2m.blockToMarkdown({ type: "paragraph", paragraph: { rich_text } });
  let childMd = "";
  if (block.has_children) {
    const children = [];
    let cursor;
    do {
      const res = await n2mClient.blocks.children.list({ block_id: block.id, start_cursor: cursor });
      children.push(...res.results);
      cursor = res.next_cursor ?? undefined;
    } while (cursor);
    const mdBlocks = await n2m.blocksToMarkdown(children);
    childMd = n2m.toMarkdownString(mdBlocks).parent ?? "";
  }
  return `<div class="callout"><span class="callout-icon">${emoji}</span><div class="callout-body">\n\n${text}\n\n${childMd.trim()}\n\n</div></div>`;
});

// n2m 의 toggle 출력은 <summary> 뒤에 빈 줄이 없어서 안쪽 Markdown이 변환되지 않는다.
const fixToggle = (md) =>
  md
    .replace(/(<summary>[\s\S]*?<\/summary>)\n/g, "$1\n\n")
    .replace(/\n<\/details>/g, "\n\n</details>");

const kstDate = (iso) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(iso));

const toDate = (page) => {
  const start = page.properties.created?.date?.start;
  if (!start) return kstDate(page.created_time);
  return start.length <= 10 ? start : kstDate(start);
};

async function queryAll() {
  const pages = [];
  let cursor;
  do {
    const res = await withRetry(() =>
      notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
        // 게시 상태 필터는 의도적으로 적용하지 않음 (DB의 모든 글을 공개)
        sorts: [
          { property: "created", direction: "descending" },
          { timestamp: "created_time", direction: "descending" },
        ],
      })
    );
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function main() {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(path.dirname(OUT), { recursive: true });

  const pages = await queryAll();
  console.log(`📚 Notion DB: ${pages.length}개 글`);

  const posts = [];
  for (const page of pages) {
    const p = page.properties;
    const title = plain(p.title?.title) || "제목 없음";
    const blocks = await n2m.pageToMarkdown(page.id);
    const markdown = fixToggle(n2m.toMarkdownString(blocks).parent ?? "");
    posts.push({
      id: page.id,
      title,
      summary: plain(p.summary?.rich_text),
      tags: p.tags?.multi_select?.map((t) => t.name) ?? [],
      date: toDate(page),
      isRecommended: p.isRecommended?.checkbox ?? false,
      markdown,
    });
    console.log(`  ✓ [${posts.length}/${pages.length}] ${title}`);
  }

  // 더 이상 쓰지 않는 다운로드 파일 정리
  for (const file of await fs.readdir(IMG_DIR)) {
    if (!usedFiles.has(file)) await fs.rm(path.join(IMG_DIR, file));
  }

  await fs.writeFile(OUT, JSON.stringify(posts, null, 2), "utf-8");
  console.log(`✅ ${path.relative(ROOT, OUT)} 저장 (글 ${posts.length}개, 파일 ${usedFiles.size}개)`);
}

main().catch((err) => {
  // 토큰이 출력되지 않도록 메시지와 코드만 출력
  console.error("❌ Notion 수집 실패:", err?.code ?? "", err?.message ?? err);
  process.exit(1);
});
