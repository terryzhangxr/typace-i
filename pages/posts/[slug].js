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
  const [isMounted, setIsMounted] = useState(false);

  // 添加动态样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .page-container {
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .page-container.mounted {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    setIsMounted(true);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 路由事件处理
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsMounted(false);
    };

    const handleRouteChangeComplete = () => {
      setIsMounted(true);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  // 初始化处理
  useEffect(() => {
    const initializePage = async () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);

      // 加载 highlight.js
      await new Promise((resolve) => {
        if (!window.hljs) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        } else {
          resolve();
        }
      });

      // 初始化代码高亮样式
      loadHighlightJS(savedDarkMode);

      if (contentHtml) {
        generateToc();
        await initializeWaline();
      }
    };

    initializePage();
  }, [contentHtml]);

  // 加载代码高亮样式
  const loadHighlightJS = (isDark) => {
    // 移除旧主题
    const existingTheme = document.querySelector('#hljs-theme');
    if (existingTheme) existingTheme.remove();

    // 添加新主题
    const theme = document.createElement('link');
    theme.id = 'hljs-theme';
    theme.rel = 'stylesheet';
    theme.href = isDark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
    document.head.appendChild(theme);

    // 重新高亮代码
    if (window.hljs) window.hljs.highlightAll();
  };

  // 初始化评论系统
  const initializeWaline = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve();

      // 清理旧实例
      const container = document.getElementById('waline-comment-container');
      if (container) container.innerHTML = '';

      // 动态加载 CSS
      if (!document.querySelector('#waline-css')) {
        const link = document.createElement('link');
        link.id = 'waline-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/@waline/client@v2/dist/waline.css';
        document.head.appendChild(link);
      }

      // 动态加载 JS
      if (!document.querySelector('#waline-js')) {
        const script = document.createElement('script');
        script.id = 'waline-js';
        script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
        script.onload = () => {
          initWalineInstance();
          resolve();
        };
        document.body.appendChild(script);
      } else {
        initWalineInstance();
        resolve();
      }

      const initWalineInstance = () => {
        window.Waline.init({
          el: '#waline-comment-container',
          serverURL: 'https://comment.mrzxr.top/',
          dark: isDarkMode ? 'auto' : true, // 自动跟随系统主题
          path: router.asPath,
          locale: { placeholder: '欢迎留言讨论...' },
        });
      };
    });
  };

  // 暗黑模式切换
  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);

    // 更新代码高亮主题
    loadHighlightJS(newDarkMode);

    // 重新初始化评论系统
    await initializeWaline();
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
        active: true,
      });
    });

    setToc(tocItems);
  };

  // 处理目录点击
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

  return (
    <div className={`min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900 page-container ${
      isMounted ? 'mounted' : ''
    }`}>
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-20">
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

        <aside className="w-64 hidden lg:block pl-8 sticky top-24 self-start">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">目录</h2>
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

      {recommendedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">推荐文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedPosts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`} legacyBehavior>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{post.date}</p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 max-w-4xl mx-auto">
        <div id="waline-comment-container" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">评论</h3>
        </div>
      </section>

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
            href="https://bgithub.xyz/terryzhangxr/typace-i"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Typace
          </a>
          强力驱动
        </p>
      </footer>
    </div>
  );
}
