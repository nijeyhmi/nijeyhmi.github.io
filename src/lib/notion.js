import { NotionToMarkdown } from 'notion-to-md';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

export async function getPostsFromNotion() {
  try {
    const response = await notion.databases.query({
      database_id: import.meta.env.NOTION_DATABASE_ID,
      sorts: [
        {
          property: 'created',
          direction: 'descending',
        },
      ],
    });

    return response.results.map((page) => ({
      id: page.id,
      title: page.properties.title?.title?.[0]?.plain_text ?? '',
      tags: page.properties.tags?.multi_select.map((tag) => tag.name) ?? [],
      summary: page.properties.summary?.rich_text?.[0]?.plain_text ?? '',
      created: page.properties.created?.date?.start
        ? new Date(page.properties.created.date.start).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : null,
      isRecommended: page.properties.isRecommended?.checkbox ?? false,
      url: `/posts/${page.id}`,
    }));
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

export async function getPostDetail(pageId) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);

  const title = page.properties.title?.title?.[0]?.plain_text ?? '제목 없음';

  const created = page.created_time
    ? new Date(page.created_time).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : null;

  const tags = page.properties.tags?.multi_select.map((tag) => tag.name) ?? [];

  return {
    title,
    created,
    tags,
    mdContent: mdString.parent,
  };
}
