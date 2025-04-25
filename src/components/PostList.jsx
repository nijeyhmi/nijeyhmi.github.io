const PostList = ({ posts }) => {
  return (
    <div className="px-8 w-[50%] mx-auto">
      <div className="w-full bg-yellow-200 h-40 mb-20 rounded-lg"></div>
      {posts?.map((post) => (
        <div className="flex justify-between h-32 mb-16">
          <ul>
            <li key={post.id}>
              <div className="flex mb-3">
                {post?.tags.map((tag) => (
                  <div className="bg-gray-100 rounded-lg py-1 px-2 text-sm mr-2">{tag}</div>
                ))}
              </div>
              <a href={post.url}>
                <h1 className="text-2xl font-bold mb-2 hover:text-gray-700 hover:cursor-pointer">
                  {post.title}
                </h1>
              </a>
              <div className="my-2">{post.summary}</div>
              <span className="text-gray-400">{post.created}</span>
            </li>
          </ul>
          <div className="w-40 bg-yellow-200 h-full rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};

export default PostList;
