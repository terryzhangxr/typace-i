import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'source');

export function getSortedPostsData() {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents); // 解析内容和元数据

    // 如果没有提供 excerpt，则从内容中提取前 100 个字符作为摘要
    const excerpt = data.excerpt || content.slice(0, 100).trim() + '...';

    return {
      slug: fileName.replace(/\.md$/, ''),
      ...data,
      content, // 保留文章内容
      excerpt, // 添加摘要字段
    };
  });

  // 按日期排序
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}
