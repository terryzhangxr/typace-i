import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 5;

const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Enhanced splash animation */
    @keyframes charFadeIn {
      0% {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
        filter: blur(2px);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }
    
    @keyframes charFadeOut {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
      }
    }
    
    .splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: white;
      z-index: 9999;
      font-family: 'Poppins', 'HarmonyOS Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity;
    }
    
    .splash-screen.dark {
      background: #111827;
    }
    
    .splash-screen.hidden {
      opacity: 0;
      pointer-events: none;
    }
    
    .splash-title {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-align: center;
      color: #1f2937;
      font-variation-settings: 'wght' 700;
      letter-spacing: -0.025em;
      will-change: transform, opacity;
    }
    
    .dark .splash-title {
      color: #f3f4f6;
    }
    
    .splash-char {
      display: inline-block;
      opacity: 0;
      transform-origin: bottom center;
      animation: charFadeIn 0.8s cubic-bezier(0.5, 1, 0.89, 1) forwards;
    }
    
    .splash-char.fade-out {
      animation: charFadeOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Pagination styles */
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

    /* Page transition animations */
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

    /* Background gradient transitions */
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

    /* Responsive layout */
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
      .splash-title {
        font-size: 2.5rem;
      }
    }

    /* Typewriter effect */
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

    /* Other styles */
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

    /* Page container animation */
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

    /* Tag styles */
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

    /* Profile card styles */
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
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [transitionState, setTransitionState] = useState('idle');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hitokoto, setHitokoto] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Splash screen states
  const [showSplash, setShowSplash] = useState(false);
  const [splashChars, setSplashChars] = useState([]);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Calculate total posts and tags
  const totalPosts = allPostsData.length;
  const allTags = new Set();
  allPostsData.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });
  const totalTags = allTags.size;

  // Initialize pagination
  useEffect(() => {
    const total = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
    setTotalPages(total);
    updatePaginatedPosts(1);
  }, [allPostsData]);

  // Check if splash screen should be shown
  useEffect(() => {
    // Only show splash on initial load or refresh
    if (typeof window !== 'undefined' && window.performance) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && (navEntries[0].type === 'reload' || navEntries[0].type === 'navigate')) {
        setShowSplash(true);
        initSplashAnimation();
      }
    }
  }, []);

  // Initialize splash animation
  const initSplashAnimation = () => {
    const title = "Typace";
    const chars = title.split('').map((char, index) => ({
      char,
      id: index,
      className: 'splash-char',
      style: { 
        animationDelay: `${index * 0.08}s`,
        willChange: 'transform, opacity'
      }
    }));
    setSplashChars(chars);

    // Fade out after animation completes
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => setShowSplash(false), 800);
    }, title.length * 80 + 1800);

    return () => clearTimeout(timer);
  };

  // Update paginated posts
  const updatePaginatedPosts = (page) => {
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setPaginatedPosts(allPostsData.slice(startIndex, endIndex));
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updatePaginatedPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update fade out state
  useEffect(() => {
    if (isFadingOut) {
      setSplashChars(prev => prev.map(char => ({
        ...char,
        className: 'splash-char fade-out',
        style: { ...char.style, animationDelay: '0s' }
      })));
    }
  }, [isFadingOut]);

  // Initialize page
  useEffect(() => {
    addDynamicStyles();

    // Get dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);

    // Fetch hitokoto
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((data) => {
        setHitokoto(data.hitokoto);
        typeWriterEffect(data.hitokoto);
      })
      .catch((error) => {
        console.error('Error fetching hitokoto:', error);
        const defaultHitokoto = '生活不止眼前的苟且，还有诗和远方的田野。';
        setHitokoto(defaultHitokoto);
        typeWriterEffect(defaultHitokoto);
      });

    // Route change handlers
    const handleRouteChangeStart = () => {
      setTransitionState('exiting');
      setIsMounted(false);
    };

    const handleRouteChangeComplete = () => {
      setTransitionState('entering');
      setTimeout(() => {
        setTransitionState('idle');
        setIsMounted(true);
      }, 300);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Initialize page animation
    setIsMounted(true);

    // Check mobile view
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      window.removeEventListener('resize', checkMobile);
    };
  }, [router]);

  // Check mobile view
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Typewriter effect
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

  // Background gradient animation
  useEffect(() => {
    const lightColors = [
      'linear-gradient(45deg, #ee7752, #e73c7e)',
      'linear-gradient(45deg, #e73c7e, #23a6d5)',
      'linear-gradient(45deg, #23a6d5, #23d5ab)',
      'linear-gradient(45deg, #23d5ab, #ee7752)',
    ];

    const darkColors = [
      'linear-gradient(45deg, #1e3a8a, #9f7aea)',
      'linear-gradient(45deg, #9f7aea, #3b82f6)',
      'linear-gradient(45deg, #3b82f6, #60a5fa)',
      'linear-gradient(45deg, #60a5fa, #1e3a8a)',
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Get transition class
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
      {/* Splash screen */}
      {showSplash && (
        <div className={`splash-screen ${isDarkMode ? 'dark' : ''}`}>
          <h1 className="splash-title">
            {splashChars.map(({ char, id, className, style }) => (
              <span key={id} className={className} style={style}>
                {char}
              </span>
            ))}
          </h1>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            {/* Desktop navigation */}
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

            {/* Mobile menu button */}
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

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/20 dark:bg-black/40 transition-opacity ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Menu content */}
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

      {/* Page content */}
      <div className={`min-h-screen p-8 pt-24 relative z-10 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>首页 - Typace</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=HarmonyOS+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        </Head>

        <header className="text-center mb-8">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
            Typace
          </h1>
          <div className="hitokoto-container">
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">{displayText}</span>
            </p>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex">
          {/* Left sidebar */}
          <aside className="w-1/4 pr-8 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Profile card */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <div className="flex flex-col items-center">
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
                </div>
              </div>

              {/* Recent posts */}
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

          {/* Article list */}
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

            {/* Pagination */}
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

        {/* Footer */}
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

// Desktop nav link component
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
      {children}
    </a>
  </Link>
);

// Mobile nav link component
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
