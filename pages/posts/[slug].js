import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Head from 'next/head';
import Link from 'next/link';

export async function getStaticPaths() {
  const posts = getSortedPostsData();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const allPostsData = getSortedPostsData();
  const filteredPosts = allPostsData.filter((post) => post.slug !== params.slug);
  const recommendedPosts = filteredPosts
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return {
    props: {
      frontmatter: data,
      contentHtml,
      recommendedPosts,
    },
  };
}

export default function Post({ frontmatter, contentHtml, recommendedPosts }) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeChanging, setRouteChanging] = useState(false);

  // 路由切换事件监听
  useEffect(() => {
    const handleRouteStart = () => setRouteChanging(true);
    const handleRouteComplete = () => setRouteChanging(false);

    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteComplete);
    };
  }, [router]);

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
    const headings = doc.querySelectorAll('h1, h2');
    const tocItems = [];

    headings.forEach((heading) => {
      const id = heading.textContent.toLowerCase().replace(/\s+/g, '-');
      heading.id = id;
      tocItems.push({
        level: heading.tagName.toLowerCase(),
        text: heading.textContent,
        id,
        active: false,
      });
    });

    setToc(tocItems);
  };

  // 处理目录点击事件
  const handleTocClick = (e, id) => {
    e.preventDefault();
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // 初始化 Waline 评论系统
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walineCSS = document.createElement('link');
      walineCSS.rel = 'stylesheet';
      walineCSS.href = 'https://unpkg.com/@waline/client@v2/dist/waline.css';
      document.head.appendChild(walineCSS);

      const walineJS = document.createElement('script');
      walineJS.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
      walineJS.onload = () => {
        window.Waline.init({
          el: '#waline-comment-container',
          serverURL: 'https://comment.mrzxr.top/',
          dark: isDarkMode ? 'html.dark' : false,
          path: router.asPath,
          locale: {
            placeholder: '欢迎留言讨论...',
          },
        });
      };
      document.body.appendChild(walineJS);

      return () => {
        document.head.removeChild(walineCSS);
        document.body.removeChild(walineJS);
      };
    }
  }, [isDarkMode, router.asPath]);

  // 初始化效果
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);

    // 模拟加载延迟
    const timer = setTimeout(() => {
      if (contentHtml) {
        generateToc();
        setIsLoading(false);
      }
    }, 800);

    // 加载 highlight.js
    const loadHighlightJS = async () => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
      script.onload = () => {
        const theme = document.createElement('link');
        theme.rel = 'stylesheet';
        theme.href = isDarkMode 
          ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
          : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
        document.head.appendChild(theme);
        window.hljs.highlightAll();
      };
      document.head.appendChild(script);
    };

    loadHighlightJS();

    return () => clearTimeout(timer);
  }, [contentHtml, isDarkMode]);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2');
      let currentActiveId = null;

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 100) {
          currentActiveId = heading.id;
        }
      });

      setToc((prevToc) =>
        prevToc.map((item) => ({
          ...item,
          active: item.id === currentActiveId,
        }))
      );
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [contentHtml]);

  // 加载动画组件
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-pulse w-10 h-10 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900 transition-colors duration-300">
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

      {/* 加载动画 */}
      {(isLoading || routeChanging) && <LoadingOverlay />}

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-20 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" legacyBehavior>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" legacyBehavior>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    首页
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about" legacyBehavior>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    关于
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/archive" legacyBehavior>
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

      {/* 文章内容 */}
      <main className="mt-24 flex">
        <div className="flex-1">
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
                    onClick={(e) => handleTocClick(e, item.id)}
                    className={`block transition-colors duration-200 ${
                      item.active
                        ? 'text-blue-600 dark:text-blue-400 font-semibold scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                    } ${item.level === 'h2' ? 'pl-4 text-sm' : 'pl-2 text-base'}`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* 推荐文章 */}
      {recommendedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            推荐文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedPosts.map((post) => (
              <Link 
                key={post.slug} 
                href={`/posts/${post.slug}`}
                legacyBehavior
              >
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

      {/* Waline 评论系统 */}
      <section className="mt-12 max-w-4xl mx-auto">
        <div id="waline-comment-container" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">评论</h3>
        </div>
      </section>

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
            href="https://github.com/terryzhangxr/typace-i"
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
