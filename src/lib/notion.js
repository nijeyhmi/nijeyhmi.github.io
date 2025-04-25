import { Client } from '@notionhq/client';

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

export async function getPostsFromNotion() {
  const response = await notion.databases.query({
    database_id: import.meta.env.NOTION_DATABASE_ID,
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
    url: `/posts/${page.id}`, // 또는 slug로 경로 만들기
  }));
}

export async function getPostDetail(pageId) {
  // 1. 메타 정보 가져오기
  const page = await notion.pages.retrieve({ page_id: pageId });

  const title = page.properties.title?.title?.[0]?.plain_text ?? '제목 없음';

  const created = page.created_time
    ? new Date(page.created_time).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : null;

  const tags = page.properties.tags?.multi_select.map((tag) => tag.name) ?? [];

  // 2. 블록 내용 가져오기
  const content = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const blocks = content.results;

  return {
    title,
    created,
    tags,
    blocks,
  };
}
