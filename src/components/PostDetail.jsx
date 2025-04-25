const PostDetail = ({ content }) => {
  function renderRichText(richTexts) {
    return richTexts.map((text, index) => {
      const { annotations, href, plain_text } = text;

      const style = {
        fontWeight: annotations.bold ? 'bold' : 'normal',
        fontStyle: annotations.italic ? 'italic' : 'normal',
        textDecoration: [
          annotations.underline ? 'underline' : '',
          annotations.strikethrough ? 'line-through' : '',
        ].join(' '),
        backgroundColor: annotations.color.includes('_background')
          ? annotations.color.replace('_background', '')
          : undefined,
        color:
          annotations.color !== 'default' && !annotations.color.includes('_background')
            ? annotations.color
            : undefined,
      };

      if (href) {
        return (
          <a key={index} href={href} style={style}>
            {plain_text}
          </a>
        );
      }

      return (
        <span key={index} style={style}>
          {plain_text}
        </span>
      );
    });
  }

  function renderBlock(block) {
    switch (block.type) {
      case 'paragraph':
        return <p>{renderRichText(block.paragraph.rich_text)}</p>;
      case 'heading_1':
        return <h1>{renderRichText(block.heading_1.rich_text)}</h1>;
      case 'bulleted_list_item':
        return <li>{renderRichText(block.bulleted_list_item.rich_text)}</li>;
      case 'code':
        return (
          <pre>
            <code>{renderRichText(block.code.rich_text)}</code>
          </pre>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex p-8 justify-center">
      <div className="w-[45%]">
        <div className="border-b mb-4">
          <h1 className="text-4xl font-bold mb-2">{content.title}</h1>
          <span className="text-gray-400">{content.created}</span>
          <div className="flex mt-2 pb-5">
            {content.tags.map((tag) => (
              <div className="bg-gray-200 rounded-xl py-1 px-2 text-sm mr-2">{tag}</div>
            ))}
          </div>
        </div>
        <div className="mt-12">
          {content.blocks.map((content) => (
            <div>{renderBlock(content)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
