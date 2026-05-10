import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

// --- 全局配置区 ---
const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

// 自定义背景图配置（填入图片 URL 或相对路径，留空则使用默认极简纯色）
const BG_IMAGES = {
  light: "", 
  dark: ""   
};

export default function Home({ allPostsData, isDarkMode, toggleDarkMode, themeMounted }) {
  const canvasRef = useRef(null);
  const articlesRef = useRef(null);
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [displayText, setDisplayText] = useState(''); 
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isArticlesVisible, setIsArticlesVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentBgImage = isDarkMode ? BG_IMAGES.dark : BG_IMAGES.light;
  const hasCustomBg = !!currentBgImage;

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

  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => setShowHero(true), 150);

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsArticlesVisible(true); },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
    );
    if (articlesRef.current) observer.observe(articlesRef.current);

    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    let hitokotoTimer;
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      hitokotoTimer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(hitokotoTimer);
      }, 45);
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
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
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${colorRGB}, ${isDarkMode ? 0.35 : 0.25})`;
      
      const gap = 64;
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath();
          ctx.arc(x, r * gap + yOffset, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => { 
      clearInterval(hitokotoTimer);
      window.removeEventListener('resize', resize); 
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isDarkMode, isMobileMenuOpen, isSearchOpen]); 

  return (
    <div 
      className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}
      style={hasCustomBg ? {
        backgroundImage: `url('${currentBgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {hasCustomBg && (
        <div className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-700 ${isDarkMode ? 'bg-black/75' : 'bg-white/80'}`}></div>
      )}

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-100" />

      <Head>
        <title>TYPACE — Digital Order</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity z-50">TYPACE</a></Link>
          
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="w-5 h-5 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm focus:outline-none">
              {!themeMounted ? null : (isDarkMode ? '☼' : '☾')}
            </button>
          </div>

          <div className="flex md:hidden items-center space-x-4 z-50">
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-60 focus:outline-none"><SearchIcon /></button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 focus:outline-none">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div className={`fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full">
            <div className="flex flex-col space-y-6">
              <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)} index={1}>Home</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMobileMenuOpen(false)} index={2}>Archive</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMobileMenuOpen(false)} index={3}>Tags</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMobileMenuOpen(false)} index={4}>About</MobileNavLink>
            </div>
            <div className="mt-auto pb-16 border-t border-black/5 dark:border-white/10 pt-8 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Theme</span>
              <button onClick={toggleDarkMode} className="text-xs font-bold uppercase tracking-widest border border-black/10 dark:border-white/10 px-6 py-2 rounded-full active:scale-95 transition-all">
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 transition-all duration-700 ease-in-out ${isMobileMenuOpen ? 'blur-2xl scale-[0.97] pointer-events-none opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        
        <header className="min-h-screen pt-32 pb-24 flex flex-col justify-center relative">
          
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <h1 className="text-[clamp(3.8rem,11.5vw,13rem)] leading-none font-black tracking-tighter uppercase flex flex-col">
              
              <span className="block text-metallic pb-2 md:pb-4">
                BUILDING
              </span>

              <div className="relative my-2 md:my-4 h-[1em] w-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full flex flex-col animate-text-scroll">
                  {SCROLL_WORDS.map((w, index) => (
                    <div key={index} className="h-[1em] text-metallic-blue flex items-center leading-none">
                      {w}
                    </div>
                  ))}
                  <div aria-hidden="true" className="h-[1em] text-metallic-blue flex items-center leading-none">
                    {SCROLL_WORDS[0]}
                  </div>
                </div>
              </div>

            </h1>
          </div>

          {/* 底部信息条：移除了容器上多余的 px-6，让其完全贴合父级网格的左边缘 */}
          <div className={`absolute bottom-16 left-0 w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 transition-all duration-[1500ms] delay-500 ease-out ${showHero ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="max-w-md text-sm md:text-base font-mono leading-relaxed text-left">
              {displayText}<span className="inline-block w-2 md:w-2.5 h-4 md:h-5 bg-blue-600 ml-2 animate-pulse align-middle" />
            </p>
            
            {/* 系统状态：移动端靠左(items-start / text-left)，桌面端靠右(items-end / text-right) */}
            <div className="flex flex-col items-start md:items-end space-y-1.5 text-[9px] font-mono tracking-widest uppercase opacity-60 text-left md:text-right">
              <div className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <span>SYS.STATUS / ONLINE |</span>
                <span> Location / Shanghai</span>
              </div>
              <span className="opacity-60">All nodes operational</span>
            </div>
          </div>

        </header>

        <section 
          ref={articlesRef}
          className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0,0.2,1)] ${
            isArticlesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {paginatedPosts.map((post, idx) => {
              const isLarge = [0, 5, 8].includes(idx);
              return (
                <div key={post.slug} className={`${isLarge ? 'md:col-span-8' : 'md:col-span-4'} bg-white dark:bg-black min-h-[440px] relative group overflow-hidden`}>
                  <ArticleBox post={post} featured={isLarge} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-24 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-10 mb-10">
              <div className="flex gap-4">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                    className={`text-[10px] font-black transition-all border-b-2 pb-1 focus:outline-none ${currentPage === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-20 hover:opacity-100'}`}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-10 hidden sm:inline">Index Phase — {currentPage}</span>
            </div>
          )}
        </section>
      </main>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-2xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <input 
              autoFocus
              className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-all uppercase"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="mt-16 space-y-12 overflow-y-auto max-h-[60vh] pr-4">
              {searchResults.length > 0 ? searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <div className="flex items-center space-x-4 mb-2 opacity-30">
                      <span className="text-[9px] font-mono tracking-widest">{result.date}</span>
                    </div>
                    <h4 className="text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              )) : searchQuery && <p className="opacity-40 uppercase text-xs tracking-widest">No results found.</p>}
            </div>
          </div>
        </div>
      )}

      <footer className={`max-w-[1440px] mx-auto px-10 py-24 flex justify-between items-center opacity-20 text-[9px] font-bold tracking-[0.5em] uppercase border-t border-black/5 dark:border-white/10 transition-all ${isMobileMenuOpen ? 'blur-2xl' : 'blur-0'}`}>
        <span>© TYPACE SYSTEM 2026</span>
        <span className="hidden sm:inline">ENGINEERED FOR THE WEB</span>
      </footer>

      {/* =======================
          光泽与滚动样式
          ======================= */}
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }

        @keyframes text-scroll {
          0%, 15%   { transform: translateY(0); }
          20%, 35%  { transform: translateY(calc(-100% * 1 / 6)); }
          40%, 55%  { transform: translateY(calc(-100% * 2 / 6)); }
          60%, 75%  { transform: translateY(calc(-100% * 3 / 6)); }
          80%, 95%  { transform: translateY(calc(-100% * 4 / 6)); }
          100%      { transform: translateY(calc(-100% * 5 / 6)); }
        }

        .animate-text-scroll {
          animation: text-scroll 15s cubic-bezier(0.85, 0, 0.15, 1) infinite;
        }

        @keyframes metallic-shine {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .text-metallic {
          background: linear-gradient(105deg, 
            #6b7280 0%,     /* 灰 500 */
            #9ca3af 30%,    /* 灰 400 */
            #e5e7eb 50%,    /* 灰 200  */
            #9ca3af 70%,    /* 灰 400 */
            #6b7280 100%    /* 灰 500 */
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: metallic-shine 14s ease-in-out infinite;
        }

        .dark .text-metallic {
          background: linear-gradient(105deg, 
            #374151 0%,     /* 灰 700 */
            #6b7280 30%,    /* 灰 500 */
            #d1d5db 50%,    /* 灰 300  */
            #6b7280 70%,    /* 灰 500 */
            #374151 100%    /* 灰 700 */
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: metallic-shine 14s ease-in-out infinite;
        }

        .text-metallic-blue {
          background: linear-gradient(105deg, 
            #2563eb 0%, 
            #60a5fa 30%, 
            #bfdbfe 50%, 
            #60a5fa 70%, 
            #2563eb 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: metallic-shine 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// --- 子组件 ---

const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-8 md:p-12 flex flex-col justify-end group">
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale-[0.1] opacity-25 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[1500ms] ease-out"
          alt=""
        />
      </div>

      <div className="relative z-10">
        <div className="mb-4 md:mb-6 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 
          ${featured ? 'text-3xl md:text-7xl' : 'text-xl md:text-3xl'}`}>
          {post.title}
        </h3>
        {featured && (
          <p className="mt-8 md:mt-10 text-sm opacity-0 group-hover:opacity-60 transition-all duration-700 translate-y-6 group-hover:translate-y-0 line-clamp-2 max-w-xl font-medium leading-relaxed hidden sm:block">
            {post.excerpt || "Exploring the convergence of performance and aesthetics..."}
          </p>
        )}
      </div>

      <div className="absolute top-8 right-8 md:top-12 md:right-12 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3">
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
      </div>
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const MobileNavLink = ({ href, children, onClick, index }) => (
  <Link href={href}>
    <a 
      onClick={onClick} 
      className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block transform translate-x-0"
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {children}
    </a>
  </Link>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
