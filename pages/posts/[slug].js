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
  const [isMounted, setIsMounted] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());

  // 动画控制逻辑
  useEffect(() => {
    const triggerAnimation = () => {
      setIsMounted(false);
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    };

    // 首次加载延迟触发
    const initialTimer = setTimeout(triggerAnimation, 100);

    // 路由变化处理
    const handleRouteChange = () => {
      setRenderKey(Date.now()); // 强制重建DOM
      triggerAnimation();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      clearTimeout(initialTimer);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  // 加载非关键资源
  useEffect(() => {
    if (!isMounted) return;

    const loadResources = async () => {
      try {
        const [{ default: hljs }, { default: Waline }] = await Promise.all([
          import('highlight.js'),
          import('@waline/client'),
        ]);

        // 初始化代码高亮
        hljs.highlightAll();

        // 初始化Waline评论
        Waline.init({
          el: '#waline-comment-container',
          serverURL: 'https://comment.mrzxr.top/',
          dark: document.documentElement.classList.contains('dark') ? 'html.dark' : false,
          path: router.asPath,
          locale: { placeholder: '欢迎留言讨论...' },
        });
      } catch (error) {
        console.error('资源加载失败:', error);
      }
    };

    const timer = setTimeout(loadResources, 500);
    return () => clearTimeout(timer);
  }, [isMounted]);

  return (
    <div
      key={renderKey}
      className={`min-h-screen p-8 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}
    >
      <Head>
        <title>{frontmatter.title} - Typace</title>
      </Head>

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
                  onClick={() => {
                    const newDarkMode = !document.documentElement.classList.contains('dark');
                    document.documentElement.classList.toggle('dark', newDarkMode);
                    localStorage.setItem('darkMode', newDarkMode);
                  }}
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  {document.documentElement.classList.contains('dark') ? '🌙' : '☀️'}
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
  );
}
