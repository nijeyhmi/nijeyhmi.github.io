import PostList from "./PostList";
import Sidebar from "./Sidebar";
import Pagination from "./Pagination";
import { useEffect, useState } from "react";

const Container = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    fetch("/tags.json")
      .then((res) => res.json())
      .then((data) => setTags(data));
  }, []);

  useEffect(() => {
    if (activeTag) {
      const tagKey = activeTag.toLowerCase().replace(/[^a-z0-9-_]/gi, "");
      fetch(`/tags/${tagKey}.json`)
        .then((res) => res.json())
        .then((data) => {
          setTotal(data.length); // ✅ 태그 글 수 기반으로 total 갱신
          const startIdx = (page - 1) * pageSize;
          const paginated = data.slice(startIdx, startIdx + pageSize);
          setPosts(paginated);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
    } else {
      // 전체 글일 때는 페이지 JSON 단위로 fetch
      fetch(`/posts-page-${page}.json`)
        .then((res) => res.json())
        .then((data) => setPosts(data));

      fetch(`/posts-meta.json`)
        .then((res) => res.json())
        .then((data) => setTotal(data.total));
    }
  }, [activeTag, page]);

  useEffect(() => {
    fetch("/posts-meta.json")
      .then((res) => res.json())
      .then((data) => {
        setTotal(data.total);
      });
  }, []);

  const pageSize = 10;
  const pagesPerGroup = 5;

  const currentGroup = Math.floor((page - 1) / pagesPerGroup);
  const startPage = currentGroup * pagesPerGroup + 1;
  const totalPages = Math.ceil(total / pageSize || 1);
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages); // ✅ 이걸로 고쳐야 해

  const navigatePage = (page) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectTag = (tag) => {
    if (activeTag === tag) {
      setActiveTag(null);
      setPage(1);
      fetch(`/posts-page-1.json`)
        .then((res) => res.json())
        .then((data) => setPosts(data));

      fetch(`/posts-meta.json`)
        .then((res) => res.json())
        .then((data) => setTotal(data.total));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const tagKey = encodeURIComponent(tag.toLowerCase());
      fetch(`/tags/${tagKey}.json`)
        .then((res) => res.json())
        .then((data) => {
          setActiveTag(tag);
          setPosts(data);
          setPage(1);
          setTotal(data.length);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
  };

  return (
    <div className="flex items-start flex-row justify-center px-[24px]">
      <div className="w-[1200px] min-h-[95vh]">
        <div className="flex justify-center items-center border-lg mx-auto mt-[24px] mb-[40px] max-w-[1050px] relative h-[130px] bg-[#fcd7c3] overflow-hidden rounded-xl">
          <img src="/banner.png" alt="" />
        </div>
        <div className="flex justify-evenly min-h-[50px]">
          <div className="w-full max-w-[700px] m-b-[60px] px-[24px] min-h-[47px]">
            <PostList posts={posts} />
            <Pagination
              startPage={startPage}
              endPage={endPage}
              totalPages={totalPages}
              navigatePage={navigatePage}
              page={page}
            />
          </div>
          <Sidebar tags={tags} selectTag={selectTag} activeTag={activeTag} />
        </div>
      </div>
    </div>
  );
};

export default Container;
