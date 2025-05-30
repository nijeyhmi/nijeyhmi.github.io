import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
const Sidebar = ({ tags, selectTag, activeTag }) => {
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  useEffect(() => {
    fetch("/recommended.json")
      .then((res) => res.json())
      .then((data) => {
        setRecommendedPosts(data);
      });
  }, []);

  return (
    <div className="mb-[100px] pt-0 px-[24px] pb-[50px] border-l-2">
      {/* 추천글 */}
      <div className="w-[300px]">
        <span className="font-bold text-gray-500">Recommended</span>
        {recommendedPosts.map((post) => {
          return (
            <article key={post.id}>
              <a href={post.url}>
                <div className="flex flex-col py-[12px]">
                  <span className="font-bold">{post.title}</span>
                  <span className="mt-[3px] text-[14px]">{post.summary}</span>
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
          {tags.map((tag, idx) => {
            return (
              <div
                className="mr-[6px] mb-[8px] inline-block hover:cursor-pointer"
                key={idx}
              >
                <button
                  className={`pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl text-lime-950 font-bold text-sm ${activeTag === tag ? " bg-green-300" : " bg-green-50"}`}
                  onClick={() => selectTag(tag)}
                >
                  {tag}
                </button>
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
                  <a href="https://github.com/nijeyhmi?tab=repositories">
                    <FaGithub className="w-6 h-6 hover:cursor-pointer" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/%ED%98%9C%EC%A7%84-%EA%B6%8C-b55915194/"
                    className="ml-[6px]"
                  >
                    <FaLinkedin className="w-6 h-6 hover:cursor-pointer" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <ul className="flex flex-row">
            <li className="pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl bg-green-50">
              Portfolio
            </li>
            <li className="ml-[6px] pl-[10px] pr-[8px] py-[4px] px-[10px] inline-flex justify-center items-center rounded-2xl bg-green-50">
              TIL
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
