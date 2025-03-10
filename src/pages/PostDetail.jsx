import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const tags = ["js", "js-logic"];

const PostDetail = () => {
  const { postId } = useParams();
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(`/posts/${postId}.md`)
      .then((res) => res.text())
      .then(setContent)
      .catch(console.error);
  }, [postId]);

  return (
    <div className="flex p-8 justify-center">
      <div className="w-[45%]">
        <div className="border-b mb-4">
          <h1 className="text-4xl font-bold mb-2">{postId}</h1>
          <span className="text-gray-400">2025.03.10.</span>
          <div className="flex mt-2 pb-5">
            {tags.map((tag) => (
              <div className="bg-gray-200 rounded-xl py-1 px-2 text-sm mr-2">{tag}</div>
            ))}
          </div>
        </div>
        <div className="prose prose-md mt-12">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
