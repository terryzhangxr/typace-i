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
      transition: opacity 1s ease-in-out;
      z-index: -1;
    }
    .bg-visible {
      opacity: 1;
    }

    /* 响应式布局 */
    @media (max-width: 767px) {
      .cover-image-container {
        width: 100%;
        height: 180px;
      }
      .profile-card {
        width: 100% !important;
        margin-bottom: 2rem;
      }
      .pagination {
        flex-wrap: wrap;
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
    .line-clamp-4 {
      display: -webkit-box;
      -webkit-line-clamp: 4;
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

    /* 标签样式 */
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #3b82f6;
      background-color: #dbeafe;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
    }
    .tag:hover {
      background-color: #bfdbfe;
    }
    .dark .tag {
      color: #93c5fd;
      background-color: #1e3a8a;
    }
    .dark .tag:hover {
      background-color: #1e40af;
    }

    /* 简介框样式 */
    .profile-avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(59, 130, 246, 0.5);
      transition: all 0.3s ease;
    }
    .profile-avatar:hover {
      transform: scale(1.05);
      border-color: rgba(59, 130, 246, 0.8);
    }
    .stats-card {
      transition: all 0.3s ease;
    }
    .stats-card:hover {
      transform: translateY(-3px) scale(1.05);
    }

    /* 社交媒体图标样式 */
    .social-icons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .social-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: #f3f4f6;
      color: #4b5563;
      transition: all 0.3s ease;
    }
    .social-icon:hover {
      transform: translateY(-3px);
      background-color: #e5e7eb;
    }
    .dark .social-icon {
      background-color: #374151;
      color: #d1d5db;
    }
    .dark .social-icon:hover {
      background-color: #4b5563;
    }
    .social-icon svg {
      width: 20px;
      height: 20px;
    }
    .social-icon img {
      width: 20px;
      height: 20px;
      filter: grayscale(100%) contrast(0.5);
      transition: filter 0.3s ease;
    }
    .social-icon:hover img {
      filter: grayscale(0%) contrast(1);
    }
    .dark .social-icon img {
      filter: grayscale(100%) contrast(1) invert(1);
    }
    .dark .social-icon:hover img {
      filter: grayscale(0%) contrast(1) invert(0);
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

    /* 高级文章卡片样式 */
    .article-card {
      position: relative;
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: white;
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .dark .article-card {
      background: #1a202c;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      border-color: rgba(255, 255, 255, 0.05);
    }
    .article-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }
    .dark .article-card:hover {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
    }
    .article-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .article-card:hover::before {
      opacity: 1;
    }
    .article-cover-container {
      height: 220px;
      overflow: hidden;
      position: relative;
    }
    .article-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .article-card:hover .article-cover {
      transform: scale(1.08);
    }
    .article-content {
      padding: 1.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .article-date {
      display: inline-block;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: #6b7280;
      background-color: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      align-self: flex-start;
    }
    .dark .article-date {
      color: #d1d5db;
      background-color: #2d3748;
    }
    .article-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #111827;
      transition: color 0.2s ease;
      line-height: 1.3;
    }
    .dark .article-title {
      color: #f3f4f6;
    }
    .article-excerpt {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.7;
      flex: 1;
    }
    .dark .article-excerpt {
      color: #a0aec0;
    }
    .article-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .read-more {
      display: inline-flex;
      align-items: center;
      color: #3b82f6;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
      padding-right: 1.5rem;
    }
    .dark .read-more {
      color: #60a5fa;
    }
    .read-more:hover {
      color: #2563eb;
    }
    .dark .read-more:hover {
      color: #3b82f6;
    }
    .read-more::after {
      content: '→';
      position: absolute;
      right: 0;
      transition: transform 0.2s ease;
    }
    .read-more:hover::after {
      transform: translateX(4px);
    }
    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* 高级导航栏样式 */
    .navbar {
      backdrop-filter: saturate(180%) blur(20px);
      transition: all 0.3s ease;
    }
    .navbar-scrolled {
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }
    .dark .navbar-scrolled {
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
    .nav-link {
      position: relative;
      padding: 0.5rem 0;
    }
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: currentColor;
      transition: width 0.3s ease;
    }
    .nav-link:hover::after {
      width: 100%;
    }

    /* 高级英雄区域样式 */
    .hero {
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
      z-index: -1;
    }
    .hero-title {
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
    }

    /* 高级侧边栏样式 */
    .sidebar-card {
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    .dark .sidebar-card {
      border-color: rgba(255, 255, 255, 0.05);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .sidebar-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    .dark .sidebar-card:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    /* 高级页脚样式 */
    .footer {
      backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .dark .footer {
      border-top-color: rgba(255, 255, 255, 0.05);
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
  const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

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

    // 滚动监听
    const handleScroll = () => {
      setIsNavbarScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('beforeHistoryChange', handleHistoryChange);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
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
      'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
      'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
      'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
    ];

    const darkColors = [
      'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
      'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #4338ca 100%)',
      'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
      'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)',
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

    const intervalId = setInterval(changeBackground, 3500);

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

  // 截取250字左右的摘要
  const getExcerpt = (content) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, ''); // 去除HTML标签
    return plainText.length > 250 ? plainText.substring(0, 250) + '...' : plainText;
  };

  return (
    <>
      {/* 高级导航栏 */}
      <nav className={`navbar fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-50 transition-all duration-300 ${
        isNavbarScrolled ? 'navbar-scrolled py-3' : 'py-4'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex space-x-8 items-center">
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
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
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
      <div className={`min-h-screen p-6 pt-24 relative z-10 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>首页 - Typace</title>
          <meta name="description" content="Typace - 一个现代化的博客主题" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* 英雄区域 */}
        <header className="hero text-center mb-12">
          <h1 className="hero-title text-6xl font-extrabold mb-6">
            Typace
          </h1>
          <div className="hitokoto-container max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">{displayText}</span>
            </p>
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧简介栏 */}
          <aside className="lg:w-1/4">
            {/* 简介板块和最新文章板块的容器 */}
            <div className="sticky top-28 space-y-6">
              {/* 简介板块 */}
              <div className="sidebar-card p-6 rounded-xl">
                <div className="flex flex-col items-center">
                  {/* 博主头像 */}
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                    <img 
                      src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                      alt="博主头像" 
                      className="w-full h-full object-cover profile-avatar"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Typace
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                    theme typace team
                  </p>
                  <div className="flex space-x-4">
                    <Link href="/archive" passHref>
                      <a className="text-center stats-card hover:transform hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalPosts}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          文章
                        </div>
                      </a>
                    </Link>
                    <Link href="/tags" passHref>
                      <a className="text-center stats-card hover:transform hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalTags}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          标签
                        </div>
                      </a>
                    </Link>
                  </div>

                  {/* 社交媒体图标 */}
                  <div className="social-icons">
                    <a 
                      href="mailto:zhang@mrzxr.com" 
                      className="social-icon"
                      title="发送邮件"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                    <a 
                      href="https://bgithub.xyz/terryzhangxr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-icon"
                      title="GitHub"
                    >
                      <img 
                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" 
                        alt="GitHub" 
                      />
                    </a>
                    <a 
                      href="https://space.bilibili.com/3546622533306643?spm_id_from=333.337.0.0"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-icon"
                      title="Bilibili"
                    >
                      <img 
                        src="https://www.bilibili.com/favicon.ico" 
                        alt="Bilibili" 
                        style={{ width: '20px', height: '20px' }}
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* 最新文章板块 */}
              <div className="sidebar-card p-6 rounded-xl">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  最新文章
                </h2>
                <ul className="space-y-4">
                  {allPostsData.slice(0, 5).map((post) => (
                    <li key={post.slug}>
                      <Link href={`/posts/${post.slug}`} passHref>
                        <a className="block text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <h3 className="text-lg font-semibold">{post.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {post.date}
                          </p>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* 文章列表 */}
          <main className="flex-1">
            <div className="grid gap-8">
              {paginatedPosts.map(({ slug, title, date, cover, excerpt, content, tags }) => (
                <article key={slug} className="article-card">
                  {cover && (
                    <div className="article-cover-container">
                      <img
                        src={cover}
                        alt={title}
                        className="article-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="article-content">
                    <span className="article-date">{date}</span>
                    <Link href={`/posts/${slug}`} passHref>
                      <a>
                        <h2 className="article-title">{title}</h2>
                      </a>
                    </Link>
                    <p className="article-excerpt line-clamp-4">
                      {excerpt || getExcerpt(content)}
                    </p>
                    <div className="article-footer">
                      {tags && tags.length > 0 && (
                        <div className="tag-container">
                          {tags.map((tag) => (
                            <Link key={tag} href={`/tags#${tag}`} passHref>
                              <a className="tag">
                                {tag}
                              </a>
                            </Link>
                          ))}
                        </div>
                      )}
                      <Link href={`/posts/${slug}`} passHref>
                        <a className="read-more">
                          阅读更多
                        </a>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 分页组件 */}
            {totalPages > 0 && (
              <div className="pagination">
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

        {/* 高级页脚 */}
        <footer className="footer mt-16 py-8 border-t border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center">
              <a href="/api/sitemap" className="inline-block">
                <img
                  src="https://cdn.us.mrche.top/sitemap.svg"
                  alt="Sitemap"
                  className="block mx-auto w-8 h-8 dark:invert"
                />
              </a>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                由Terryzhang&mrche创建的
                <a
                  href="https://bgithub.xyz/terryzhangxr/typace-i"
                  className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
                >
                  Typace
                </a>
                强势驱动
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
                联系我们
                <a
                  href="mailto:zhang@mrzxr.com"
                  className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
                >
                  zhang@mrzxr.com
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// 桌面导航链接组件
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="nav-link text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
      {children}
    </a>
  </Link>
);

// 移动端导航链接组件
const MobileNavLink = ({ href, children, onClick }) => (
  <Link href={href} passHref>
    <a 
      onClick={onClick}
      className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
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
