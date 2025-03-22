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

  // 页面刷新逻辑
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0); // 进入页面时滚动到顶部
      setIsMounted(true); // 触发动画
    }
  }, []);

  // 路由切换处理
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsMounted(false); // 路由切换时隐藏页面
    };

    const handleRouteChangeComplete = () => {
      window.scrollTo(0, 0); // 路由切换完成后滚动到顶部
      setIsMounted(true); // 路由切换完成后显示页面
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

      if (contentHtml) {
        generateToc();
        await loadDependencies();
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

  // 暗黑模式切换
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    loadHighlightJS();
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

  return (
    <div className={`min-h-screen p-8 pt-24 relative bg-white dark:bg-gray-900 transition-all duration-500 ${
      isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    }`}>
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

      {/* 固定导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-50 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
              首页
            </Link>
            <div className="flex space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                关于
              </Link>
              <Link href="/archive" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                归档
              </Link>
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex gap-8">
        <div className="flex-1 max-w-4xl mx-auto">
          {frontmatter.cover && (
            <img
              src={frontmatter.cover}
              alt={frontmatter.title}
              className="w-full h-64 object-cover rounded-xl mb-8"
            />
          )}
          
          <article className="prose dark:prose-invert">
            <h1 className="!text-4xl !font-bold !mb-4 dark:!text-white">
              {frontmatter.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              {frontmatter.date}
            </p>
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          {recommendedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">推荐文章</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedPosts.map((post) => (
                  <Link 
                    key={post.slug} 
                    href={`/posts/${post.slug}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:scale-105 transition-transform"
                  >
                    {post.cover && (
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{post.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16">
            <div 
              id="waline-comment-container" 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            />
          </section>
        </div>

        <aside className="hidden lg:block w-64 sticky top-24 h-min">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">目录</h2>
            <nav>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleTocClick(e, item.id)}
                  className={`block py-1 transition-colors ${
                    item.level === 'h2' 
                      ? 'pl-4 text-sm text-gray-600 dark:text-gray-400' 
                      : 'pl-2 text-base text-gray-800 dark:text-gray-200'
                  } hover:text-blue-600 dark:hover:text-blue-400`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </main>

      <footer className="text-center mt-16 pb-8">
        <div className="inline-flex flex-col items-center">
          <img
            src="https://cdn.us.mrche.top/sitemap.svg"
            alt="Sitemap"
            className="w-8 h-8 dark:invert mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            由MRCHE&terryzhang创建的
            <a
              href="https://bgithub.xyz/terryzhangxr/typace-i"
              className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
            >
              Typace
            </a>
            强力驱动
          </p>
        </div>
      </footer>
    </div>
  );
}
