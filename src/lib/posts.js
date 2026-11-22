// scripts/fetch-notion.js 가 만든 src/generated/posts.json 을 읽습니다.
// 빌드 중에는 Notion API를 호출하지 않습니다.
import fs from "node:fs";
import path from "node:path";

let cache;

export function getAllPosts() {
  if (cache) return cache;
  const file = path.resolve("src/generated/posts.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "src/generated/posts.json 이 없습니다. `npm run fetch:notion` 을 먼저 실행하세요."
    );
  }
  cache = JSON.parse(fs.readFileSync(file, "utf-8"));
  return cache;
}

export const postUrl = (id) => `/posts/${id}/`;

/** 목록용 메타데이터 (본문 제외) */
export function getPostSummaries() {
  return getAllPosts().map(({ markdown, ...meta }) => ({ ...meta, url: postUrl(meta.id) }));
}

/** YYYY-MM-DD → YYYY. MM. DD */
export const formatDate = (date) => (date ? date.replaceAll("-", ". ") : "");
