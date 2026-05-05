import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getSortedPostsData } from '../../lib/posts'; 
import fs from 'fs'; 
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import Head from 'next/head';
import Link from 'next/link';

// --- 1. 服务端数据获取 ---
export async function getStaticPaths() {
  const posts = getSortedPostsData();
  const paths = posts.map((post) => ({ params: { slug: post.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // 使用 rehype 插件系统进行代码高亮处理
  const processedContent = await remark()
    .use(remarkRehype)
    .use(rehypeHighlight) // 自动为代码块添加 hljs 类名
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processedContent.toString();
  
  const allPostsData = getSortedPostsData();

  return { props: { frontmatter: data, contentHtml, allPostsData } };
}

// --- 2. 主页面组件 ---
export default function Post({ frontmatter, contentHtml, allPostsData, isDarkMode, toggleDarkMode, themeMounted }) {
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); 
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);

  // 搜索逻辑
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // 背景与滚动控制
  useEffect(() => {
    setTimeout(() => setShowContent(true), 150);
    
    if (isMobileMenuOpen || isSearchOpen || previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0, animationFrameId;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${colorRGB}, ${isDarkMode ? 0.35 : 0.25})`;
      for (let r = 0; r < Math.ceil(canvas.height / 64) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / 64) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath(); ctx.arc(c * 64, r * 64 + yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
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
  }, [isDarkMode, isMobileMenuOpen, isSearchOpen, previewImage]);

  // 目录提取与图片点击事件绑定
  useEffect(() => {
    if (!contentRef.current) return;

    // 目录处理
    const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3'));
    setToc(headings.map((h, i) => {
      const id = h.id || `${h.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-${i}`;
      h.id = id; 
      return { id, text: h.textContent, level: h.tagName.toLowerCase() };
    }));

    // 图片放大绑定
    const images = contentRef.current.querySelectorAll('img');
    const handleImageClick = (e) => setPreviewImage(e.target.src);
    images.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', handleImageClick);
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id); });
    }, { rootMargin: '-10% 0px -70% 0px' });
    headings.forEach(h => obs.observe(h));

    return () => {
      obs.disconnect();
      images.forEach(img => img.removeEventListener('click', handleImageClick));
    };
  }, [contentHtml]);

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>{frontmatter.title} — TYPACE</title>
        {/* 引入代码高亮主题 CSS */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark-reasonable.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 导航栏 */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest uppercase z-[110]">TYPACE</a></Link>
          
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="w-5 h-5 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {!themeMounted ? null : (isDarkMode ? '☼' : '☾')}
            </button>
          </div>

          <div className="flex md:hidden items-center space-x-4 z-[110]">
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-60"><SearchIcon /></button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 relative">
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl transition-all duration-500 md:hidden z-[100] ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col px-10 pt-32 h-full">
            <div className="flex flex-col space-y-6">
              <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)} index={1}>Home</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMobileMenuOpen(false)} index={2}>Archive</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMobileMenuOpen(false)} index={3}>Tags</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMobileMenuOpen(false)} index={4}>About</MobileNavLink>
            </div>
            <div className="mt-auto pb-16 border-t border-black/5 dark:border-white/10 pt-8 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase opacity-40">System Theme</span>
              <button onClick={toggleDarkMode} className="text-xs font-bold uppercase border border-black/10 dark:border-white/10 px-6 py-2 rounded-full">
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ${isMobileMenuOpen || isSearchOpen ? 'blur-2xl scale-[0.98] opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        <header className={`max-w-4xl mx-auto mb-20 transition-all duration-[1000ms] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40 text-[10px] font-mono uppercase font-black">
            <span>{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span>{frontmatter.tags?.[0] || 'Article'}</span>
          </div>
          <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.05] font-black tracking-tighter uppercase mb-12">{frontmatter.title}</h1>
          {frontmatter.cover && (
            <div className="w-full max-w-2xl aspect-video overflow-hidden border border-black/5 dark:border-white/10 rounded-2xl cursor-zoom-in" onClick={() => setPreviewImage(frontmatter.cover)}>
                <img src={frontmatter.cover} className="w-full h-full object-cover" alt="cover" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20 max-w-6xl mx-auto">
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-8">Catalogue</h4>
              <ul className="space-y-5 border-l border-black/5 dark:border-white/10">
                {toc.map(item => (
                  <li key={item.id} className={`relative transition-all ${item.level === 'h1' ? 'pl-4' : item.level === 'h2' ? 'pl-8' : 'pl-12'}`}>
                    <a href={`#${item.id}`} className={`block text-[12px] uppercase font-bold transition-all duration-300 ${activeHeading === item.id ? 'text-blue-500 translate-x-2' : 'text-current opacity-30 hover:opacity-60'}`}>
                      {item.text}
                    </a>
                    {activeHeading === item.id && <div className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article className={`flex-1 max-w-3xl transition-all duration-[1200ms] delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div ref={contentRef} className="prose-terminal dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>
        </div>
      </main>

      {/* 搜索系统 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-8">
          <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-2xl" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <input autoFocus className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 text-3xl md:text-5xl font-black outline-none pb-8 focus:border-blue-600 transition-all uppercase" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="mt-16 space-y-12 overflow-y-auto max-h-[60vh] text-left">
              {searchResults.map(result => (
                <Link key={result.slug} href={`/posts/${result.slug}`}>
                  <a className="group block" onClick={() => setIsSearchOpen(false)}>
                    <h4 className="text-2xl md:text-3xl font-black group-hover:text-blue-600 transition-colors uppercase">{result.title}</h4>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 图片放大预览 */}
      {previewImage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/90 dark:bg-black/95 backdrop-blur-2xl cursor-zoom-out" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-[90vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300" />
        </div>
      )}

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        .prose-terminal img { border-radius: 12px; margin: 3rem 0; transition: transform 0.3s; }
        .prose-terminal img:hover { transform: translateY(-4px); }
        .prose-terminal pre { 
          background: #1a1a1a !important; 
          padding: 1.5rem; 
          border-radius: 12px; 
          margin: 2rem 0; 
          overflow-x: auto;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .prose-terminal code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
        .prose-terminal h1, .prose-terminal h2, .prose-terminal h3 { scroll-margin-top: 100px; text-transform: uppercase; font-weight: 900; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); }
      `}</style>
    </div>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const MobileNavLink = ({ href, children, onClick, index }) => (
  <Link href={href}>
    <a onClick={onClick} className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block" style={{ transitionDelay: `${index * 60}ms` }}>
      {children}
    </a>
  </Link>
);

const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
