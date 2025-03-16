import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PostList = () => {
  const [posts, setPosts] = useState();

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/posts.json`)
      .then((res) => res.json())
      .then((data) => {
        const sortedPosts = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setPosts(sortedPosts);
      })
      .catch((err) => console.error("error loading post list:", err));
  }, []);

  const stripMarkdown = (markdown) => {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
      .replace(/(`{1,3})(.*?)\1/g, "$2")
      .replace(/>\s?/g, "")
      .replace(/[*_~`]/g, "")
      .replace(/^#+\s/gm, "")
      .replace(/-{3,}/g, "")
      .replace(/\n+/g, " ")
      .trim();
  };

  return (
    <div className="flex p-8 justify-center">
      {/* <h1 className="text-2xl font-bold mb-4">{categoryName ? categoryName : "전체"}</h1> */}
      <ul className="w-[45%]">
        {posts?.map((post) => (
          <li key={post.id} className="mb-10">
            <Link to={`/post/${post.id}`}>
              <h1 className="text-3xl font-bold mb-2 hover:text-gray-700">
                {post.title}
              </h1>
            </Link>
            <span className="text-gray-400">{post.date}</span>
            <div className="my-2">
              {stripMarkdown(post.content).slice(1, 400) + "..."}
            </div>
            <div className="flex">
              {post?.tags.map((tag) => (
                <div className="bg-gray-100 rounded-xl py-1 px-2 text-sm mr-2">
                  {tag}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostList;
