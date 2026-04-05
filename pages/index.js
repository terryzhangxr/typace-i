import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

export default function Home({ allPostsData }) {
  const canvasRef = useRef(null);
  const articlesRef = useRef(null);

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); 
  const [wordIndex, setWordIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isArticlesVisible, setIsArticlesVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 分页逻辑 ---
  const totalPages = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return allPostsData.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, allPostsData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // --- 核心副作用 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    setTimeout(() => setShowHero(true), 200);

    // 1. 滚动监听
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsArticlesVisible(true); },
      { threshold: 0.05 }
    );
    if (articlesRef.current) observer.observe(articlesRef.current);

    // 2. 移动端菜单开启时锁定背景滚动
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 3. 打字机 & 单词滚动
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 40);
    });
    const wordTimer = setInterval(() => setWordIndex(p => (p + 1) % SCROLL_WORDS.length), 3000);

    // 4. 粒子系统
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${colorRGB}, ${isDarkMode ? 0.3 : 0.2})`;
      const gap = 60;
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const yOffset = Math.sin(time + (c * 0.3) + (r * 0.2)) * 15;
          ctx.beginPath();
          ctx.arc(x, r * gap + yOffset, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => { 
      clearInterval(wordTimer); 
      window.removeEventListener('resize', resize); 
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isDarkMode, isMobileMenuOpen]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>TYPACE — Engineered Aesthetics</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />

      {/* 现代导航栏 */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity z-50">TYPACE</a></Link>
          
          {/* 桌面端链接 */}
          <div className="hidden md:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-lg w-8 h-8 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>

          {/* 移动端汉堡按钮 */}
          <div className="flex md:hidden items-center space-x-2 z-50">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 focus:outline-none">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* 移动端全屏菜单 */}
        <div className={`fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full">
            <div className="flex flex-col space-y-6">
              <MobileNavLink href="/" onClick={closeMobileMenu} index={1}>Home</MobileNavLink>
              <MobileNavLink href="/archive" onClick={closeMobileMenu} index={2}>Archive</MobileNavLink>
              <MobileNavLink href="/tags" onClick={closeMobileMenu} index={3}>Tags</MobileNavLink>
              <MobileNavLink href="/about" onClick={closeMobileMenu} index={4}>About</MobileNavLink>
            </div>
            
            <div className="mt-auto pb-16 flex flex-col space-y-8">
              <button onClick={() => { setIsSearchOpen(true); closeMobileMenu(); }} className="flex items-center space-x-4 text-sm font-bold uppercase tracking-widest opacity-60">
                <SearchIcon /> <span>Search Terminal</span>
              </button>
              <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-8">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Theme</span>
                <button onClick={toggleDarkMode} className="text-xs border border-black/10 dark:border-white/10 px-6 py-2 rounded-full font-bold uppercase tracking-widest">
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容容器：
          当 isMobileMenuOpen 为 true 时，应用 blur-2xl 和微缩放 scale-95
      */}
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-48 pb-32 transition-all duration-700 ease-in-out ${isMobileMenuOpen ? 'blur-2xl scale-[0.96] pointer-events-none' : 'blur-0 scale-100'}`}>
        
        <header className="min-h-[50vh] flex flex-col justify-center mb-32 md:mb-64">
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <h1 className="text-[clamp(3.2rem,11vw,10rem)] leading-[0.82] font-black tracking-tighter mb-12">
              BEYOND <br />
              <div className="relative h-[1.1em] overflow-hidden">
                <div 
                  className="transition-transform duration-[1000ms] delay-300 ease-[cubic-bezier(0.8,0,0.2,1)]"
                  style={{ transform: `translateY(-${wordIndex * 20}%)` }}
                >
                  {SCROLL_WORDS.map((w) => (
                    <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                  ))}
                </div>
              </div>
            </h1>
          </div>
          <div className={`transition-all duration-[1800ms] delay-700 ease-out ${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </div>
        </header>

        <section 
          ref={articlesRef}
          className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0,0.2,1)] ${
            isArticlesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-2xl shadow-black/5">
            {paginatedPosts.map((post, idx) => {
              const gridClass = [0, 5, 8].includes(idx) ? 'md:col-span-8' : 'md:col-span-4';
              return (
                <div key={post.slug} className={`${gridClass} bg-white dark:bg-black min-h-[420px] relative group overflow-hidden`}>
                  <ArticleBox post={post} featured={[0, 5, 8].includes(idx)} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-24 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-10">
              <div className="flex gap-4">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                    className={`text-xs font-black transition-all border-b-2 ${currentPage === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-30 hover:opacity-100'}`}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 hidden sm:inline">Phase {currentPage}</span>
            </div>
          )}
        </section>
      </main>

      {/* 搜索 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input autoFocus className="w-full bg-transparent border-b-4 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-colors uppercase" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="mt-16 space-y-8 text-left">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <span className="text-[10px] font-mono opacity-30 tracking-widest uppercase mb-1 block">{result.date}</span>
                    <h4 className="text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className={`max-w-[1440px] mx-auto px-10 py-24 border-t border-black/5 dark:border-white/10 opacity-20 text-[9px] font-black uppercase tracking-[0.4em] flex justify-between transition-all duration-700 ${isMobileMenuOpen ? 'blur-2xl' : 'blur-0'}`}>
        <span>© Typace 2026</span>
        <span className="hidden sm:inline">Minimalist System</span>
      </footer>

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.5); }
      `}</style>
    </div>
  );
}

// --- 保持原风格的组件 ---

const MobileNavLink = ({ href, children, onClick, index }) => (
  <Link href={href}>
    <a 
      onClick={onClick} 
      className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block"
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {children}
    </a>
  </Link>
);

const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-10 flex flex-col justify-end group">
      <div className="absolute inset-0 z-0">
        <img src={post.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} className="w-full h-full object-cover grayscale-[0.3] opacity-10 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[1200ms] ease-out" alt="" />
      </div>
      <div className="relative z-10 text-left">
        <div className="mb-4 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 ${featured ? 'text-3xl md:text-7xl' : 'text-xl md:text-4xl'}`}>{post.title}</h3>
      </div>
      <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
      </div>
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
}import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

export default function Home({ allPostsData }) {
  const canvasRef = useRef(null);
  const articlesRef = useRef(null);

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); 
  const [wordIndex, setWordIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isArticlesVisible, setIsArticlesVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 分页逻辑 ---
  const totalPages = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return allPostsData.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, allPostsData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // --- 副作用控制 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    setTimeout(() => setShowHero(true), 200);

    // 1. 滚动监听
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsArticlesVisible(true); },
      { threshold: 0.05 }
    );
    if (articlesRef.current) observer.observe(articlesRef.current);

    // 2. 打字机
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 40);
    });

    // 3. 单词滚动
    const wordTimer = setInterval(() => setWordIndex(p => (p + 1) % SCROLL_WORDS.length), 3000);

    // 4. 矩阵粒子 (增强可见度)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${colorRGB}, ${isDarkMode ? 0.3 : 0.2})`;
      
      const gap = 60;
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const yOffset = Math.sin(time + (c * 0.3) + (r * 0.2)) * 15;
          ctx.beginPath();
          ctx.arc(x, r * gap + yOffset, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => { 
      clearInterval(wordTimer); 
      window.removeEventListener('resize', resize); 
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>TYPACE — Digital Interface</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />

      {/* 现代导航栏 */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity z-50">TYPACE</a></Link>
          
          {/* 桌面端菜单 */}
          <div className="hidden md:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-lg w-8 h-8 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>

          {/* 移动端汉堡按钮 */}
          <div className="flex md:hidden items-center space-x-2 z-50">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 focus:outline-none">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* 移动端全屏折叠菜单 */}
        <div className={`fixed inset-0 bg-white dark:bg-black transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full">
            <div className="flex flex-col space-y-6">
              <MobileNavLink href="/" onClick={closeMobileMenu} index={1}>Home</MobileNavLink>
              <MobileNavLink href="/archive" onClick={closeMobileMenu} index={2}>Archive</MobileNavLink>
              <MobileNavLink href="/tags" onClick={closeMobileMenu} index={3}>Tags</MobileNavLink>
              <MobileNavLink href="/about" onClick={closeMobileMenu} index={4}>About</MobileNavLink>
            </div>
            
            <div className="mt-auto pb-16 flex flex-col space-y-8">
              <button 
                onClick={() => { setIsSearchOpen(true); closeMobileMenu(); }} 
                className="flex items-center space-x-4 text-sm font-bold uppercase tracking-widest opacity-60"
              >
                <SearchIcon /> <span>Search Terminal</span>
              </button>
              
              <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-8">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Theme</span>
                <button onClick={toggleDarkMode} className="text-xs border border-black/10 dark:border-white/10 px-6 py-2 rounded-full font-bold uppercase tracking-widest">
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-48 pb-32">
        {/* Hero 区域 */}
        <header className="min-h-[50vh] flex flex-col justify-center mb-32 md:mb-64">
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <h1 className="text-[clamp(3.2rem,11vw,10rem)] leading-[0.82] font-black tracking-tighter mb-12">
              BEYOND <br />
              <div className="relative h-[1.1em] overflow-hidden">
                <div 
                  className="transition-transform duration-[1000ms] delay-300 ease-[cubic-bezier(0.8,0,0.2,1)]"
                  style={{ transform: `translateY(-${wordIndex * 20}%)` }}
                >
                  {SCROLL_WORDS.map((w) => (
                    <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                  ))}
                </div>
              </div>
            </h1>
          </div>
          <div className={`transition-all duration-[1800ms] delay-700 ease-out ${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </div>
        </header>

        {/* 文章区域 */}
        <section 
          ref={articlesRef}
          className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0,0.2,1)] ${
            isArticlesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-2xl shadow-black/5">
            {paginatedPosts.map((post, idx) => {
              const gridClass = [0, 5, 8].includes(idx) ? 'md:col-span-8' : 'md:col-span-4';
              return (
                <div key={post.slug} className={`${gridClass} bg-white dark:bg-black min-h-[420px] relative group overflow-hidden`}>
                  <ArticleBox post={post} featured={[0, 5, 8].includes(idx)} />
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-24 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-10">
              <div className="flex gap-4">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                    className={`text-xs font-black transition-all border-b-2 ${currentPage === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-30 hover:opacity-100'}`}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 hidden sm:inline">Phase {currentPage}</span>
            </div>
          )}
        </section>
      </main>

      {/* 搜索 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input autoFocus className="w-full bg-transparent border-b-4 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-colors uppercase" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="mt-16 space-y-8">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <span className="text-[10px] font-mono opacity-30 tracking-widest uppercase mb-1 block">{result.date}</span>
                    <h4 className="text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1440px] mx-auto px-10 py-24 border-t border-black/5 dark:border-white/10 opacity-20 text-[9px] font-black uppercase tracking-[0.4em] flex justify-between">
        <span>© Typace 2026</span>
        <span>Minimalist Architecture</span>
      </footer>

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.5); }
      `}</style>
    </div>
  );
}

// --- 子组件 ---

const MobileNavLink = ({ href, children, onClick, index }) => (
  <Link href={href}>
    <a 
      onClick={onClick} 
      className={`text-4xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 transform ${true ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </a>
  </Link>
);

const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-10 flex flex-col justify-end group">
      <div className="absolute inset-0 z-0">
        <img src={post.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} className="w-full h-full object-cover grayscale-[0.3] opacity-10 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[1200ms] ease-out" alt="" />
      </div>
      <div className="relative z-10">
        <div className="mb-4 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 ${featured ? 'text-3xl md:text-7xl' : 'text-xl md:text-4xl'}`}>{post.title}</h3>
      </div>
      <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
      </div>
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
