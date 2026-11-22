import { useEffect, useMemo, useState } from "react";
import PostList from "./PostList";
import Sidebar from "./Sidebar";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;
const PAGES_PER_GROUP = 5;

const readQuery = () => {
  const q = new URLSearchParams(window.location.search);
  return { tag: q.get("tag") || null, page: Math.max(1, Number(q.get("page")) || 1) };
};

const Container = ({ posts = [] }) => {
  // SSR 시점에는 URL 을 모르므로 전체/1페이지로 렌더하고, hydrate 후 쿼리와 동기화한다.
  const [{ tag: activeTag, page }, setState] = useState({ tag: null, page: 1 });

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
    const qs = q.toString();
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
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

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
      <div className="mx-auto mt-6 mb-10 max-w-[1050px] h-[100px] md:h-[130px] bg-[#fcd7c3] overflow-hidden rounded-xl">
        <img
          src="/banner.webp"
          alt=""
          width="1050"
          height="130"
          className="w-full h-full object-cover"
          fetchpriority="high"
        />
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-evenly gap-10">
        <div className="w-full lg:max-w-[700px] mb-[60px] lg:px-6 min-w-0">
          {activeTag && (
            <p className="text-sm text-gray-500">
              <span className="font-bold text-lime-950">#{activeTag}</span> 태그 글{" "}
              {filtered.length}개
            </p>
          )}
          <PostList posts={visible} />
          <Pagination
            startPage={startPage}
            endPage={endPage}
            totalPages={totalPages}
            navigatePage={navigatePage}
            page={current}
          />
        </div>
        <Sidebar
          tags={tags}
          recommended={recommended}
          selectTag={selectTag}
          activeTag={activeTag}
        />
      </div>
    </div>
  );
};

export default Container;
