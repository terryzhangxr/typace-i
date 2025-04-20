import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

// 每页显示的文章数量
const POSTS_PER_PAGE = 5;

// 动态样式定义 
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* 基础样式重置 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* 新增分页样式 */
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 3rem;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
    }
    .page-item {
      display: inline-flex;
    }
    .page-link {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      color: #4b5563;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      cursor: pointer;
      background: white;
    }
    .page-link:hover {
      background-color: #f3f4f6;
      border-color: #d1d5db;
    }
    .page-link.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .page-link.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .dark .page-link {
      border-color: #4b5563;
      color: #d1d5db;
      background-color: #1f2937;
    }
    .dark .page-link:hover {
      background-color: #374151;
      border-color: #6b7280;
    }
    .dark .page-link.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    /* 页面切换动画 */
    .page-transition {
      opacity: 1;
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    }
    .page-transition-exit {
      opacity: 1;
      transform: translateY(0);
    }
    .page-transition-exit-active {
      opacity: 0;
      transform: translateY(20px);
    }
    .page-transition-enter {
      opacity: 0;
      transform: translateY(-20px);
    }
    .page-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
    }

    /* 背景渐变过渡 */
    .bg-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1.5s ease-in-out;
      z-index: -1;
    }
    .bg-visible {
      opacity: 1;
    }

    /* 响应式布局 */
    @media (max-width: 767px) {
      .profile-section, .latest-posts-section {
        display: none;
      }
      .main-content {
        width: 100% !important;
      }
      .post-card {
        flex-direction: column !important;
      }
      .post-image-container {
        width: 100% !important;
        height: 200px !important;
      }
    }

    /* 打字机效果 */
    .typewriter {
      display: inline-block;
      white-space: pre-wrap;
      margin: 0 auto;
      letter-spacing: 0.15em;
      border-right: 0.15em solid #4a5568;
      animation: blink-caret 0.75s step-end infinite;
    }
    @keyframes blink-caret {
      from,
      to {
        border-color: transparent;
      }
      50% {
        border-color: #4a5568;
      }
    }

    /* 其他样式 */
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    header h1 {
      margin-bottom: 2rem;
    }
    header {
      margin-bottom: 4rem;
    }
    .hitokoto-container {
      max-width: 80%;
      margin: 0 auto;
      overflow-wrap: break-word;
      word-wrap: break-word;
      white-space: normal;
    }

    /* 新增动画样式 */
    .page-container {
      position: relative;
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-container.mounted {
      opacity: 1;
      transform: translateY(0);
    }

    /* 标签样式 - 更简约的设计 */
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
      color: #3b82f6;
      background-color: rgba(59, 130, 246, 0.1);
      border-radius: 0.25rem;
      transition: all 0.2s ease;
    }
    .tag:hover {
      background-color: rgba(59, 130, 246, 0.2);
    }
    .dark .tag {
      color: #93c5fd;
      background-color: rgba(147, 197, 253, 0.1);
    }
    .dark .tag:hover {
      background-color: rgba(147, 197, 253, 0.2);
    }

    /* 文章卡片样式 - 更自然的瀑布流设计 */
    .post-card {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 0.75rem;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .post-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .dark .post-card {
      background: rgba(31, 41, 55, 0.8);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .post-image-container {
      width: 100%;
      height: 200px;
      overflow: hidden;
    }
    .post-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .post-card:hover .post-image {
      transform: scale(1.03);
    }

    .post-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .post-date {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .dark .post-date {
      color: #9ca3af;
    }

    .post-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #111827;
      transition: color 0.2s ease;
    }
    .dark .post-title {
      color: #f3f4f6;
    }
    .post-card:hover .post-title {
      color: #3b82f6;
    }
    .dark .post-card:hover .post-title {
      color: #93c5fd;
    }

    .post-excerpt {
      color: #4b5563;
      margin-bottom: 1rem;
      line-height: 1.5;
      font-size: 0.9375rem;
    }
    .dark .post-excerpt {
      color: #d1d5db;
    }

    .post-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .read-more {
      display: inline-flex;
      align-items: center;
      color: #3b82f6;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .dark .read-more {
      color: #93c5fd;
    }
    .read-more:hover {
      color: #2563eb;
    }
    .dark .read-more:hover {
      color: #60a5fa;
    }
    .read-more svg {
      margin-left: 0.25rem;
      transition: transform 0.2s ease;
    }
    .read-more:hover svg {
      transform: translateX(2px);
    }

    /* 瀑布流布局 */
    .posts-waterfall {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .posts-waterfall {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .posts-waterfall {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* 导航栏动画 */
    .nav-link {
      position: relative;
    }
    .nav-link:after {
      content: '';
      position: absolute;
      width: 0;
      height: 1px;
      bottom: -2px;
      left: 0;
      background-color: #3b82f6;
      transition: width 0.3s ease;
    }
    .nav-link:hover:after {
      width: 100%;
    }
    .dark .nav-link:after {
      background-color: #93c5fd;
    }

    /* 加载动画 */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* 滚动条样式 */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    .dark ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    .dark ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
    }
    .dark ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const router = useRouter();
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // 其他原有状态
  const [transitionState, setTransitionState] = useState('idle');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hitokoto, setHitokoto] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 搜索相关状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 滚动位置状态
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isReturning, setIsReturning] = useState(false);

  // 计算文章总数和标签总数
  const totalPosts = allPostsData.length;
  const allTags = new Set();
  allPostsData.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });
  const totalTags = allTags.size;

  // 初始化分页
  useEffect(() => {
    const total = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
    setTotalPages(total);
    updatePaginatedPosts(1);
  }, [allPostsData]);

  // 更新分页文章
  const updatePaginatedPosts = (page) => {
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setPaginatedPosts(allPostsData.slice(startIndex, endIndex));
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updatePaginatedPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    addDynamicStyles();

    // 从本地存储获取暗黑模式设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);

    // 获取一言
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((data) => {
        setHitokoto(data.hitokoto);
        typeWriterEffect(data.hitokoto);
      })
      .catch((error) => {
        console.error('获取一言失败:', error);
        const defaultHitokoto = '生活不止眼前的苟且，还有诗和远方的田野。';
        setHitokoto(defaultHitokoto);
        typeWriterEffect(defaultHitokoto);
      });

    // 路由事件监听
    const handleRouteChangeStart = (url) => {
      // 如果是离开首页，保存滚动位置
      if (router.pathname === '/') {
        setScrollPosition(window.scrollY);
      }
      setTransitionState('exiting');
      setIsMounted(false);
    };

    const handleRouteChangeComplete = (url) => {
      setTransitionState('entering');
      setTimeout(() => {
        setTransitionState('idle');
        setIsMounted(true);
      }, 300);
    };

    const handleHistoryChange = (url, { shallow }) => {
      // 检测是否是返回首页
      if (url === '/' && router.pathname !== '/') {
        setIsReturning(true);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('beforeHistoryChange', handleHistoryChange);

    // 初始化页面动画
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
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('beforeHistoryChange', handleHistoryChange);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  // 处理返回首页时的滚动位置
  useEffect(() => {
    if (isReturning) {
      // 延迟执行以确保页面已经渲染完成
      const timer = setTimeout(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
        setIsReturning(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isReturning, scrollPosition]);

  // 检测设备宽度
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // 打字机效果
  const typeWriterEffect = (text) => {
    let i = 0;
    const speed = 100;
    const container = document.querySelector('.hitokoto-container');
    const typewriterElement = document.querySelector('.typewriter');

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        if (typewriterElement.scrollWidth > container.clientWidth) {
          typewriterElement.style.whiteSpace = 'pre-wrap';
        }
        i++;
      } else {
        clearInterval(timer);
        if (typewriterElement) {
          typewriterElement.style.animation = 'none';
          typewriterElement.style.borderRight = 'none';
        }
      }
    }, speed);
  };

  // 动态背景渐变
  useEffect(() => {
    const lightColors = [
      'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
      'linear-gradient(45deg, #e5e7eb, #d1d5db)',
      'linear-gradient(45deg, #d1d5db, #9ca3af)',
      'linear-gradient(45deg, #9ca3af, #f3f4f6)',
    ];

    const darkColors = [
      'linear-gradient(45deg, #1f2937, #374151)',
      'linear-gradient(45deg, #374151, #4b5563)',
      'linear-gradient(45deg, #4b5563, #6b7280)',
      'linear-gradient(45deg, #6b7280, #1f2937)',
    ];

    const colors = isDarkMode ? darkColors : lightColors;

    const bg1 = document.createElement('div');
    const bg2 = document.createElement('div');
    bg1.className = bg2.className = 'bg-transition';
    document.body.append(bg1, bg2);

    let currentIndex = 0;
    let activeBg = bg1;

    activeBg.style.backgroundImage = colors[currentIndex];
    activeBg.classList.add('bg-visible');

    const changeBackground = () => {
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextBg = activeBg === bg1 ? bg2 : bg1;

      nextBg.style.backgroundImage = colors[nextIndex];

      setTimeout(() => {
        activeBg.classList.remove('bg-visible');
        nextBg.classList.add('bg-visible');
        activeBg = nextBg;
        currentIndex = nextIndex;
      }, 100);
    };

    const intervalId = setInterval(changeBackground, 2500);

    return () => {
      clearInterval(intervalId);
      bg1.remove();
      bg2.remove();
    };
  }, [isDarkMode]);

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 获取过渡类名
  const getTransitionClass = () => {
    switch (transitionState) {
      case 'exiting':
        return 'page-transition-exit';
      case 'entering':
        return 'page-transition-enter';
      default:
        return '';
    }
  };

  return (
    <>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Typace
              </a>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex space-x-5 items-center">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={openSearch}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-1"
                title="搜索 (Ctrl+K)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-1"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden flex items-center space-x-3">
              <button
                onClick={openSearch}
                className="p-1 text-gray-600 dark:text-gray-300"
                title="搜索"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                className="p-1 text-gray-600 dark:text-gray-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* 移动端菜单 */}
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
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="mt-6 space-y-3">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>首页</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>关于</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMenuOpen(false)}>归档</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMenuOpen(false)}>标签</MobileNavLink>
            </div>
            
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

      {/* 页面内容 */}
      <div className={`min-h-screen px-4 pt-20 pb-8 relative z-10 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>首页 - Typace</title>
        </Head>

        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Typace
          </h1>
          <div className="hitokoto-container">
            <p className="text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">{displayText}</span>
            </p>
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="container mx-auto flex flex-col lg:flex-row gap-8">
          {/* 桌面端左侧简介栏 */}
          <aside className="hidden lg:block w-1/4">
            {/* 简介板块和最新文章板块的容器 */}
            <div className="sticky top-24 space-y-6">
              {/* 简介板块 */}
              <div className="profile-section p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <div className="flex flex-col items-center">
                  {/* 博主头像 */}
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                    <img 
                      src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                      alt="博主头像" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Typace
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    theme typace team
                  </p>
                  <div className="flex space-x-4">
                    <Link href="/archive" passHref>
                      <a className="text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {totalPosts}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          文章
                        </div>
                      </a>
                    </Link>
                    <Link href="/tags" passHref>
                      <a className="text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {totalTags}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          标签
                        </div>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 最新文章板块 */}
              <div className="latest-posts-section p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                  最新文章
                </h2>
                <ul className="space-y-3">
                  {allPostsData.slice(0, 5).map((post) => (
                    <li key={post.slug}>
                      <Link href={`/posts/${post.slug}`} passHref>
                        <a className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {post.title}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* 文章列表 - 瀑布流布局 */}
          <main className="main-content w-full lg:w-3/4">
            <div className="posts-waterfall">
              {paginatedPosts.map(({ slug, title, date, cover, excerpt, tags }) => (
                <Link key={slug} href={`/posts/${slug}`} passHref>
                  <a className="post-card">
                    {cover && (
                      <div className="post-image-container">
                        <img
                          src={cover}
                          alt={title}
                          className="post-image"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="post-content">
                      <p className="post-date">{date}</p>
                      <h3 className="post-title">{title}</h3>
                      {excerpt && (
                        <p className="post-excerpt">{excerpt}</p>
                      )}
                      <div className="post-footer">
                        {tags && tags.length > 0 && (
                          <div>
                            {tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="read-more">
                          阅读更多
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* 分页组件 */}
            {totalPages > 0 && (
              <div className="pagination mt-8">
                <li className="page-item">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`page-link ${currentPage === 1 ? 'disabled' : ''}`}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className="page-item">
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`page-link ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className="page-item">
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`page-link ${currentPage === totalPages ? 'disabled' : ''}`}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </li>
              </div>
            )}
          </main>
        </div>

        {/* 页脚 */}
        <footer className="text-center mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            由MRCHE&terryzhang创建的
            <a
              href="https://bgithub.xyz/terryzhangxr/typace-i"
              className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
            >
              Typace
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            联系我们
            <a
              href="mailto:zhang@mrzxr.com"
              className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
            >
              zhang@mrzxr.com
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}

// 桌面导航链接组件
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors nav-link">
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

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData: allPostsData.map(post => ({
        ...post,
        content: post.content || "",
      })),
    },
  };
}
