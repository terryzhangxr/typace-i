import { useEffect, useState } from 'react';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Head from 'next/head';
import Link from 'next/link';

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

  // 获取所有文章数据
  const allPostsData = getSortedPostsData();

  // 排除当前文章
  const filteredPosts = allPostsData.filter((post) => post.slug !== params.slug);

  // 随机选择最多 3 篇文章
  const recommendedPosts = filteredPosts
    .sort(() => 0.5 - Math.random()) // 随机排序
    .slice(0, 3); // 取前 3 篇

  return {
    props: {
      frontmatter: data,
      contentHtml,
      recommendedPosts, // 推荐文章数据
    },
  };
}

export default function Post({ frontmatter, contentHtml, recommendedPosts }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
  }, []);

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <div className="min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* 动态设置标签页 title */}
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-20 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>
            <ul className="flex space-x-6">
              <li>
                <Link href="/">
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    首页
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    关于
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/archive">
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    归档
                  </a>
                </Link>
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
      <main className="mt-24">
        {/* 封面图片 */}
        {frontmatter.cover && (
          <div className="w-full h-48 md:h-64 mb-8">
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
      </main>

      {/* 推荐文章 */}
      {recommendedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            推荐文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedPosts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <a className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105">
                  {post.cover && (
                    <div className="w-full h-48">
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {post.date}
                    </p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

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
