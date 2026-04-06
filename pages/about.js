import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSortedPostsData } from '../lib/posts';

// --- 1. 服务端数据获取 ---
export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'pages', 'about.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();
  const allPostsData = getSortedPostsData();

  return {
    props: {
      frontmatter: data,
      contentHtml,
      allPostsData: allPostsData.map(post => ({
        ...post,
        content: post.content || "",
      })),
    },
  };
}

// --- 2. 主页面组件 ---
// 接收来自 _app.js 的全局主题 Props，彻底解决闪屏
export default function About({ frontmatter, contentHtml, allPostsData, isDarkMode, toggleDarkMode, themeMounted }) {
  const canvasRef = useRef(null);
  const router = useRouter();

  // --- 状态管理 ---
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayText, setDisplayText] = useState('');

  // --- 搜索逻辑 ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // --- 副作用控制系统 ---
  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => setShowHero(true), 150);

    // 1. 滚动锁定
    document.body.style.overflow = (isMobileMenuOpen || isSearchOpen) ? 'hidden' : 'unset';

    // 2. 一言打字机
    let hitokotoTimer;
    fetch('https://v1.hitokoto.cn').then(res => res.json()).then(data => {
      let i = 0;
      hitokotoTimer = setInterval(() => {
        setDisplayText(data.hitokoto.slice(0, i + 1));
        i++;
        if (i >= data.hitokoto.length) clearInterval(hitokotoTimer);
      }, 45);
    });

    // 3. 矩阵粒子系统
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0, animationFrameId;

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
      for (let r = 0; r < Math.ceil(canvas.height / gap) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / gap) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath(); ctx.arc(c * gap, r * gap + yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      if (hitokotoTimer) clearInterval(hitokotoTimer);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode, isMobileMenuOpen, isSearchOpen]); // 监听 isDarkMode 以更新粒子颜色

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>About — TYPACE SYSTEM</title>
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
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ease-in-out flex flex-col lg:flex-row gap-16 lg:gap-24 ${isMobileMenuOpen ? 'blur-2xl scale-[0.97] pointer-events-none opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        
        {/* 左侧：个人品牌栏 */}
        <aside className={`lg:w-80 flex-shrink-0 transition-all duration-[1500ms] ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="sticky top-32 p-8 border border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#080808]/50 backdrop-blur-md rounded-2xl">
            {/* 头像 */}
            <div className="relative w-32 h-32 mx-auto mb-8 group">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity animate-pulse" />
              <img 
                src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                className="relative w-full h-full object-cover rounded-full ring-2 ring-black/5 dark:ring-white/20 brightness-110 contrast-[1.05]" 
                alt="Avatar"
              />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Typace Team</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mt-2">Digital Architect</p>
            </div>

            {/* 社交链接 */}
            <div className="flex justify-center items-center space-x-5 pt-6 border-t border-black/5 dark:border-white/10">
              <SocialLink href="https://github.com/terryzhangxr"><GithubIcon /></SocialLink>
              <SocialLink href="https://twitter.com"><TwitterIcon /></SocialLink>
              <SocialLink href="mailto:zhang@mrzxr.com"><MailIcon /></SocialLink>
              <SocialLink href="#"><RSSIcon /></SocialLink>
            </div>
          </div>
        </aside>

        {/* 右侧：关于内容 */}
        <section className={`flex-1 transition-all duration-[1800ms] delay-200 ${showHero ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <header className="mb-20">
            <h1 className="text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] font-black tracking-tighter uppercase mb-8">
              THE <br /> SYSTEM.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-relaxed italic font-mono opacity-40">
              {displayText}<span className="inline-block w-2 h-4 bg-blue-600 ml-2 animate-pulse" />
            </p>
          </header>

          <article className="prose-terminal dark:prose-invert max-w-3xl">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          <footer className="mt-24 pt-12 border-t border-black/5 dark:border-white/10 opacity-20 text-[9px] font-bold tracking-[0.5em] uppercase flex justify-between">
             <span>Established 2026</span>
             <span>Terminal Architecture</span>
          </footer>
        </section>
      </main>

      {/* --- 全新搜索系统 --- */}
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
        .prose-terminal { line-height: 1.9; font-size: 1.05rem; }
        .prose-terminal h2 { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; margin: 3rem 0 1.2rem; }
        .prose-terminal p { margin-bottom: 2rem; opacity: 0.8; }
        .prose-terminal ul { list-style: square; padding-left: 1.5rem; margin-bottom: 1.8rem; opacity: 0.8; }
        .prose-terminal a { color: #2563eb; text-decoration: underline; text-underline-offset: 4px; }
        .dark .prose-terminal a { color: #60a5fa; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// --- 辅助小组件 (仅定义一次，防止导出错误) ---
function NavLink({ href, children }) {
  return <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>;
}

function MobileNavLink({ href, children, onClick, index }) {
  return (
    <Link href={href}>
      <a onClick={onClick} className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block" style={{ transitionDelay: `${index * 60}ms` }}>
        {children}
      </a>
    </Link>
  );
}

function SocialLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 hover:text-blue-600 transition-all transform hover:-translate-y-1">
      {children}
    </a>
  );
}

// --- 图标组件 ---
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const GithubIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37(3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>;
const TwitterIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>;
const MailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const RSSIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>;
