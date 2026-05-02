import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs'; 
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
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
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();
  const allPostsData = getSortedPostsData();
  const recommendedPosts = allPostsData
    .filter((post) => post.slug !== params.slug)
    .sort(() => 0.5 - Math.random()).slice(0, 3);

  return { props: { frontmatter: data, contentHtml, recommendedPosts, allPostsData } };
}

// --- 2. 主页面组件 ---
export default function Post({ frontmatter, contentHtml, recommendedPosts, allPostsData, isDarkMode, toggleDarkMode, themeMounted }) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const walineInstance = useRef(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);

  // --- 搜索逻辑 ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allPostsData]);

  // --- 代码高亮与复制 ---
  const applyHighlighting = useCallback(() => {
    if (typeof window !== 'undefined' && window.hljs && contentRef.current) {
      contentRef.current.querySelectorAll('pre code').forEach(el => window.hljs.highlightElement(el));
      contentRef.current.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-header')) return;
        const header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-white/50';
        const lang = Array.from(pre.querySelector('code').classList).find(c => c.startsWith('language-'))?.replace('language-', '') || 'code';
        header.innerHTML = `<span>${lang}</span><button class="copy-btn hover:text-white transition-colors">Copy</button>`;
        pre.prepend(header);
        header.querySelector('button').onclick = (e) => {
          navigator.clipboard.writeText(pre.querySelector('code').innerText);
          e.target.innerText = 'Copied';
          setTimeout(() => e.target.innerText = 'Copy', 2000);
        };
      });
    }
  }, []);

  // --- 评论系统 ---
  const initWaline = useCallback(() => {
    if (typeof window === 'undefined' || !window.Waline) return;
    if (walineInstance.current) walineInstance.current.destroy();
    walineInstance.current = window.Waline.init({
      el: '#waline-comment-container',
      serverURL: 'https://comment.mrzxr.top/',
      path: router.asPath,
      dark: 'html.dark',
    });
  }, [router.asPath]);

  // --- 核心副作用 ---
  useEffect(() => {
    setTimeout(() => setShowContent(true), 150);
    const loadScripts = () => {
      const scripts = [
        { id: 'hljs-js', src: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js', callback: applyHighlighting },
        { id: 'waline-js', src: 'https://unpkg.com/@waline/client@v2/dist/waline.js', callback: initWaline }
      ];
      scripts.forEach(s => {
        if (!document.getElementById(s.id)) {
          const script = document.createElement('script');
          script.id = s.id; script.src = s.src; script.onload = s.callback;
          document.body.appendChild(script);
        } else { s.callback(); }
      });
    };
    loadScripts();

    // 粒子背景
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
  }, [isDarkMode, applyHighlighting, initWaline, isMobileMenuOpen, isSearchOpen]);

  // --- 目录提取与图片处理 ---
  useEffect(() => {
    if (!contentRef.current) return;

    // 处理图片预览
    const images = contentRef.current.querySelectorAll('img');
    images.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.onclick = () => setPreviewImage(img.src);
    });

    // 提取标题 (h1, h2, h3)
    const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3'));
    setToc(headings.map(h => {
      const id = h.id || h.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      if (!h.id) h.id = id; // 回填 ID 以便锚点跳转
      return { id, text: h.textContent, level: h.tagName.toLowerCase() };
    }));

    // 目录高亮观察者
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id); });
    }, { rootMargin: '-10% 0px -70% 0px' });
    headings.forEach(h => obs.observe(h));
    return () => obs.disconnect();
  }, [contentHtml]);

  useEffect(() => {
    document.body.style.overflow = (isMobileMenuOpen || isSearchOpen) ? 'hidden' : 'unset';
  }, [isMobileMenuOpen, isSearchOpen]);

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head>
        <title>{frontmatter.title} — TYPACE</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/@waline/client@v2/dist/waline.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-100" />

      {/* 导航栏 */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity uppercase z-50">TYPACE</a></Link>
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><SearchIcon /></button>
            <button onClick={toggleDarkMode} className="w-5 h-5 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm">
              {!themeMounted ? null : (isDarkMode ? '☼' : '☾')}
            </button>
          </div>
          <div className="flex md:hidden items-center space-x-4 z-50">
            <button onClick={() => setIsSearchOpen(true)} className="p-1 opacity-60"><SearchIcon /></button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">{isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}</button>
          </div>
        </div>
      </nav>

      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ease-in-out ${isMobileMenuOpen ? 'blur-2xl scale-[0.97] pointer-events-none opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        
        {/* 文章头 */}
        <header className={`max-w-4xl mx-auto mb-20 transition-all duration-[1500ms] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40 text-[10px] font-mono tracking-widest uppercase font-black">
            <span>{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span>{frontmatter.tags?.[0] || 'Article'}</span>
          </div>
          <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.05] font-black tracking-tighter uppercase mb-12">{frontmatter.title}</h1>
          {frontmatter.cover && (
            <div className="w-full max-w-2xl aspect-video overflow-hidden border border-black/5 dark:border-white/10 rounded-2xl group cursor-zoom-in" onClick={() => setPreviewImage(frontmatter.cover)}>
                <img src={frontmatter.cover} className="w-full h-full object-cover transition-all duration-[1.5s] group-hover:scale-105" alt="cover" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20 max-w-6xl mx-auto">
          {/* 侧边栏目录 */}
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-8">Catalogue</h4>
              <ul className="space-y-5 border-l border-black/5 dark:border-white/10">
                {toc.map(item => (
                  <li key={item.id} className={`relative transition-all ${
                    item.level === 'h1' ? 'pl-4' : 
                    item.level === 'h2' ? 'pl-8' : 'pl-12'
                  }`}>
                    <a href={`#${item.id}`} className={`block text-[12px] uppercase font-bold tracking-wider transition-all duration-300 ${activeHeading === item.id ? 'text-blue-500 translate-x-2' : 'text-current opacity-30 hover:opacity-60 hover:translate-x-1'}`}>
                      {item.text}
                    </a>
                    {activeHeading === item.id && <div className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* 文章主体 */}
          <article className={`flex-1 max-w-3xl transition-all duration-[1800ms] delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div ref={contentRef} className="prose-terminal dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            <section id="comments" className="mt-32 pt-16 border-t border-black/5 dark:border-white/10">
                <div id="waline-comment-container" />
            </section>
          </article>
        </div>

        {/* 底部推荐 */}
        <section className="mt-48 max-w-6xl mx-auto">
          <div className="flex items-center space-x-6 mb-12 opacity-20">
            <h2 className="text-xs font-black uppercase tracking-[0.5em]">Next Phase</h2>
            <div className="h-px flex-1 bg-current"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {recommendedPosts.map(post => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <a className="group relative bg-white dark:bg-black p-10 min-h-[300px] flex flex-col justify-end overflow-hidden">
                  <div className="absolute inset-0 z-0 transition-all duration-1000 group-hover:scale-110">
                    <img src={post.cover} className="w-full h-full object-cover opacity-20 group-hover:opacity-60" />
                  </div>
                  <div className="relative z-10 text-left">
                    <span className="text-[10px] font-mono opacity-30 mb-2 block uppercase tracking-widest">{post.date}</span>
                    <h4 className="text-xl font-black uppercase tracking-tighter leading-[1.1] group-hover:text-blue-500 transition-colors">{post.title}</h4>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 搜索系统弹窗 */}
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

      {/* 图片全屏预览 */}
      {previewImage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/80 dark:bg-black/90 backdrop-blur-3xl p-4 md:p-20 cursor-zoom-out animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
          <div className="relative animate-in zoom-in-95 duration-300 ease-out">
            <img src={previewImage} className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm border border-black/5 dark:border-white/10" alt="Preview" />
            <div className="absolute -top-10 left-0 right-0 text-center uppercase text-[10px] font-black tracking-widest opacity-40">Click anywhere to close</div>
          </div>
        </div>
      )}

      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
        
        /* 正文样式修正：层级分明 */
        .prose-terminal { line-height: 1.9; font-size: 1.05rem; }

        .prose-terminal h1 { 
          font-size: 2.8rem; 
          font-weight: 900; 
          letter-spacing: -0.05em; 
          text-transform: uppercase; 
          margin: 6rem 0 2.5rem; 
          line-height: 1;
          border-bottom: 1px solid rgba(128, 128, 128, 0.2);
          padding-bottom: 1rem;
        }

        .prose-terminal h2 { 
          font-size: 2rem; 
          font-weight: 800; 
          letter-spacing: -0.04em; 
          text-transform: uppercase; 
          margin: 4.5rem 0 1.5rem; 
          line-height: 1.1;
        }

        .prose-terminal h3 { 
          font-size: 1.3rem; 
          font-weight: 700; 
          letter-spacing: -0.02em; 
          text-transform: uppercase; 
          margin: 3rem 0 1.2rem; 
          opacity: 0.85;
        }

        /* 锚点偏移 */
        .prose-terminal h1, .prose-terminal h2, .prose-terminal h3 { scroll-margin-top: 120px; }

        .prose-terminal p { margin-bottom: 2.2rem; opacity: 0.85; }
        .prose-terminal pre { background: #050505 !important; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin: 3.5rem 0; overflow: hidden; }
        .prose-terminal pre code { display: block; padding: 1.8rem; font-family: 'Fira Code', monospace; font-size: 0.9rem; color: #e5e7eb; }
        
        .wl-panel { border: 1px solid rgba(128,128,128,0.1) !important; border-radius: 16px !important; background: transparent !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// --- 辅助 UI 组件 ---
const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);

const MobileNavLink = ({ href, children, onClick, index }) => (
  <Link href={href}>
    <a onClick={onClick} className="text-5xl font-black tracking-tighter uppercase hover:text-blue-600 transition-all duration-500 block transform translate-x-0" style={{ transitionDelay: `${index * 60}ms` }}>
      {children}
    </a>
  </Link>
);

const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
