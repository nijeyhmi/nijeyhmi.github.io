import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const PostDetail = () => {
  const { postId } = useParams();
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(`/posts/${postId}.md`)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Error loading post:", err));
  }, [postId]);

  return (
    <div className="flex-1 p-8 mx-64">
      <h1>{postId}</h1>
      <p>{content}</p>
    </div>
  );
};

export default PostDetail;
