import { NotionToMarkdown } from "notion-to-md";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

export async function getPosts({
  pageSize = 10,
  startCursor = undefined,
} = {}) {
  try {
    const response = await notion.databases.query({
      database_id: import.meta.env.NOTION_DATABASE_ID,
      page_size: pageSize,
      start_cursor: startCursor,
      sorts: [
        {
          property: "created",
          direction: "descending",
        },
      ],
    });

    const posts = response.results.map((page) => ({
      id: page.id,
      title: page.properties.title?.title?.[0]?.plain_text ?? "",
      tags: page.properties.tags?.multi_select.map((tag) => tag.name) ?? [],
      summary: page.properties.summary?.rich_text?.[0]?.plain_text ?? "",
      created: page.properties.created?.date?.start
        ? new Date(page.properties.created.date.start).toLocaleDateString(
            "ko-KR",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          )
        : null,
      isRecommended: page.properties.isRecommended?.checkbox ?? false,
      url: `/posts/${page.id}`,
    }));

    return {
      posts,
      hasMor: response.has_more,
      nextCursor: response.next_cursor,
    };
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export async function getPostDetail(pageId) {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);

    const title = page.properties.title?.title?.[0]?.plain_text ?? "제목 없음";

    const created = page.created_time
      ? new Date(page.created_time).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : null;

    const tags =
      page.properties.tags?.multi_select.map((tag) => tag.name) ?? [];

    return {
      title,
      created,
      tags,
      mdContent: mdString.parent,
    };
  } catch (error) {
    console.error("Failed to fetch detail post:", error);
    return {};
  }
}

export async function getRecommendedPosts() {
  try {
    const response = await notion.databases.query({
      database_id: import.meta.env.NOTION_DATABASE_ID,
      filter: {
        property: "isRecommended",
        checkbox: { equals: true },
      },
      sorts: [
        {
          property: "created",
          direction: "descending",
        },
      ],
    });

    return response.results.map((page) => ({
      id: page.id,
      title: page.properties.title?.title?.[0]?.plain_text ?? "",
      tags: page.properties.tags?.multi_select.map((tag) => tag.name) ?? [],
      summary: page.properties.summary?.rich_text?.[0]?.plain_text ?? "",
      created: page.properties.created?.date?.start
        ? new Date(page.properties.created.date.start).toLocaleDateString(
            "ko-KR",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          )
        : null,
      isRecommended: page.properties.isRecommended?.checkbox ?? false,
      url: `/posts/${page.id}`,
    }));
  } catch (error) {
    console.error("Failed to fetch recommended post:", error);
    return [];
  }
}

export async function getCursorForPage(page, pageSize = 10) {
  if (page < 2) return undefined;

  let cursor = undefined;

  for (let i = 1; i < page; i++) {
    const res = await notion.databases.query({
      database_id: import.meta.env.NOTION_DATABASE_ID,
      page_size: pageSize,
      start_cursor: cursor,
      sorts: [
        {
          property: "created",
          direction: "descending",
        },
      ],
    });

    if (!res.has_more) return undefined;
    cursor = res.next_cursor;
  }

  return cursor;
}
