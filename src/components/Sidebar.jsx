import { FaGithub, FaLinkedin } from "react-icons/fa";

const Sidebar = ({ tags = [], recommended = [], selectTag, activeTag }) => {
  return (
    <aside className="w-full lg:w-[300px] shrink-0 mb-[100px] pb-[50px] pt-6 border-t-2 lg:pt-0 lg:px-6 lg:border-t-0 lg:border-l-2">
      {/* 추천글 */}
      <section>
        <h2 className="font-bold text-gray-500">Recommended</h2>
        {recommended.map((post) => (
          <article key={post.id}>
            <a href={post.url} className="flex flex-col py-[12px]">
              <span className="font-bold">{post.title}</span>
              <span className="mt-[3px] text-[14px]">{post.summary}</span>
            </a>
          </article>
        ))}
      </section>
      {/* 태그 */}
      <section className="mt-[24px]">
        <h2 className="font-bold text-gray-500">Tag</h2>
        <ul className="mt-[12px] flex flex-wrap gap-x-[6px] gap-y-[8px]">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-pressed={activeTag === tag}
                className={`px-[10px] py-1 inline-flex justify-center items-center rounded-2xl text-lime-950 font-bold text-sm ${activeTag === tag ? "bg-green-300" : "bg-green-50"}`}
                onClick={() => selectTag(tag)}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {/* About */}
      <section className="mt-[24px]">
        <h2 className="font-bold text-gray-500">About</h2>
        <div className="flex items-center mt-2">
          <img
            src="/portrait.webp"
            alt="녜진(nijeyhmi) 프로필 사진"
            width="85"
            height="85"
            loading="lazy"
            className="w-[85px] h-[85px] rounded-full mr-[15px] object-cover"
          />
          <div className="inline-flex flex-col justify-start">
            <span className="font-bold">녜진(nijeyhmi)</span>
            <div className="inline-flex flex-row mt-[12px]">
              <a href="https://github.com/nijeyhmi?tab=repositories" aria-label="GitHub">
                <FaGithub className="w-6 h-6" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/%ED%98%9C%EC%A7%84-%EA%B6%8C-b55915194/"
                className="ml-[6px]"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-6 h-6" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
};

export default Sidebar;
