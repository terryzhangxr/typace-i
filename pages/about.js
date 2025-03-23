import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// 获取 about.md 文件内容
export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'pages', 'about.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // 将 Markdown 转换为 HTML
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontmatter: data,
      contentHtml,
    },
  };
}

export default function About({ frontmatter, contentHtml }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  // 暗色模式切换优化
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 动画和路由处理
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .page-container {
        opacity: 0;
        transform: translateY(200px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.1, 1);
      }
      .page-container.mounted {
        opacity: 1;
        transform: translateY(0);
      }

      /* 暗色模式优化 */
      .dark .prose {
        color: #e5e7eb;
      }
      .dark .prose a {
        color: #60a5fa;
      }
      .dark .prose h1, .dark .prose h2, .dark .prose h3 {
        color: #f3f4f6;
      }
    `;
    document.head.appendChild(style);

    // 初始化设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
    setIsMounted(true);

    // 路由事件监听
    const handleRouteChange = () => setIsMounted(false);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      document.head.removeChild(style);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" passHref prefetch>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    首页
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about" passHref prefetch>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    关于
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/archive" passHref prefetch>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    归档
                  </a>
                </Link>
              </li>
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

      {/* 内容容器 */}
      <div className={`min-h-screen p-8 pt-24 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>{frontmatter.title} - Typace</title>
        </Head>

        <main className="mt-24">
          <article className="prose max-w-4xl mx-auto dark:prose-invert">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {frontmatter.title}
            </h1>
            <div
              className="text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </article>
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
    </>
  );
}
