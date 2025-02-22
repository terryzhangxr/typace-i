import { useEffect, useState } from 'react';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// 获取所有文章的路径
export async function getStaticPaths() {
  const posts = getSortedPostsData();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return { paths, fallback: false };
}

// 获取文章内容
export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontmatter: data,
      contentHtml,
    },
  };
}

export default function Post({ frontmatter, contentHtml }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState([]); // 存储目录

  useEffect(() => {
    // 检查本地存储或系统偏好设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedDarkMode || prefersDarkMode);

    // 动态切换暗黑模式
    if (savedDarkMode || prefersDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 提取标题生成目录
    generateToc();
  }, []);

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 生成目录
  const generateToc = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3'); // 提取 h1, h2, h3 标题
    const tocItems = [];

    headings.forEach((heading) => {
      const id = heading.textContent.toLowerCase().replace(/\s+/g, '-'); // 生成 ID
      heading.id = id; // 设置标题 ID
      tocItems.push({
        level: heading.tagName.toLowerCase(),
        text: heading.textContent,
        id,
      });
    });

    setToc(tocItems); // 更新目录状态
  };

  return (
    <div className="min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-20 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
            >
              Typace
            </a>
            <ul className="flex space-x-6">
              <li>
                <a
                  href="/"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  首页
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  关于
                </a>
              </li>
              <li>
                <a
                  href="/archive"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  归档
                </a>
              </li>
              {/* 暗黑模式切换按钮 */}
              <li>
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  {isDarkMode ? '🌙' : '☀️'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* 文章内容 */}
      <main className="mt-24 flex">
        {/* 文章主体 */}
        <div className="flex-1">
          {/* 封面图片 */}
          {frontmatter.cover && (
            <div className="w-full h-48 md:h-64 mb-8"> {/* 缩小封面图 */}
              <img
                src={frontmatter.cover}
                alt={frontmatter.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          <article className="prose max-w-4xl mx-auto dark:prose-invert">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {frontmatter.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              {frontmatter.date}
            </p>
            <div
              className="text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </article>
        </div>

        {/* 右侧目录 */}
        <aside className="w-64 hidden lg:block pl-8 sticky top-24 self-start">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              目录
            </h2>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                      item.level === 'h2' ? 'pl-4' : item.level === 'h3' ? 'pl-8' : ''
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* 页脚 */}
      <footer className="text-center mt-12">
        <a href="/api/sitemap" className="inline-block">
          <img
            src="https://cdn.us.mrche.top/sitemap.svg"
            alt="Sitemap"
            className="block mx-auto w-8 h-8 dark:invert"
          />
        </a>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          由MRCHE&terryzhang创建的
          <a
            href="https://www.mrche.top/typace"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Typace
          </a>
          强势驱动
        </p>
      </footer>
    </div>
  );
}
