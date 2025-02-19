import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const PostList = () => {
  const { categoryName } = useParams();
  const [posts, setPosts] = useState();

  useEffect(() => {
    fetch("./posts.json")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("error loading post list:", err));
  }, []);

  return (
    <div className="flex-1 p-8 mx-64">
      <h1 className="text-2xl font-bold mb-4">{categoryName ? categoryName : "전체"}</h1>
      <ul>
        {posts?.map((post) => (
          <li key={post.id} className="mb-2">
            <Link to={`/post/${post.id}`} className="text-gray-700 hover:text-black">
              {post.title} - {post.date}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostList;
