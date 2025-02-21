import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="flex-1 p-8 mx-64">
      <div className="h-14 border-b mb-4">
        <h1 className="text-4xl font-bold">{postId}</h1>
      </div>
      <div className="prose prose-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default PostDetail;
