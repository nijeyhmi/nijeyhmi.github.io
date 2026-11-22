const formatDate = (date) => (date ? date.replaceAll("-", ". ") : "");

const PostList = ({ posts = [] }) => {
  if (posts.length === 0) {
    return <p className="py-[24px] text-gray-500">글이 없습니다.</p>;
  }
  return (
    <ul className="w-full pt-[10px]">
      {posts.map((post) => (
        <li key={post.id}>
          <a href={post.url} className="flex flex-col w-full py-[24px] group">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    className="bg-green-50 text-lime-950 font-bold rounded-lg py-1 px-2 text-sm"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-bold mb-2 break-keep group-hover:text-gray-700">
              {post.title}
            </h2>
            {post.summary && <p className="my-2">{post.summary}</p>}
            <time dateTime={post.date} className="text-gray-400">
              {formatDate(post.date)}
            </time>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default PostList;
