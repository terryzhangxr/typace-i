import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 5;

const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* 基础样式 */
    :root {
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --text: #111827;
      --text-secondary: #6b7280;
      --bg: #ffffff;
      --bg-secondary: #f9fafb;
      --border: #e5e7eb;
    }
    .dark {
      --primary: #93c5fd;
      --primary-hover: #60a5fa;
      --text: #f3f4f6;
      --text-secondary: #9ca3af;
      --bg: #1f2937;
      --bg-secondary: #374151;
      --border: #4b5563;
    }
    
    /* 布局样式 */
    .layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 6rem 1rem 2rem;
    }
    
    @media (min-width: 1024px) {
      .layout {
        grid-template-columns: 280px 1fr;
      }
    }
    
    /* 卡片样式 */
    .card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      border: 1px solid var(--border);
    }
    .dark .card {
      background: rgba(31, 41, 55, 0.8);
    }
    
    /* 文章网格 */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    @media (max-width: 640px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* 文章卡片 */
    .post-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
    .post-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .post-card:hover .post-image {
      transform: scale(1.05);
    }
    .post-content {
      padding: 1.25rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .post-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
      transition: color 0.2s;
    }
    .post-card:hover .post-title {
      color: var(--primary);
    }
    .post-meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
    }
    .post-excerpt {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.5;
      margin-bottom: 1rem;
      flex-grow: 1;
    }
    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .post-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 0.25rem;
      color: var(--primary);
    }
    .read-more {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary);
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }
    .read-more:hover {
      transform: translateX(3px);
    }
    
    /* 侧边栏 */
    .sidebar {
      display: none;
    }
    @media (min-width: 1024px) {
      .sidebar {
        display: block;
        position: sticky;
        top: 6rem;
      }
    }
    .profile-card {
      text-align: center;
      padding: 1.5rem;
    }
    .profile-avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(59, 130, 246, 0.5);
      margin: 0 auto 1rem;
      transition: all 0.3s ease;
    }
    .profile-avatar:hover {
      transform: scale(1.05);
    }
    .profile-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
    }
    .profile-bio {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }
    .profile-stats {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    /* 动态背景 */
    .bg-animation {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      opacity: 0.15;
      transition: background 8s ease;
    }
    .dark .bg-animation {
      opacity: 0.1;
    }
    
    /* 动画 */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.6s ease-out forwards;
    }
    
    /* 分页 */
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 3rem;
      gap: 0.5rem;
    }
    .page-link {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 0.375rem;
      transition: all 0.2s;
    }
    .page-link:hover {
      background: var(--bg-secondary);
    }
    .page-link.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .page-link.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 计算文章总数和标签总数
  const totalPosts = allPostsData.length;
  const allTags = new Set();
  allPostsData.forEach(post => {
    if (post.tags) post.tags.forEach(tag => allTags.add(tag));
  });
  const totalTags = allTags.size;

  // 初始化分页
  useEffect(() => {
    const total = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
    setTotalPages(total);
    updatePaginatedPosts(1);
    
    // 从本地存储获取暗黑模式设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
    
    setIsMounted(true);
  }, []);

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

    const results = allPostsData.filter(post => {
      const query = searchQuery.toLowerCase();
      const titleMatch = post.title.toLowerCase().includes(query);
      const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(query);
      const contentMatch = post.content && post.content.toLowerCase().includes(query);
      const tagMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
      
      return titleMatch || excerptMatch || contentMatch || tagMatch;
    }).map(post => ({
      ...post,
      highlightedTitle: highlightText(post.title, searchQuery),
      highlightedExcerpt: post.excerpt ? highlightText(post.excerpt, searchQuery) : '',
    }));

    setSearchResults(results);
  }, [searchQuery, allPostsData]);

  // 高亮匹配文本
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 动态背景效果
  useEffect(() => {
    addDynamicStyles();
    
    const bgContainer = document.createElement('div');
    bgContainer.className = 'bg-animation';
    document.body.appendChild(bgContainer);
    
    const colors = [
      '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8',
      '#0ea5e9', '#0284c7', '#0369a1', '#075985'
    ];
    
    let currentIndex = 0;
    
    const updateBackground = () => {
      const nextIndex = (currentIndex + 1) % colors.length;
      bgContainer.style.background = `radial-gradient(circle at 10% 20%, ${colors[currentIndex]}, ${colors[nextIndex]})`;
      currentIndex = nextIndex;
    };
    
    updateBackground();
    const interval = setInterval(updateBackground, 8000);
    
    return () => {
      clearInterval(interval);
      bgContainer.remove();
    };
  }, []);

  return (
    <>
      {/* 导航栏 - 保持原始样式 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            <div className="hidden md:flex space-x-6 items-center">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={() => setIsSearchOpen(true)}
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

            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(true)}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-start pt-20 backdrop-filter backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(post => (
                  <div 
                    key={post.slug} 
                    className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      router.push(`/posts/${post.slug}`);
                      setIsSearchOpen(false);
                    }}
                  >
                    <h3 
                      className="font-medium text-gray-900 dark:text-gray-100"
                      dangerouslySetInnerHTML={{ __html: post.highlightedTitle }}
                    />
                    {post.highlightedExcerpt && (
                      <p 
                        className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                        dangerouslySetInnerHTML={{ __html: post.highlightedExcerpt }}
                      />
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{post.date}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? '没有找到匹配的文章' : '输入关键词搜索文章'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden">
          <div className="absolute right-0 top-16 w-64 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300">
            <div className="p-4">
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="mt-8 space-y-2">
                <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>首页</MobileNavLink>
                <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>关于</MobileNavLink>
                <MobileNavLink href="/archive" onClick={() => setIsMenuOpen(false)}>归档</MobileNavLink>
                <MobileNavLink href="/tags" onClick={() => setIsMenuOpen(false)}>标签</MobileNavLink>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span>切换主题</span>
                  <span>{isDarkMode ? '🌙' : '☀️'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 页面内容 */}
      <div className={`min-h-screen ${isMounted ? 'animate-fadeIn' : ''}`}>
        <Head>
          <title>首页 - Typace</title>
        </Head>

        <div className="layout">
          {/* 侧边栏 */}
          <aside className="sidebar">
            <div className="card profile-card">
              <img 
                src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                alt="博主头像" 
                className="profile-avatar"
              />
              <h2 className="profile-name">Typace</h2>
              <p className="profile-bio">theme typace team</p>
              
              <div className="profile-stats">
                <Link href="/archive" passHref>
                  <a className="stat">
                    <div className="stat-number">{totalPosts}</div>
                    <div className="stat-label">文章</div>
                  </a>
                </Link>
                <Link href="/tags" passHref>
                  <a className="stat">
                    <div className="stat-number">{totalTags}</div>
                    <div className="stat-label">标签</div>
                  </a>
                </Link>
              </div>
            </div>
          </aside>

          {/* 主内容区 */}
          <main>
            {/* 文章网格 */}
            <div className="posts-grid">
              {paginatedPosts.map((post) => (
                <Link key={post.slug} href={`/posts/${post.slug}`} passHref>
                  <a className="card post-card">
                    {post.cover && (
                      <img 
                        src={post.cover} 
                        alt={post.title} 
                        className="post-image"
                        loading="lazy"
                      />
                    )}
                    <div className="post-content">
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-meta">{post.date}</p>
                      <p className="post-excerpt">
                        {post.excerpt || post.content.substring(0, 120) + '...'}
                      </p>
                      <div className="post-footer">
                        {post.tags && post.tags.length > 0 && (
                          <div className="post-tags">
                            {post.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="post-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                        <span className="read-more">
                          阅读更多
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="page-link"
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`page-link ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="page-link"
                  disabled={currentPage === totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </main>
        </div>

        {/* 页脚 */}
        <footer className="text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="container mx-auto px-4">
            <p className="text-gray-600 dark:text-gray-400">
              由MRCHE&terryzhang创建的
              <a
                href="https://bgithub.xyz/terryzhangxr/typace-i"
                className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
              >
                Typace
              </a>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              联系我们
              <a
                href="mailto:zhang@mrzxr.com"
                className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
              >
                zhang@mrzxr.com
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// 导航链接组件
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
      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
