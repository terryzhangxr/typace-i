import { useEffect, useState, useRef } from 'react';
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
      allPostsData,
    },
  };
}

export default function Post({ frontmatter, contentHtml, recommendedPosts, allPostsData }) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const walineInstance = useRef(null);
  const contentRef = useRef(null);

  // 搜索相关状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 检测设备宽度
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

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
      
      /* 图片圆角样式 */
      .prose img {
        border-radius: 0.5rem;
        cursor: zoom-in;
        transition: transform 0.2s ease;
      }
      
      .prose img:hover {
        transform: scale(1.02);
      }
      
      /* 图片预览模态框样式 */
      .image-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }
      
      .image-preview-container {
        max-width: 90%;
        max-height: 90%;
        position: relative;
      }
      
      .image-preview-container img {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
      
      .image-preview-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .image-preview-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* 搜索模态框样式 */
      .search-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 20vh;
        z-index: 1000;
        backdrop-filter: blur(5px);
      }
      .search-container {
        width: 90%;
        max-width: 600px;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .dark .search-container {
        background-color: #1f2937;
      }
      .search-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
      }
      .dark .search-header {
        border-bottom-color: #374151;
      }
      .search-input {
        flex: 1;
        padding: 0.75rem;
        border: none;
        outline: none;
        font-size: 1rem;
        background-color: transparent;
      }
      .dark .search-input {
        color: white;
      }
      .search-close {
        padding: 0.5rem;
        cursor: pointer;
        color: #6b7280;
      }
      .dark .search-close {
        color: #9ca3af;
      }
      .search-results {
        max-height: 60vh;
        overflow-y: auto;
      }
      .search-result-item {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .dark .search-result-item {
        border-bottom-color: #374151;
      }
      .search-result-item:hover {
        background-color: #f9fafb;
      }
      .dark .search-result-item:hover {
        background-color: #374151;
      }
      .search-result-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: #111827;
      }
      .dark .search-result-title {
        color: #f3f4f6;
      }
      .search-result-excerpt {
        color: #6b7280;
        font-size: 0.875rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .dark .search-result-excerpt {
        color: #9ca3af;
      }
      .no-results {
        padding: 2rem;
        text-align: center;
        color: #6b7280;
      }
      .dark .no-results {
        color: #9ca3af;
      }
      .search-highlight {
        background-color: #fde68a;
        color: #92400e;
        padding: 0.1rem 0.2rem;
        border-radius: 0.25rem;
      }
      .dark .search-highlight {
        background-color: #92400e;
        color: #fde68a;
      }
    `;
    document.head.appendChild(style);

    setIsMounted(true);

    // 初始化设备宽度检测
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 添加键盘快捷键 (Cmd+K / Ctrl+K)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 处理搜索查询变化
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allPostsData.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(query);
      const contentMatch = post.content && post.content.toLowerCase().includes(query);
      const tagMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
      
      return titleMatch || excerptMatch || contentMatch || tagMatch;
    }).map(post => ({
      ...post,
      // 高亮匹配的文本
      highlightedTitle: highlightText(post.title, query),
      highlightedExcerpt: post.excerpt ? highlightText(post.excerpt, query) : '',
    }));

    setSearchResults(results);
  }, [searchQuery, allPostsData]);

  // 高亮匹配文本的函数
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };

  // 打开搜索模态框
  const openSearch = () => {
    setIsSearchOpen(true);
    // 聚焦搜索输入框
    setTimeout(() => {
      document.getElementById('search-input')?.focus();
    }, 100);
  };

  // 关闭搜索模态框
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 处理搜索结果的点击
  const handleSearchResultClick = (slug) => {
    closeSearch();
    router.push(`/posts/${slug}`);
  };

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

  const loadHighlightJS = (isDark) => {
    return new Promise((resolve) => {
      const existingTheme = document.querySelector('#hljs-theme');
      if (existingTheme) existingTheme.remove();

      const theme = document.createElement('link');
      theme.id = 'hljs-theme';
      theme.rel = 'stylesheet';
      theme.href = isDark
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
      
      theme.onload = () => {
        if (window.hljs) {
          window.hljs.highlightAll();
        }
        resolve();
      };
      document.head.appendChild(theme);
    });
  };

  const initializeWaline = async () => {
    if (walineInstance.current) {
      walineInstance.current.destroy();
      walineInstance.current = null;
    }

    if (!document.querySelector('#waline-css')) {
      const link = document.createElement('link');
      link.id = 'waline-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/@waline/client@v2/dist/waline.css';
      document.head.appendChild(link);
    }

    if (typeof window.Waline === 'undefined') {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    walineInstance.current = window.Waline.init({
      el: '#waline-comment-container',
      serverURL: 'https://comment.mrzxr.top/',
      dark: 'html.dark',
      path: router.asPath,
      locale: { placeholder: '欢迎留言讨论...' },
    });
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);

    await loadHighlightJS(newDarkMode);
    initializeWaline();
  };

  useEffect(() => {
    return () => {
      if (walineInstance.current) {
        walineInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);

      await Promise.all([
        loadHighlightJS(savedDarkMode),
        initializeWaline(),
        loadHLJSBase()
      ]);

      if (contentHtml) {
        generateToc();
        setupImagePreview();
        setupHeadingAnchors();
      }
    };

    const loadHLJSBase = () => {
      if (!window.hljs) {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      return Promise.resolve();
    };

    const setupImagePreview = () => {
      const articleImages = document.querySelectorAll('.prose img');
      articleImages.forEach(img => {
        img.addEventListener('click', () => {
          setPreviewImage(img.src);
        });
      });
    };

    const setupHeadingAnchors = () => {
      // 确保内容已经渲染
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach((heading) => {
          // 如果已经有ID则跳过
          if (!heading.id) {
            const id = heading.textContent.toLowerCase().replace(/\s+/g, '-');
            heading.id = id;
          }
        });
      }
    };

    initializePage();
  }, [contentHtml]);

  const generateToc = () => {
    // 确保内容已经渲染
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2');
      const tocItems = [];

      headings.forEach((heading) => {
        // 如果已经有ID则使用现有ID，否则创建新ID
        const id = heading.id || heading.textContent.toLowerCase().replace(/\s+/g, '-');
        if (!heading.id) {
          heading.id = id;
        }
        
        tocItems.push({
          level: heading.tagName.toLowerCase(),
          text: heading.textContent,
          id,
          active: true,
        });
      });

      setToc(tocItems);
    }
  };

  const handleTocClick = (e, id) => {
    e.preventDefault();
    const targetElement = document.getElementById(id);
    if (targetElement) {
      // 计算偏移量，考虑导航栏高度
      const offset = 100;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // 更新URL hash
      window.history.pushState(null, '', `#${id}`);
      
      // 手动触发focus，确保可访问性
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus();
    }
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex space-x-6 items-center">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={openSearch}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-2"
                title="搜索 (Ctrl+K)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-2"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={openSearch}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="搜索"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 搜索模态框 */}
      {isSearchOpen && (
        <div className="search-modal">
          <div className="search-container">
            <div className="search-header">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-input"
                type="text"
                className="search-input"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button className="search-close" onClick={closeSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <div
                    key={post.slug}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(post.slug)}
                  >
                    <h3 
                      className="search-result-title"
                      dangerouslySetInnerHTML={{ __html: post.highlightedTitle }}
                    />
                    {post.highlightedExcerpt && (
                      <p 
                        className="search-result-excerpt"
                        dangerouslySetInnerHTML={{ __html: post.highlightedExcerpt }}
                      />
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{post.date}</p>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="no-results">没有找到匹配的文章</div>
              ) : (
                <div className="no-results">输入关键词搜索文章</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 移动端侧滑菜单 */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        {/* 遮罩层 */}
        <div 
          className={`absolute inset-0 bg-black/20 dark:bg-black/40 transition-opacity ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* 菜单内容 */}
        <div 
          className={`absolute right-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 space-y-4 pt-2">
            {/* 关闭按钮 */}
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 菜单项 */}
            <div className="mt-6 space-y-3">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>首页</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>关于</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMenuOpen(false)}>归档</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMenuOpen(false)}>标签</MobileNavLink>
            </div>
            
            {/* 暗黑模式按钮 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>暗黑模式</span>
                <span>{isDarkMode ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div className="image-preview-overlay" onClick={closePreview}>
          <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" />
            <button className="image-preview-close" onClick={closePreview}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className={`min-h-screen p-8 pt-24 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>{frontmatter.title} - Typace</title>
        </Head>

        <main className="flex">
          <div className="flex-1" ref={contentRef}>
            {frontmatter.cover && (
              <div className="w-full h-48 md:h-64 mb-8">
                <img
                  src={frontmatter.cover}
                  alt={frontmatter.title}
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  onClick={() => setPreviewImage(frontmatter.cover)}
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
              {/* 显示标签 */}
              {frontmatter.tags && frontmatter.tags.length > 0 && (
                <div className="mb-8">
                  {frontmatter.tags.map((tag) => (
                    <Link key={tag} href={`/tags#${tag}`} passHref>
                      <a className="tag">
                        {tag}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
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
            由Terryzhang&mrche创建的
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
    </>
  );
}

// 桌面导航链接组件
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
      {children}
    </a>
  </Link>
);

// 移动端导航链接组件
const MobileNavLink = ({ href, children, onClick }) => (
  <Link href={href} passHref>
    <a 
      onClick={onClick}
      className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
    >
      {children}
    </a>
  </Link>
);
