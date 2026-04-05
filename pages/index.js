import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 6;
// PayloadCMS 风格关键词
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

export default function Home({ allPostsData }) {
  const router = useRouter();
  const canvasRef = useRef(null);

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); // Hitokoto
  const [wordIndex, setWordIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 核心逻辑 ---
  const totalPages = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return allPostsData.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, allPostsData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || 
      post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // --- 副作用：粒子与动画 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    // 1. Hitokoto 打字机
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 50);
    });

    // 2. Payload 文字滚动计时器
    const wordTimer = setInterval(() => {
      setWordIndex(prev => (prev + 1) % SCROLL_WORDS.length);
    }, 2500);

    // 3. Canvas 粒子系统
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        if(p.x > canvas.width) p.x = 0; if(p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(wordTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className={`min-h-screen selection:bg-blue-500 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-white text-black'}`}>
      <Head>
        <title>TYPACE — Digital Rhythm</title>
      </Head>

      {/* 粒子背景 */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />

      {/* Vercel Style Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest">TYPACE</a></Link>
          <div className="flex items-center space-x-8 text-[12px] font-medium uppercase tracking-wider">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="opacity-50 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-base">{isDarkMode ? '○' : '●'}</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto px-8 pt-40 pb-20">
        {/* PayloadCMS 风格文字动画 */}
        <header className="mb-32">
          <h1 className="text-[clamp(3.5rem,10vw,9rem)] leading-[0.85] font-black tracking-tighter mb-10">
            CRAFTING <br />
            <div className="relative h-[1.1em] overflow-hidden">
              <div 
                className="transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{ transform: `translateY(-${wordIndex * 20}%)` }}
              >
                {SCROLL_WORDS.map((w) => (
                  <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                ))}
              </div>
            </div>
          </h1>
          <p className="max-w-xl text-lg opacity-50 font-medium font-mono">
            {displayText}<span className="animate-pulse">|</span>
          </p>
        </header>

        {/* Bento Grid 文章布局 */}
        <div className="grid grid-cols-12 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
          {paginatedPosts.map((post, idx) => (
            <div key={post.slug} className={`${idx === 0 ? 'col-span-12 md:col-span-8' : 'col-span-12 md:col-span-4'} bg-white dark:bg-black overflow-hidden group relative`}>
              <ArticleBox post={post} featured={idx === 0} />
            </div>
          ))}
        </div>

        {/* 极简分页 */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-start items-center space-x-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity disabled:hidden" disabled={currentPage === 1}>PREV</button>
            <span className="text-xs font-mono opacity-30">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity disabled:hidden" disabled={currentPage === totalPages}>NEXT</button>
          </div>
        )}
      </main>

      {/* 极简搜索框 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <input 
              autoFocus
              className="w-full bg-transparent border-b-2 border-black dark:border-white text-3xl font-black tracking-tighter outline-none pb-4"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="mt-8 space-y-6">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="block group" onClick={() => setIsSearchOpen(false)}>
                    <span className="text-xs opacity-40 font-mono mb-1 block">{result.date}</span>
                    <h4 className="text-xl font-bold group-hover:text-blue-500 transition-colors uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1400px] mx-auto px-8 py-20 border-t border-black/5 dark:border-white/10 flex flex-col md:flex-row justify-between items-center opacity-40 text-[10px] tracking-[0.3em] uppercase">
        <p>© {new Date().getFullYear()} TYPACE SYSTEM</p>
        <p>Built for the next generation</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .grid > div { border: 0.5px solid transparent; transition: border-color 0.3s; }
      `}</style>
    </div>
  );
}

// --- 现代 Bento 文章块组件 ---
const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full min-h-[450px] relative p-10 flex flex-col justify-end overflow-hidden group">
      {/* 背景图：默认灰度，悬停变色 */}
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 group-hover:scale-105 transition-all duration-1000"
          alt=""
        />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center space-x-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
            {post.date}
          </span>
          <div className="h-px w-0 group-hover:w-8 bg-blue-500 transition-all duration-500" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.9] uppercase transition-transform duration-500 group-hover:-translate-y-2 
          ${featured ? 'text-4xl md:text-6xl' : 'text-3xl'}`}>
          {post.title}
        </h3>
        <p className="mt-6 text-sm opacity-0 group-hover:opacity-60 transition-all duration-500 translate-y-4 group-hover:translate-y-0 line-clamp-2 max-w-md">
          {post.excerpt || "Explore the depth of this digital narrative..."}
        </p>
      </div>

      {/* 装饰性外边框线 */}
      <div className="absolute inset-0 border-[0px] group-hover:border-[1px] border-blue-500/30 transition-all pointer-events-none" />
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}>
    <a className="opacity-50 hover:opacity-100 transition-opacity">{children}</a>
  </Link>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
