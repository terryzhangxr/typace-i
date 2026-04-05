import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

export default function Home({ allPostsData }) {
  const canvasRef = useRef(null);

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); 
  const [wordIndex, setWordIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // --- 矩阵浮动粒子系统 (逻辑优化) ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    setTimeout(() => setShowHero(true), 200);

    // 1. Hitokoto
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 40);
    });

    // 2. Payload 文字滚动
    const wordTimer = setInterval(() => setWordIndex(p => (p + 1) % SCROLL_WORDS.length), 3000);

    // 3. 矩阵波动粒子 (Orderly Grid)
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
      time += 0.015; 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, 0.3)`;
      
      const gap = 64; 
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      const amplitude = 12; 

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * amplitude;
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

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>TYPACE — Engineered Aesthetics</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-100" />

      {/* 极简导航 */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity uppercase">TYPACE</a></Link>
          <div className="flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="w-5 h-5 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1440px] mx-auto px-10 pt-48 pb-32">
        {/* 开屏揭幕动画 Header */}
        <header className="mb-44 overflow-hidden">
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h1 className="text-[clamp(3.5rem,11vw,9.5rem)] leading-[0.82] font-black tracking-tighter mb-12">
              BUILDING <br />
              <div className="relative h-[1.1em] overflow-hidden">
                <div 
                  className="transition-transform duration-[1000ms] delay-300 ease-[cubic-bezier(0.85,0,0.15,1)]"
                  style={{ transform: `translateY(-${wordIndex * 20}%)` }}
                >
                  {SCROLL_WORDS.map((w) => (
                    <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                  ))}
                </div>
              </div>
            </h1>
          </div>
          
          <div className={`transition-all duration-[1800ms] delay-700 ease-out ${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </div>
        </header>

        {/* Vercel Bento Grid (10篇/页) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
          {paginatedPosts.map((post, idx) => {
            const gridClass = [0, 5, 8].includes(idx) ? 'md:col-span-8' : 'md:col-span-4';
            return (
              <div key={post.slug} className={`${gridClass} bg-white dark:bg-black min-h-[440px] relative group overflow-hidden`}>
                <ArticleBox post={post} featured={[0, 5, 8].includes(idx)} />
              </div>
            );
          })}
        </div>

        {/* 现代数字分页 */}
        {totalPages > 1 && (
          <div className="mt-24 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-10">
            <div className="flex gap-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className={`text-[10px] font-black transition-all border-b-2 pb-1 ${currentPage === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-20 hover:opacity-100'}`}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-10">Index Phase — {currentPage}</span>
          </div>
        )}
      </main>

      {/* 搜索系统 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-2xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <input 
              autoFocus
              className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-all uppercase"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="mt-16 space-y-12">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <div className="flex items-center space-x-4 mb-2 opacity-30">
                      <span className="text-[9px] font-mono tracking-widest">{result.date}</span>
                    </div>
                    <h4 className="text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1440px] mx-auto px-10 py-24 flex justify-between items-center opacity-20 text-[9px] font-bold tracking-[0.5em] uppercase">
        <span>© TYPACE CORE SYSTEM 2026</span>
        <span>ENGINEERED FOR THE WEB</span>
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

// --- 现代 Bento 文章块组件 ---
const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-12 flex flex-col justify-end group">
      {/* 调整后的封面：灰度更浅 (0.1)，透明度更高 (0.25) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale-[0.1] opacity-25 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[1500ms] ease-out"
          alt=""
        />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 
          ${featured ? 'text-4xl md:text-7xl' : 'text-2xl md:text-4xl'}`}>
          {post.title}
        </h3>
        {featured && (
          <p className="mt-10 text-sm opacity-0 group-hover:opacity-60 transition-all duration-700 translate-y-6 group-hover:translate-y-0 line-clamp-2 max-w-xl font-medium leading-relaxed">
            {post.excerpt || "Exploring the convergence of high-performance architecture and minimalist design principles..."}
          </p>
        )}
      </div>

      {/* 装饰性箭头 */}
      <div className="absolute top-12 right-12 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
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

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
