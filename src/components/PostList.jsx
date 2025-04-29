const PostList = ({ posts }) => {
  return (
    <div className="w-full max-w-[700px] m-b-[60px] px-[24px] min-h-[47px]">
      <div className="flex items-center flex-col justify-start">
        <ul className="w-full pt-[10px]">
          {posts?.map((post) => (
            <li key={post.id}>
              <a href={post.url} className="flex justify-start items-center w-full py-[24px]">
                <div className="flex flex-col mb-auto pr-[20px]">
                  <div className="flex mb-3">
                    {post?.tags.map((tag) => (
                      <div className="bg-gray-100 rounded-lg py-1 px-2 text-sm mr-2">{tag}</div>
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold mb-2 hover:text-gray-700 hover:cursor-pointer">
                    {post.title}
                  </h1>
                  <div className="my-2">{post.summary}</div>
                  <span className="text-gray-400">{post.created}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PostList;
