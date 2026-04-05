import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 10;
const SCROLL_WORDS = ["Modern", "Scalable", "Performant", "Minimalist", "Elegant"];

// 粒子系统配置
const PARTICLE_CONFIG = {
  gap: 50, // 粒子之间的间距（越小越密）
  baseAlpha: 0.35, // 粒子默认透明度（0-1之间）
  hoverAlpha: 0.8, // 鼠标悬停时的透明度
  radius: 1.5, // 粒子大小
  speed: 0.015, // 粒子运动速度
  amplitude: 12, // 浮动幅度
};

export default function Home({ allPostsData }) {
  const canvasRef = useRef(null);

  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState(''); // Hitokoto
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

    // 延时触发开屏文字动画
    setTimeout(() => setShowHero(true), 200);

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

    // 3. Canvas 粒子系统 (强化明显度)
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

    // 初始化粒子阵列 (Bento 风格矩阵排列)
    const render = () => {
      time += PARTICLE_CONFIG.speed; 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = \`rgba(\${color}, \${PARTICLE_CONFIG.baseAlpha})\`;
      
      const gap = PARTICLE_CONFIG.gap; 
      const rows = Math.ceil(canvas.height / gap) + 1;
      const cols = Math.ceil(canvas.width / gap) + 1;
      const amplitude = PARTICLE_CONFIG.amplitude; 

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          // 正弦波动逻辑：基于行和列产生相位差
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * amplitude;
          const y = r * gap + yOffset;

          ctx.beginPath();
          ctx.arc(x, y, PARTICLE_CONFIG.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(wordTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
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
    <div className={\`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 \${isDarkMode ? 'dark bg-black text-white' : 'bg-white text-black'}\`}>
      <Head>
        <title>TYPACE — Digital Symphony</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      {/* 强化后的矩阵粒子背景 */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Vercel Style Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity uppercase">TYPACE</a></Link>
          <div className="flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.2em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 opacity-40 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="text-base w-6 h-6 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 active:scale-95 transition-all">
              {isDarkMode ? '○' : '●'}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1440px] mx-auto px-10 pt-48 pb-32 flex flex-col lg:flex-row gap-16">
        {/* 左侧侧边栏 - 强化后的头像与新增社交按钮 */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="p-8 rounded-[1rem] bg-white/70 dark:bg-black/70 backdrop-blur-lg border border-black/5 dark:border-white/10 shadow-2xl shadow-black/5">
            {/* 头像容器：更突出，增加亮度和环 */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <img 
                src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                className="w-full h-full rounded-full object-cover ring-2 ring-blue-500/20 dark:ring-white/20 shadow-2xl brightness-110 dark:brightness-125 transition-all group-hover:brightness-100"
                alt="Typace Team Headshot"
              />
            </div>
            <h2 className="text-center text-xl font-bold mb-1 uppercase tracking-tight">Typace Team</h2>
            <p className="text-center text-xs opacity-50 mb-6 tracking-widest uppercase">Digital Aesthetics</p>
            
            <div className="grid grid-cols-2 gap-px bg-black/5 dark:bg-white/10 border-t border-black/5 dark:border-white/10 pt-6">
              <div className="text-center py-2">
                <p className="text-3xl font-black text-blue-600">{allPostsData.length}</p>
                <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Articles</p>
              </div>
              <div className="text-center py-2">
                <p className="text-3xl font-black text-blue-600">8</p>
                <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Tags</p>
              </div>
            </div>

            {/* 新增社交媒体按钮区域 */}
            <div className="flex justify-center items-center space-x-6 pt-10 border-t border-black/5 dark:border-white/10">
              <a href="#" target="_blank" className="opacity-40 hover:opacity-100 transition-opacity text-current hover:text-blue-500"><GithubIcon /></a>
              <a href="#" target="_blank" className="opacity-40 hover:opacity-100 transition-opacity text-current hover:text-blue-500"><TwitterIcon /></a>
              <a href="#" target="_blank" className="opacity-40 hover:opacity-100 transition-opacity text-current hover:text-blue-500"><EmailIcon /></a>
              <a href="#" target="_blank" className="opacity-40 hover:opacity-100 transition-opacity text-current hover:text-blue-500"><LinkedInIcon /></a>
            </div>
          </div>
        </aside>

        {/* 右侧文章列表 - Vercel Bento Grid */}
        <section className="flex-1">
          {/* PayloadCMS 风格头部 */}
          <header className="mb-24 overflow-hidden">
            <div className={\`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] \${showHero ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}\`}>
              <h1 className="text-[clamp(3rem,10.5vw,9.5rem)] leading-[0.82] font-black tracking-tighter mb-10">
                STAY <br />
                <div className="relative h-[1.1em] overflow-hidden">
                  <div 
                    className="transition-transform duration-[1000ms] delay-300 ease-[cubic-bezier(0.85,0,0.15,1)]"
                    style={{ transform: \`translateY(-\${wordIndex * 20}%)\` }}
                  >
                    {SCROLL_WORDS.map((w) => (
                      <div key={w} className="h-[1.1em] text-blue-600 dark:text-blue-500 uppercase">{w}</div>
                    ))}
                  </div>
                </div>
              </h1>
            </div>
            
            <div className={\`transition-all duration-[1800ms] delay-700 ease-out \${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-8'}\`}>
              <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono">
                {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {paginatedPosts.map((post, idx) => {
              const gridClass = [0, 5, 8].includes(idx) ? 'md:col-span-12' : 'md:col-span-6';
              return (
                <div key={post.slug} className={\`\${gridClass} bg-white dark:bg-black overflow-hidden group relative border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-colors\`}>
                  <ArticleBox post={post} featured={[0, 5, 8].includes(idx)} />
                </div>
              );
            })}
          </div>

          {/* 现代数字分页 */}
          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-10">
              <div className="flex gap-4">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                    className={\`text-[10px] font-black transition-all border-b-2 pb-1 \${currentPage === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent opacity-20 hover:opacity-100'}\`}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-10">Index Phase — {currentPage}</span>
            </div>
          )}
        </section>
      </main>

      {/* 现代化搜索系统 */}
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
              {searchResults.length > 0 ? searchResults.map(result => (
                <Link key={result.slug} href={\`/posts/\${result.slug}\`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <div className="flex items-center space-x-4 mb-2 opacity-30">
                      <span className="text-[9px] font-mono tracking-widest">{result.date}</span>
                    </div>
                    <h4 className="text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              )) : searchQuery && <p className="opacity-30 uppercase text-xs tracking-widest">No results found.</p>}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-[1440px] mx-auto px-10 py-24 flex justify-between items-center opacity-20 text-[9px] font-bold tracking-[0.5em] uppercase border-t border-black/5 dark:border-white/10">
        <span>© TYPACE SYSTEM — 2026</span>
        <span>ENGINEERED FOR THE WEB</span>
      </footer>

      <style jsx global>{\`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      \`}</style>
    </div>
  );
}

// --- 子组件：Bento 文章块 ---
const ArticleBox = ({ post, featured }) => (
  <Link href={\`/posts/\${post.slug}\`}>
    <a className="block h-full relative p-12 flex flex-col justify-end overflow-hidden group">
      {/* 弱化后的封面图片 */}
      <div className="absolute inset-0 z-0">
        <img 
          src={post.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
          className="w-full h-full object-cover grayscale opacity-25 group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-105 transition-all duration-[1500ms] ease-out"
          alt=""
        />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{post.date}</span>
          <div className="h-[1px] w-0 group-hover:w-16 bg-blue-600 transition-all duration-700" />
        </div>
        <h3 className={\`font-black tracking-tighter leading-[0.92] uppercase transition-all duration-500 group-hover:text-blue-600 
          \${featured ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'}\`}>
          {post.title}
        </h3>
        {featured && (
          <p className="mt-10 text-sm opacity-0 group-hover:opacity-60 transition-all duration-700 translate-y-6 group-hover:translate-y-0 line-clamp-2 max-w-xl font-medium leading-relaxed leading-relaxed">
            {post.excerpt || "Explore the technical philosophy and architectural decisions behind this publication..."}
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

// --- 社交网络图标 ---
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
);
const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
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
