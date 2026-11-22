// Astro 의 Markdown 파이프라인(GFM + raw HTML + Shiki)으로 Notion Markdown을 HTML로 변환합니다.
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

let processor;

export async function renderMarkdown(md) {
  processor ??= createMarkdownProcessor({
    gfm: true,
    smartypants: false,
    syntaxHighlight: "shiki",
    shikiConfig: { theme: "github-light", wrap: false },
  });
  const { code } = await (await processor).render(md ?? "");
  return code;
}
