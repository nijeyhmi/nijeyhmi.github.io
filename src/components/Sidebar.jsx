import { FaGithub } from 'react-icons/fa';
import { FaLinkedin } from 'react-icons/fa';
const Sidebar = ({ tags, recommendedPosts }) => {
  return (
    <div className="mb-[100px] pt-0 px-[24px] pb-[50px] border-l-2">
      {/* 최신글 */}
      <div className="w-[300px]">
        <span className="font-bold text-gray-500">Recommended</span>
        {recommendedPosts.map((post) => {
          return (
            <article>
              <a href={post.url}>
                <div className="flex flex-col py-[12px]">
                  <span className="font-bold text-[14px]">{post.title}</span>
                  <span className="mt-[3px]">{post.summary}</span>
                </div>
              </a>
            </article>
          );
        })}
      </div>
      {/* 태그 */}
      <div className="w-[300px] mt-[24px]">
        <span className="font-bold text-gray-500">Tag</span>
        <div className="relative mt-[12px]">
          {tags.map((tag) => {
            return (
              <div className="mr-[6px] mb-[8px] inline-block hover:cursor-pointer">
                <span className="pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl bg-gray-100">
                  {tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* About  */}
      <div className="w-[300px] mt-[24px]">
        <span className="font-bold text-gray-500">About</span>
        <div className="">
          <div className="flex">
            <div className="inline-flex justify-center items-center align-top mr-[8px]">
              <div className="w-[85px] h-[85px] rounded-full mr-[15px]">
                <img src="/portrait.png" alt="" />
              </div>
              <div className="inline-flex flex-col justify-start">
                <span className="font-bold">녜진(nijeyhmi)</span>
                <div className="inline-flex flex-row mt-[12px]">
                  <a href="">
                    <FaGithub className="w-6 h-6 hover:cursor-pointer" />
                  </a>
                  <a href="" className="ml-[6px]">
                    <FaLinkedin className="w-6 h-6 hover:cursor-pointer" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <ul className="flex flex-row">
            <li className="pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl bg-gray-100">
              Portfolio
            </li>
            <li className="ml-[6px] pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl bg-gray-100">
              TIL
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
