const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(__dirname, "../public/posts");
const outputFilePath = path.join(__dirname, "../public/posts.json");

const getPostsData = () => {
  const files = fs.readdirSync(postsDir);
  const posts = files.map((fileName) => {
    const filePath = path.join(postsDir, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data, content } = matter(fileContent); 

    return {
      id: fileName.replace(".md", ""),
      title: data.title || "제목 없음",
      date: data.date || "날짜 없음",
      tags: data.tags || [], 
      content: content.trim(), 
    };
  });

  fs.writeFileSync(outputFilePath, JSON.stringify(posts, null, 2)); 
};

getPostsData();
console.log("✅ Markdown 파일을 JSON으로 변환 완료!");
