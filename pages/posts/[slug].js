import { useEffect, useState, useCallback } from 'react';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Head from 'next/head';
import Link from 'next/link';

// 防抖函数优化版
const debounce = (func, wait = 100, immediate = false) => {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export async function getStaticPaths() {
  const posts = getSortedPostsData();
  return {
    paths: posts.map(post => ({ params: { slug: post.slug } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const fullPath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  
  const { data, content } = matter(fileContents);
  const processedContent = await remark().use(html).process(content);
  
  const allPosts = getSortedPostsData();
  const recommendations = allPosts
    .filter(p => p.slug !== params.slug)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return {
    props: {
      frontmatter: data,
      contentHtml: processedContent.toString(),
      recommendedPosts: recommendations
    }
  };
}

const PostPage = ({ frontmatter, contentHtml, recommendedPosts }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [tocItems, setTocItems] = useState([]);
  const [navHeight, setNavHeight] = useState(80); // 默认导航栏高度

  // 暗黑模式切换
  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  }, [darkMode]);

  // 强化ID生成
  const generateID = useCallback((text) => {
    return text
      .normalize('NFD') // 分解重音字符
      .replace(/[\u0300-\u036f]/g, '') // 移除重音符号
      .replace(/[^a-zA-Z0-9\s-]/g, '') // 保留字母数字和空格连字符
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  // 目录生成（带DOM同步）
  const buildToc = useCallback(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3'));
    
    const items = headings.map((heading, index) => {
      const originalText = heading.textContent;
      const baseID = generateID(originalText);
      let finalID = baseID;
      
      // 处理重复ID
      if (doc.getElementById(finalID)) {
        finalID = `${baseID}-${index}`;
      }
      heading.id = finalID;

      return {
        level: heading.tagName.toLowerCase(),
        text: originalText,
        id: finalID,
        active: false
      };
    });

    // 同步到实际DOM
    requestAnimationFrame(() => {
      const liveHeadings = document.querySelectorAll('h1, h2, h3');
      liveHeadings.forEach((h, i) => {
        if (!h.id) h.id = items[i].id;
      });
      setTocItems(items);
    });
  }, [contentHtml, generateID]);

  // 滚动定位检测
  const handleScroll = useCallback(debounce(() => {
    const scrollY = window.scrollY + navHeight + 20;
    let activeId = null;

    tocItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        const { offsetTop, offsetHeight } = el;
        const positionRange = [offsetTop, offsetTop + offsetHeight];
        
        if (scrollY >= positionRange[0] && scrollY < positionRange[1]) {
          activeId = item.id;
        }
      }
    });

    setTocItems(prev => prev.map(item => ({
      ...item,
      active: item.id === activeId
    })));
  }, 100), [navHeight, tocItems]);

  // 目录点击处理
  const scrollToHeading = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = navHeight + 20;
    const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // 视觉反馈
    target.classList.add('highlight-pulse');
    setTimeout(() => target.classList.remove('highlight-pulse'), 1000);

    // URL同步
    window.history.replaceState(null, null, `#${id}`);
  }, [navHeight]);

  // 初始化
  useEffect(() => {
    // 获取导航栏实际高度
    const nav = document.querySelector('nav');
    if (nav) setNavHeight(nav.offsetHeight);

    // 初始化暗黑模式
    const savedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(savedDarkMode ?? systemDark);
    document.documentElement.classList.toggle('dark', savedDarkMode ?? systemDark);

    // 初始化目录
    buildToc();

    // 绑定事件
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [buildToc, handleScroll]);

  // 代码高亮
  useEffect(() => {
    const initHighlight = async () => {
      const hljs = await import('highlight.js');
      hljs.highlightAll();
      
      // 添加语言标签
      document.querySelectorAll('pre code').forEach(block => {
        const lang = block.className.split('language-')[1] || 'plaintext';
        const label = document.createElement('div');
        label.className = 'code-lang';
        label.textContent = lang;
        block.parentNode.insertBefore(label, block);
      });
    };
    initHighlight();
  }, [contentHtml]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Head>
        <title>{frontmatter.title} - Typace</title>
        <style>{`
          .highlight-pulse {
            animation: pulse 1.5s ease-in-out;
          }
          @keyframes pulse {
            0% { background-color: rgba(59, 130, 246, 0); }
            50% { background-color: rgba(59, 130, 246, 0.15); }
            100% { background-color: rgba(59, 130, 246, 0); }
          }
          .code-lang {
            position: absolute;
            right: 0.5rem;
            top: 0.25rem;
            font-size: 0.75rem;
            color: #6b7280;
            padding: 0.25rem 0.5rem;
            background: rgba(209, 213, 219, 0.3);
            border-radius: 0.25rem;
          }
          .dark .code-lang {
            color: #9ca3af;
            background: rgba(75, 85, 99, 0.3);
          }
        `}</style>
      </Head>

      {/* 导航栏 */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Typace
            </a>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/archive"><a className="nav-link">归档</a></Link>
            <button onClick={toggleDarkMode} className="nav-link">
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="pt-32 pb-16 px-6 max-w-4xl mx-auto lg:flex lg:gap-8">
        {/* 文章内容 */}
        <article className="flex-1">
          {frontmatter.cover && (
            <img 
              src={frontmatter.cover}
              alt={frontmatter.title}
              className="w-full h-64 object-cover rounded-xl mb-8 shadow-lg"
            />
          )}
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {frontmatter.title}
          </h1>
          <div className="prose dark:prose-invert max-w-none" 
               dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>

        {/* 目录导航 */}
        <aside className="hidden lg:block w-72 flex-none sticky top-32 h-[calc(100vh-8rem)]">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              目录导航
            </h2>
            <nav className="space-y-2 overflow-y-auto max-h-[80vh]">
              {tocItems.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHeading(item.id);
                  }}
                  className={`block text-sm transition-all duration-200 ${
                    item.active 
                      ? 'text-blue-600 dark:text-blue-400 font-medium pl-3 border-l-4 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 pl-4 border-l-2 border-transparent'
                  } ${
                    item.level === 'h2' ? 'ml-2' : 
                    item.level === 'h3' ? 'ml-4' : ''
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </main>

      {/* 推荐文章 */}
      {recommendedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">推荐阅读</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {recommendedPosts.map(post => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <a className="group block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  {post.cover && (
                    <img
                      src={post.cover}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h4>
                    <time className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.date).toLocaleDateString()}
                    </time>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 页脚（保持原有样式不变） */}
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
          强势驱动
        </p>
      </footer>
    </div>
  );
};

export default PostPage;
