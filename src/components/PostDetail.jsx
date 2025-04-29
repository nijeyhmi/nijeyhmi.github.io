import ReactMarkdown from 'react-markdown';
const PostDetail = ({ content }) => {
  return (
    <div className="max-w-full w-full h-full mx-auto">
      <div className="max-w-full w-full h-full mx-auto">
        <div className="flex items-start flex-row justify-center px-[24px]">
          <div className="w-[1050px] min-h-[100vh]">
            <div className="border-b mb-[40px] pt-[24px]">
              <h1 className="text-4xl font-bold mb-2">{content.title}</h1>
              <span className="text-gray-400">{content.created}</span>
              <div className="flex mt-2 pb-5">
                {content.tags.map((tag) => (
                  <div className="bg-gray-200 rounded-xl py-1 px-2 text-sm mr-2">{tag}</div>
                ))}
              </div>
            </div>
            <div className="mt-12 prose prose-neutral max-w-none">
              <ReactMarkdown>{content.mdContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
