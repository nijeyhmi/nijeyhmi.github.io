import fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config(); // .env 파일에서 토큰 불러오기

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;
const pageSize = 10;
const outDir = path.resolve("public");

async function generate() {
  const allPages = [];
  let cursor = undefined;
  let pageIndex = 1;

  while (true) {
    const res = await notion.databases.query({
      database_id: databaseId,
      page_size: pageSize,
      start_cursor: cursor,
      sorts: [
        {
          property: "created",
          direction: "descending",
        },
      ],
    });

    const posts = res.results.map((page) => ({
      id: page.id,
      title: page.properties.title?.title?.[0]?.plain_text ?? "",
      tags: page.properties.tags?.multi_select.map((tag) => tag.name) ?? [],
      summary: page.properties.summary?.rich_text?.[0]?.plain_text ?? "",
      created: page.properties.created?.date?.start ?? null,
      isRecommended: page.properties.isRecommended?.checkbox ?? false,
      url: `/posts/${page.id}`,
    }));

    // 각 페이지 결과 누적
    allPages.push(posts);

    fs.writeFileSync(
      path.join(outDir, `posts-page-${pageIndex}.json`),
      JSON.stringify(posts, null, 2),
      "utf-8"
    );

    console.log(`✅ 페이지 ${pageIndex} 생성 완료 (${posts.length}개)`);

    if (!res.has_more) break;
    cursor = res.next_cursor;
    pageIndex++;
  }

  // 추천글 저장
  const recommended = allPages.flat().filter((post) => post.isRecommended);
  fs.writeFileSync(
    path.join(outDir, "recommended.json"),
    JSON.stringify(recommended, null, 2),
    "utf-8"
  );
  console.log(`✅ 추천글 ${recommended.length}개 저장 완료`);

  // 총 개수 저장
  const totalCount = allPages.flat().length;
  fs.writeFileSync(
    path.join(outDir, "posts-meta.json"),
    JSON.stringify({ total: totalCount }, null, 2),
    "utf-8"
  );
  console.log(`✅ 전체 글 수 ${totalCount}개 저장 완료`);

  const tagMap = {};

  for (const post of allPages.flat()) {
    for (const tag of post.tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(post);
    }
  }

  const tagsDir = path.join(outDir, "tags");
  if (!fs.existsSync(tagsDir)) {
    fs.mkdirSync(tagsDir);
  }

  for (const [tag, posts] of Object.entries(tagMap)) {
    const safeTag = tag;
    fs.writeFileSync(
      path.join(tagsDir, `${safeTag}.json`),
      JSON.stringify(posts, null, 2),
      "utf-8"
    );
    console.log(`🏷️ 태그 "${tag}" 저장 완료 (${posts.length}개)`);
  }

  const tagSet = new Set();

  for (const post of allPages.flat()) {
    post.tags.forEach((tag) => tagSet.add(tag));
  }

  fs.writeFileSync(
    path.join(outDir, "tags.json"),
    JSON.stringify([...tagSet], null, 2),
    "utf-8"
  );
  console.log(`🏷️ 전체 태그 ${tagSet.size}개 저장 완료`);
}

generate().catch((err) => {
  console.error("❌ 생성 실패:", err);
  process.exit(1);
});
