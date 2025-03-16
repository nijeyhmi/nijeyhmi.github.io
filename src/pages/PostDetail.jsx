import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const tags = ["js", "js-logic"];

const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState("");

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/posts.json`) // ✅ JSON 파일에서 포스트 데이터 불러오기
      .then((res) => res.json())
      .then((posts) => {
        const foundPost = posts.find((p) => p.id === postId);
        setPost(foundPost);
      })
      .catch(console.error);
  }, [postId]);

  return (
    <div className="flex p-8 justify-center">
      <div className="w-[45%]">
        <div className="border-b mb-4">
          <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
          <span className="text-gray-400">{post.date}</span>
          <div className="flex mt-2 pb-5">
            {tags.map((tag) => (
              <div className="bg-gray-200 rounded-xl py-1 px-2 text-sm mr-2">
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="prose prose-md mt-12">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
