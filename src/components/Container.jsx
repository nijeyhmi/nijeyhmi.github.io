import PostList from './PostList';
import Sidebar from './Sidebar';

const Container = ({ posts, recommendedPosts }) => {
  const allTags = posts.flatMap((post) => post.tags.map((tag) => tag));
  const tags = [...new Set(allTags)];
  return (
    <div className="max-w-full w-full h-full m-auto">
      <div className="max-w-full w-full h-full mx-auto">
        <div className="flex items-start flex-row justify-center px-[24px]">
          <div className="w-[1200px] min-h-[100vh]">
            <div className="flex justify-center items-center border-lg mx-auto mt-[24px] mb-[40px] max-w-[1050px] relative h-[130px] bg-[#fcd7c3] overflow-hidden rounded-xl">
              <img src="/banner.png" alt="" />
            </div>
            <div className="flex justify-evenly min-h-[50px]">
              <PostList posts={posts} />
              <Sidebar tags={tags} recommendedPosts={recommendedPosts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Container;
