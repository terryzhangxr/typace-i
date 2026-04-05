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
  const [showHero, setShowHero] = useState(false); // 控制文字开屏动画
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

  // --- 粒子系统与动画副作用 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    // 延时触发开屏文字动画
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

    // 3. 强化版粒子系统 (带连线)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, 0.15)`;
      
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for(let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if(dist < 100) {
            ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - dist/100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();

    return () => { clearInterval(wordTimer); window.removeEventListener('resize', resize); };
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
        <title>TYPACE — Digital Excellence</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 极简导航 */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity">TYPACE</a></Link>
          <div className="flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-2"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-lg w-6 h-6 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 transition-transform active:scale-90">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1440px] mx-auto px-10 pt-48 pb-32">
        {/* 开屏文字动画 Header */}
        <header className="mb-40 overflow-hidden">
          <div className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <h1 className="text-[clamp(3rem,12vw,10rem)] leading-[0.8] font-black tracking-tighter mb-12">
              STAY <br />
              <div className="relative h-[1.1em] overflow-hidden">
                <div 
                  className={`transition-all duration-[1000ms] delay-300 ease-[cubic-bezier(0.85,0,0.15,1)] ${showHero ? 'translate-y-0' : 'translate-y-12'}`}
                  style={{ transform: showHero ? `translateY(-${wordIndex * 20}%)` : 'translateY(100%)' }}
                >
                  {SCROLL_WORDS.map((w) => (
                    <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                  ))}
                </div>
              </div>
            </h1>
          </div>
          
          <div className={`transition-all duration-[1500ms] delay-500 ease-out ${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="max-w-xl text-base font-medium leading-relaxed italic">
              "{displayText}"<span className="inline-block w-1.5 h-4 bg-blue-500 ml-1 animate-pulse" />
            </p>
          </div>
        </header>

        {/* Bento Grid (每页10篇) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {paginatedPosts.map((post, idx) => {
            const gridClass = [0, 5, 8].includes(idx) ? 'md:col-span-8' : 'md:col-span-4';
            return (
              <div 
                key={post.slug} 
                className={`${gridClass} min-h-[400px] border border-black/5 dark:border-white/10 hover:border-blue-500/50 transition-all duration-500 group relative bg-white dark:bg-[#050505]`}
                style={{ transitionDelay: `${idx * 50}ms` }} // 文章块也增加微小的交错感
              >
                <ArticleBox post={post} featured={[0, 5, 8].includes(idx)} />
              </div>
            );
          })}
        </div>

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="mt-24 pt-12 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className={`text-xs font-mono w-8 h-8 flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-black text-white dark:bg-white dark:text-black' : 'opacity-30 hover:opacity-100'}`}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-30">
              Page {currentPage} / {totalPages}
            </div>
          </div>
        )}
      </main>

      {/* 搜索模态框 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-6">
          <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-md" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-top-8 duration-500">
            <input 
              autoFocus
              className="w-full bg-transparent border-b border-black/20 dark:border-white/20 text-4xl font-black tracking-tighter outline-none pb-6 focus:border-blue-500 transition-colors"
              placeholder="SEARCH CONTENT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="mt-12 space-y-8">
              {searchResults.length > 0 ? searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <span className="text-[10px] font-mono opacity-30 mb-2 block tracking-widest">{result.date}</span>
                    <h4 className="text-2xl font-bold group-hover:text-blue-500 transition-colors uppercase tracking-tight">{result.title}</h4>
                  </a>
                </Link>
              )) : searchQuery && <p className="opacity-30 uppercase text-xs tracking-widest">No results found.</p>}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1440px] mx-auto px-10 py-20 opacity-30 text-[9px] tracking-[0.4em] uppercase flex justify-between items-center">
        <span>© TYPACE SYSTEM — 2026</span>
        <span>DESIGNED FOR FUTURE INTERFACES</span>
      </footer>

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.5); }
      `}</style>
    </div>
  );
}

// --- 现代 Bento 文章块组件 ---
const ArticleBox = ({ post, featured }) => (
  <Link href={`/posts/${post.slug}`}>
    <a className="block h-full relative p-8 flex flex-col justify-end overflow-hidden group">
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale-[0.3] opacity-10 group-hover:grayscale-0 group-hover:opacity-50 group-hover:scale-105 transition-all duration-[1500ms] ease-out"
          alt=""
        />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-12 bg-blue-500 transition-all duration-700" />
        </div>
        <h3 className={`font-black tracking-tighter leading-[0.95] uppercase transition-all duration-500 group-hover:text-blue-500 
          ${featured ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'}`}>
          {post.title}
        </h3>
        {featured && (
          <p className="mt-8 text-sm opacity-0 group-hover:opacity-50 transition-all duration-700 translate-y-4 group-hover:translate-y-0 line-clamp-2 max-w-lg leading-relaxed font-medium">
            {post.excerpt || "Dive deeper into the technical philosophy and architectural decisions behind this publication..."}
          </p>
        )}
      </div>

      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0 text-blue-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </div>
    </a>
  </Link>
);

const NavLink = ({ href, children }) => (
  <Link href={href}>
    <a className="opacity-40 hover:opacity-100 transition-opacity">{children}</a>
  </Link>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 hover:opacity-100 transition-opacity">
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
