import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

export default function Home({ allPostsData }) {
  const canvasRef = useRef(null);
  const router = useRouter();

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); 
  const [wordIndex, setWordIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 移动端菜单状态
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

  // --- 矩阵浮动粒子系统 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    setTimeout(() => setShowHero(true), 200);

    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 40);
    });

    const wordTimer = setInterval(() => setWordIndex(p => (p + 1) % SCROLL_WORDS.length), 3000);

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
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, 0.3)`;
      const gap = 60;
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      const amplitude = 15;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const yOffset = Math.sin(time + (c * 0.3) + (r * 0.2)) * amplitude;
          const y = r * gap + yOffset;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
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
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  // 关闭移动端菜单
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>TYPACE — Order & Aesthetic</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />

      {/* 极简导航 */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity z-50">TYPACE</a></Link>
          
          {/* 桌面端链接 */}
          <div className="hidden md:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 opacity-40 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-lg w-8 h-8 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>

          {/* 移动端控制按钮 */}
          <div className="flex md:hidden items-center space-x-4 z-50">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 opacity-60"><SearchIcon /></button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* 移动端折叠菜单 Overlay */}
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-2xl transition-all duration-500 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-2xl font-black tracking-tighter uppercase">
            <Link href="/archive"><a onClick={closeMobileMenu} className="hover:text-blue-600 transition-colors">Archive</a></Link>
            <Link href="/tags"><a onClick={closeMobileMenu} className="hover:text-blue-600 transition-colors">Tags</a></Link>
            <Link href="/about"><a onClick={closeMobileMenu} className="hover:text-blue-600 transition-colors">About</a></Link>
            <div className="pt-8 flex items-center space-x-6">
               <button onClick={() => { toggleDarkMode(); closeMobileMenu(); }} className="text-sm border border-black/10 dark:border-white/10 px-6 py-2 rounded-full font-bold uppercase tracking-widest">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-48 pb-32">
        {/* Hero 区域 */}
        <header className="mb-44 overflow-hidden text-center md:text-left">
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <h1 className="text-[clamp(3rem,11vw,9.5rem)] leading-[0.82] font-black tracking-tighter mb-12">
              MAKING <br />
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
            <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono mx-auto md:mx-0">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-2xl shadow-black/5">
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
            <div className="flex gap-4 flex-wrap">
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
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 hidden sm:inline">System Phase {currentPage}</span>
          </div>
        )}
      </main>

      {/* 搜索 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4 md:px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input 
              autoFocus
              className="w-full bg-transparent border-b-4 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-colors uppercase"
              placeholder="Start Typing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="mt-8 md:mt-16 space-y-6 md:space-y-10">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="h-px w-6 bg-blue-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                      <span className="text-[10px] font-mono opacity-30 tracking-widest uppercase">{result.date}</span>
                    </div>
                    <h4 className="text-xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1440px] mx-auto px-10 py-24 flex flex-col md:flex-row justify-between items-center border-t border-black/5 dark:border-white/10">
        <div className="text-[9px] font-bold tracking-[0.5em] uppercase opacity-30 mb-8 md:mb-0">
          © Typace System Core 2026
        </div>
        <div className="flex space-x-8 text-[9px] font-black uppercase tracking-widest opacity-30">
          <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Github</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Email</a>
        </div>
      </footer>

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// --- 组件部分 ---

const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-6 md:p-10 flex flex-col justify-end group">
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale-[0.3] opacity-10 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[1200ms] ease-out"
          alt=""
        />
      </div>
      <div className="relative z-10">
        <div className="mb-4 md:mb-6 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 
          ${featured ? 'text-2xl md:text-7xl' : 'text-xl md:text-4xl'}`}>
          {post.title}
        </h3>
        {featured && (
          <p className="mt-4 md:mt-10 text-sm opacity-0 group-hover:opacity-60 transition-all duration-700 translate-y-6 group-hover:translate-y-0 line-clamp-2 max-w-xl font-medium leading-relaxed hidden sm:block">
            {post.excerpt || "Analyzing the intersection of functional programming and minimalist interface design..."}
          </p>
        )}
      </div>
      <div className="absolute top-6 right-6 md:top-10 md:right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
      </div>
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
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
