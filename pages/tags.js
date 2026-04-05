import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

// --- 1. 服务端数据获取 ---
export async function getStaticProps() {
  const allPostsData = getSortedPostsData();

  // 按标签分类文章逻辑
  const tagsWithPosts = allPostsData.reduce((acc, post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push({
          slug: post.slug,
          title: post.title,
          date: post.date,
        });
      });
    }
    return acc;
  }, {});

  return {
    props: {
      tagsWithPosts,
      allPostsData: allPostsData.map(post => ({
        ...post,
        content: post.content || "",
      })),
    },
  };
}

// --- 2. 主页面组件 ---
export default function TagsPage({ tagsWithPosts, allPostsData }) {
  const canvasRef = useRef(null);
  const router = useRouter();

  // --- 状态管理 (同步主页逻辑) ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // --- 搜索逻辑 ---
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
    setTimeout(() => setShowHero(true), 150);

    // 1. 滚动锁定
    document.body.style.overflow = (isMobileMenuOpen || isSearchOpen) ? 'hidden' : 'unset';

    // 2. 一言打字机 (标签页专属)
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(timer);
      }, 45);
    });

    // 3. 矩阵粒子系统
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0, animationFrameId;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${colorRGB}, ${isDarkMode ? 0.35 : 0.25})`;
      const gap = 64;
      for (let r = 0; r < Math.ceil(canvas.height / gap) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / gap) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath(); ctx.arc(c * gap, r * gap + yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize(); render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode, isMobileMenuOpen, isSearchOpen]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>Tags — TYPACE SYSTEM</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-100" />

      {/* --- 统一导航栏 --- */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity uppercase z-50">TYPACE</a></Link>
          
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="w-5 h-5 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm focus:outline-none">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>

          <div className="flex md:hidden items-center space-x-4 z-50">
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-60 focus:outline-none"><SearchIcon /></button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 focus:outline-none">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
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

      {/* --- 主内容区 --- */}
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ease-in-out ${isMobileMenuOpen ? 'blur-2xl scale-[0.97] pointer-events-none opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        
        {/* 标签页 Hero */}
        <header className="mb-24">
          <div className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <h1 className="text-[clamp(3.5rem,10vw,8rem)] leading-[0.85] font-black tracking-tighter uppercase mb-8">
              TAGS <br /> SYSTEM.
            </h1>
          </div>
          <div className={`transition-all duration-[1800ms] delay-500 ease-out ${showHero ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="max-w-xl text-base font-medium leading-relaxed italic font-mono">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </div>
        </header>

        {/* 标签分类网格 */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 transition-all duration-[2000ms] delay-700 ${showHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {Object.entries(tagsWithPosts).sort((a, b) => b[1].length - a[1].length).map(([tag, posts]) => (
            <div key={tag} className="bg-white dark:bg-black p-10 flex flex-col group hover:bg-gray-50 dark:hover:bg-[#050505] transition-colors">
              <div className="flex items-start justify-between mb-8">
                <h2 className="text-4xl font-black tracking-tighter uppercase group-hover:text-blue-600 transition-colors">{tag}</h2>
                <span className="text-[10px] font-mono opacity-20 font-bold">[{posts.length.toString().padStart(2, '0')}]</span>
              </div>
              
              <ul className="space-y-4">
                {posts.map(({ slug, title }) => (
                  <li key={slug}>
                    <Link href={`/posts/${slug}`}>
                      <a className="block text-[11px] font-bold uppercase tracking-wider opacity-40 hover:opacity-100 hover:translate-x-2 transition-all duration-300">
                        {title}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-10">
                <div className="h-px w-0 group-hover:w-full bg-blue-600 transition-all duration-700"></div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-48 pt-12 border-t border-black/5 dark:border-white/10 opacity-20 text-[9px] font-bold tracking-[0.5em] uppercase flex justify-between">
           <span>Classified Knowledge base</span>
           <span>Terminal Logic 2026</span>
        </footer>
      </main>

      {/* --- 搜索系统 --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-2xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <input autoFocus className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black tracking-tighter outline-none pb-8 focus:border-blue-600 transition-all uppercase" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="mt-16 space-y-12 overflow-y-auto max-h-[60vh] pr-4 text-left">
              {searchResults.length > 0 ? searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <div className="flex items-center space-x-4 mb-2 opacity-30"><span className="text-[9px] font-mono tracking-widest">{result.date}</span></div>
                    <h4 className="text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter uppercase">{result.title}</h4>
                  </a>
                </Link>
              )) : searchQuery && <p className="opacity-40 uppercase text-xs tracking-widest text-left">No results found.</p>}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// --- 辅助组件 (同步定义) ---
function NavLink({ href, children }) {
  return <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>;
}

function MobileNavLink({ href, children, onClick, index }) {
  return (
    <Link href={href}>
      <a onClick={onClick} className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block transform translate-x-0" style={{ transitionDelay: `${index * 60}ms` }}>
        {children}
      </a>
    </Link>
  );
}

const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
