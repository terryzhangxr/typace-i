import Link from 'next/link';
import { getSortedPostsData } from '../lib/posts';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ArchivePage({ postsByYear }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // 检测设备宽度
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // 暗色模式切换优化
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 动画和路由处理
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .page-container {
        opacity: 0;
        transform: translateY(200px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.1, 1);
      }
      .page-container.mounted {
        opacity: 1;
        transform: translateY(0);
      }

      /* 归档条目动画 */
      .archive-post {
        transition: all 0.3s ease;
      }
      .archive-post:hover {
        transform: translateX(10px);
      }

      /* 暗色模式优化 */
      .dark .archive-post {
        background-color: rgba(31, 41, 55, 0.8);
      }
      .dark .archive-post:hover {
        background-color: rgba(31, 41, 55, 0.9);
      }
    `;
    document.head.appendChild(style);

    // 初始化设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
    setIsMounted(true);

    // 初始化设备宽度检测
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 路由事件监听
    const handleRouteChange = () => setIsMounted(false);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      document.head.removeChild(style);
      router.events.off('routeChangeStart', handleRouteChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, [router]);

  return (
    <>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50 transition-colors duration-300">
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
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                {isDarkMode ? '🌙' : '☀️'}
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

      {/* 内容容器 */}
      <div className={`min-h-screen p-8 pt-24 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>归档 - Typace</title>
        </Head>

        <main className="mt-24">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 mb-8">
            归档
          </h1>
          <div className="space-y-8">
            {Object.keys(postsByYear).map(year => (
              <div key={year} className="archive-year">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{year}</h2>
                <ul className="space-y-4">
                  {postsByYear[year].map(({ slug, title, date }) => (
                    <li key={slug} className="archive-post bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-[1.02]">
                      <Link href={`/posts/${slug}`} passHref>
                        <a className="text-xl font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                          {title}
                        </a>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{date}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>

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
              href="https://www.mrche.top/typace"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Typace
            </a>
            强势驱动
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

  // 按年份分类文章
  const postsByYear = allPostsData.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(post);
    return acc;
  }, {});

  return {
    props: {
      postsByYear,
    },
  };
}
