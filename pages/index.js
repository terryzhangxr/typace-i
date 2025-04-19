import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

// 每页显示的文章数量
const POSTS_PER_PAGE = 5;

export default function Home({ allPostsData }) {
  const router = useRouter();
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // 搜索框状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(allPostsData);

  // 暗黑模式状态
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 其他状态
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 计算文章总数和标签总数
  useEffect(() => {
    const total = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
    setTotalPages(total);
    updatePaginatedPosts(1);
  }, [allPostsData]);

  // 初始化分页
  useEffect(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setPaginatedPosts(allPostsData.slice(startIndex, endIndex));
  }, [currentPage, allPostsData]);

  // 搜索框过滤逻辑
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(allPostsData);
      return;
    }
    const filtered = allPostsData.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    setFilteredPosts(filtered);
  }, [searchQuery, allPostsData]);

  // 检测设备宽度
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理分页变化
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理搜索框打开/关闭
  const toggleSearch = () => {
    if (!isSearchOpen) {
      setSearchQuery('');
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <>
      {/* 样式定义 */}
      <style jsx global>{`
        /* 分页样式 */
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

        /* 响应式布局 */
        @media (max-width: 767px) {
          .cover-image-container {
            width: 100%;
            height: 200px;
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

        /* 动画样式 */
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

        /* 搜索一个 */
        .search-btn {
          width: 24px;
          height: 24px;
          margin-left: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        .search-btn:hover {
          opacity: 1;
        }
        .search-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-content {
          background-color: white;
          padding: 2rem;
          border-radius: 0.5rem;
          width: 60%;
          max-width: 800px;
        }
        .search-content.dark {
          background-color: #1f2937;
        }
        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .search-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
        }
        .search-input.dark {
          background-color: #1f2937;
          border-color: #4b5563;
          color: white;
        }
        .search-results {
          max-height: 500px;
          overflow-y: auto;
        }
        .search-item {
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }
        .search-item:hover {
          background-color: #f3f4f6;
        }
        .search-item.dark {
          border-color: #4b5563;
        }
        .search-item.dark:hover {
          background-color: #374151;
        }
      `}</style>

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
            <div className="hidden md:flex space-x-6">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
              {/* 搜索框按钮 */}
              <button 
                onClick={() => setIsSearchOpen(true)} 
                className="search-btn"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* 搜索表单 */}
      {isSearchOpen && (
        <div className="search-modal">
          <div className="search-content">
            <div className="search-header">
              <h2 className="text-2xl font-bold">搜索文章</h2>
              <button onClick={() => setIsSearchOpen(false)} className="search-close">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="搜索文章标题或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filteredPosts.length > 0 ? (
              <div className="search-results">
                {filteredPosts.slice(0, 10).map(post => (
                  <div key={post.slug} className="search-item">
                    <Link href={`/posts/${post.slug}`} passHref>
                      <a className="flex flex-col">
                        <span className="text-lg font-semibold">{post.title}</span>
                        {post.tags && (
                          <span className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {post.tags.join(', ')}
                          </span>
                        )}
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-600 dark:text-gray-400">
                没有找到匹配的文章
              </div>
            )}
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
                onClick={() => setIsDarkMode(!isDarkMode)}
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
      <div className={`min-h-screen p-8 pt-24 relative z-10 ${isMounted ? 'opacity-100 transform-none' : 'opacity-0 transform-y-4'}`}>
        <Head>
          <title>首页 - Typace</title>
        </Head>

        <header className="text-center mb-8">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
            Typace
          </h1>
          <div className="hitokoto-container">
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">石可破也，而不可夺坚；丹可磨也，而不可夺赤。</span>
            </p>
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="flex">
          {/* 左侧简介栏 */}
          <aside className="w-1/4 pr-8 hidden lg:block">
            {/* 简介板块和最新文章板块的容器 */}
            <div className="sticky top-24 space-y-6">
              {/* 简介板块 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
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
                          {allPostsData.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          文章
                        </div>
                      </a>
                    </Link>
                    <Link href="/tags" passHref>
                      <a className="text-center stats-card hover:transform hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {new Set(allPostsData.map(post => post.tags || []).flat()).size}
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
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
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
            <ul className="space-y-6">
              {paginatedPosts.map(({ slug, title, date, cover, excerpt, tags }) => (
                <li key={slug} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-[1.02]">
                  <div className="flex flex-col md:flex-row gap-6">
                    {cover && (
                      <div className="md:w-1/3 cover-image-container">
                        <img
                          src={cover}
                          alt={title}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/posts/${slug}`} passHref>
                        <a className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                          {title}
                        </a>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{date}</p>
                      {excerpt && (
                        <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                          {excerpt}
                        </p>
                      )}
                      {tags && tags.length > 0 && (
                        <div className="mt-4">
                          {tags.map((tag) => (
                            <Link key={tag} href={`/tags#${tag}`} passHref>
                              <a className="tag">
                                {tag}
                              </a>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

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
            强势驱动
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
              联系我们
            <a
              href="mailto:zhang@mrzxr.com"
              className="text-blue-600 hover:underline dark:text-blue-400"
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
