import Link from 'next/link';
import { getSortedPostsData } from '../lib/posts';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function TagsPage({ tagsWithPosts }) {
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

      /* 标签卡片动画 */
      .tag-card {
        transition: all 0.3s ease;
      }
      .tag-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }

      /* 暗色模式优化 */
      .dark .tag-card {
        background-color: rgba(31, 41, 55, 0.8);
      }
      .dark .tag-card:hover {
        background-color: rgba(31, 41, 55, 0.9);
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
                <Link href="/tags" passHref prefetch>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    标签
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
          <title>标签 - Typace</title>
        </Head>

        <main className="mt-24">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 mb-8">
            标签
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(tagsWithPosts).map(([tag, posts]) => (
              <div key={tag} className="tag-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-[1.02]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  {tag}
                </h2>
                <ul className="space-y-2">
                  {posts.map(({ slug, title }) => (
                    <li key={slug}>
                      <Link href={`/posts/${slug}`} passHref>
                        <a className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {title}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();

  // 按标签分类文章
  const tagsWithPosts = allPostsData.reduce((acc, post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push({
          slug: post.slug,
          title: post.title,
          date: post.date,
        });
      });
    }
    return acc;
  }, {});

  return {
    props: {
      tagsWithPosts,
    },
  };
}
