import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 判断是否为中文字符
const isChinese = (char) => /[\u4e00-\u9fa5]/.test(char);

// 根据语言截取摘要
const getExcerpt = (content, maxLength) => {
  const plainText = content
    .replace(/<[^>]+>/g, '') // 移除HTML标签
    .replace(/#+\s*|\[.*?\]\(.*?\)|\*\*|\*/g, '') // 移除Markdown标记
    .trim();

  let excerpt = '';
  let charCount = 0;

  for (const char of plainText) {
    if (isChinese(char)) {
      charCount += 2; // 中文字符算2个字符
    } else {
      charCount += 1; // 英文字符算1个字符
    }

    if (charCount > maxLength) {
      break;
    }
    excerpt += char;
  }

  return excerpt + (charCount > maxLength ? "..." : "");
};

// 获取所有文章数据
export function getSortedPostsData() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // 根据语言截取摘要
    const isEnglish = !/[\u4e00-\u9fa5]/.test(content); // 判断是否为英文
    const excerpt = getExcerpt(content, isEnglish ? 200 : 100);

    return {
      slug: id,
      excerpt, // 添加摘要
      ...data,
    };
  });

  return allPostsData.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
}
