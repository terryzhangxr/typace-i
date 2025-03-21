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
  const [contentVisible, setContentVisible] = useState(false);

  // 路由切换处理
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setContentVisible(false);
    };

    const handleComplete = () => {
      setIsLoading(false);
      setTimeout(() => setContentVisible(true), 50);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, []);

  // 初始化处理
  useEffect(() => {
    const initializePage = async () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);

      if (contentHtml) {
        generateToc();
        await loadDependencies();
        setTimeout(() => {
          setIsLoading(false);
          setContentVisible(true);
        }, 600);
      }
    };

    initializePage();
  }, [contentHtml]);

  // 加载依赖
  const loadDependencies = async () => {
    await loadHighlightJS();
    await initializeWaline();
  };

  // 加载代码高亮
  const loadHighlightJS = () => {
    return new Promise((resolve) => {
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
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  // 初始化评论系统
  const initializeWaline = () => {
    return new Promise((resolve) => {
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
            locale: { placeholder: '欢迎留言讨论...' },
          });
          resolve();
        };
        document.body.appendChild(walineJS);
      }
    });
  };

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    loadHighlightJS(); // 重新加载高亮主题
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

  // 加载动画组件
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-blue-500 dark:text-blue-400 text-lg font-medium">Welcome to our world...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900">
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

      {isLoading && <LoadingOverlay />}

      <div className={`${contentVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
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

        {/* 主要内容 */}
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

          {/* 侧边目录 */}
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

        {/* 推荐文章 */}
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

        {/* 评论系统 */}
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
              href="https://bgithub.xyz/terryzhangxr/typace-i"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Typace
            </a>
            强力驱动
          </p>
        </footer>
      </div>
    </div>
  );
}
