import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs'; 
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Head from 'next/head';
import Link from 'next/link';

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

export default function Post({ frontmatter, contentHtml, recommendedPosts, allPostsData }) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const walineInstance = useRef(null);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // --- 1. Waline 初始化逻辑 ---
  const initWaline = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    // 动态加载 Waline 脚本和样式
    if (!document.getElementById('waline-script')) {
      const script = document.createElement('script');
      script.id = 'waline-script';
      script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
      document.body.appendChild(script);
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/@waline/client@v2/dist/waline.css';
      document.head.appendChild(link);

      script.onload = () => doInit();
    } else {
      doInit();
    }

    function doInit() {
      if (walineInstance.current) walineInstance.current.destroy();
      walineInstance.current = window.Waline.init({
        el: '#waline-comment-container',
        serverURL: 'https://comment.mrzxr.top/', // 你的评论服务器地址
        path: router.asPath,
        dark: 'html.dark',
        locale: { placeholder: 'Terminal Discussion...' }
      });
    }
  }, [router.asPath]);

  // --- 2. 矩阵粒子 & 页面加载 ---
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
    setTimeout(() => setShowContent(true), 150);
    initWaline();

    // 粒子动画逻辑
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, ${isDarkMode ? 0.35 : 0.25})`;
      const gap = 64;
      for (let r = 0; r < Math.ceil(canvas.height / gap) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / gap) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath();
          ctx.arc(c * gap, r * gap + yOffset, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(render);
    };
    render();

    // 滚动锁定逻辑
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (walineInstance.current) walineInstance.current.destroy();
    };
  }, [isDarkMode, isMobileMenuOpen, initWaline]);

  // --- 3. TOC 目录提取 ---
  useEffect(() => {
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3');
      const items = Array.from(headings).map(h => {
        if (!h.id) h.id = h.textContent.toLowerCase().replace(/\s+/g, '-');
        return { id: h.id, text: h.textContent, level: h.tagName.toLowerCase() };
      });
      setToc(items);
    }
  }, [contentHtml]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className={`min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-700 ${isDarkMode ? 'dark bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <Head><title>{frontmatter.title} — Typace</title></Head>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-100" />

      {/* 现代导航栏 - 完全适配主页逻辑 */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity uppercase z-50">TYPACE</a></Link>
          
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={toggleDarkMode} className="text-lg w-6 h-6 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>

          <div className="flex md:hidden items-center z-50">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 focus:outline-none uppercase font-black text-xs tracking-widest">
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div className={`fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full space-y-8 text-4xl font-black tracking-tighter uppercase">
              <Link href="/"><a onClick={() => setIsMobileMenuOpen(false)}>Home</a></Link>
              <Link href="/archive"><a onClick={() => setIsMobileMenuOpen(false)}>Archive</a></Link>
              <Link href="/tags"><a onClick={() => setIsMobileMenuOpen(false)}>Tags</a></Link>
              <Link href="/about"><a onClick={() => setIsMobileMenuOpen(false)}>About</a></Link>
              <div className="mt-auto pb-16 border-t border-black/5 dark:border-white/10 pt-8 flex items-center justify-between">
                <button onClick={() => { toggleDarkMode(); setIsMobileMenuOpen(false); }} className="text-xs font-bold uppercase tracking-widest border border-black/10 dark:border-white/10 px-8 py-3 rounded-full">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
          </div>
        </div>
      </nav>

      {/* 主体容器 - 增加移动端模糊适配 */}
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ${isMobileMenuOpen ? 'blur-2xl scale-[0.97] pointer-events-none' : 'blur-0'}`}>
        
        {/* 文章头部 - 缩小封面图 */}
        <header className={`max-w-4xl mx-auto mb-20 transition-all duration-[1500ms] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40">
            <span className="text-[10px] font-mono tracking-widest">{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest">{frontmatter.tags?.[0] || 'POST'}</span>
          </div>
          <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.1] font-black tracking-tighter uppercase mb-12">
            {frontmatter.title}
          </h1>
          {frontmatter.cover && (
            <div className="w-full max-w-2xl mx-auto aspect-video overflow-hidden border border-black/5 dark:border-white/10 rounded-xl group cursor-zoom-in" onClick={() => setPreviewImage(frontmatter.cover)}>
                <img src={frontmatter.cover} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20 max-w-6xl mx-auto">
          {/* 侧边栏目录 */}
          <aside className="lg:w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 mb-6">Catalogue</h4>
              <ul className="space-y-4 border-l border-black/5 dark:border-white/10">
                {toc.map(item => (
                  <li key={item.id} className={`${item.level === 'h3' ? 'pl-6' : 'pl-4'}`}>
                    <a href={`#${item.id}`} className={`block text-[11px] uppercase font-bold transition-all hover:text-blue-500 ${activeHeading === item.id ? 'text-blue-500 translate-x-1' : 'opacity-30'}`}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* 正文 */}
          <article className={`flex-1 max-w-3xl transition-all duration-[1800ms] delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div ref={contentRef} className="prose-terminal dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            
            {/* Waline 评论区 */}
            <section id="comments" className="mt-32 pt-16 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-4 mb-12 opacity-30">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em]">Discussion Terminal</h3>
                    <div className="h-px flex-1 bg-current"></div>
                </div>
                <div id="waline-comment-container" />
            </section>
          </article>
        </div>

        {/* 推荐文章 */}
        <section className="mt-48 max-w-6xl mx-auto">
          <div className="flex items-center space-x-6 mb-12">
            <h2 className="text-xl font-black uppercase tracking-tighter">Read More</h2>
            <div className="h-px flex-1 bg-black/5 dark:bg-white/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {recommendedPosts.map(post => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <a className="group relative bg-white dark:bg-black p-8 min-h-[260px] flex flex-col justify-end overflow-hidden transition-colors hover:bg-gray-50 dark:hover:bg-[#050505]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity">
                    <img src={post.cover} className="w-full h-full object-cover grayscale" />
                  </div>
                  <span className="text-[9px] font-mono opacity-30 mb-2">{post.date}</span>
                  <h4 className="text-base font-black uppercase tracking-tighter leading-tight group-hover:text-blue-500 transition-colors">{post.title}</h4>
                </a>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 全局样式覆盖 */}
      <style jsx global>{`
        .prose-terminal {
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          font-size: 1.05rem;
        }
        .prose-terminal h2 {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          margin: 4rem 0 1.5rem;
        }
        .prose-terminal p { margin-bottom: 2rem; opacity: 0.85; }
        .prose-terminal pre {
          background: #050505 !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0;
          margin: 3rem 0;
        }
        /* Waline 样式适配 */
        :root { --waline-theme-color: #2563eb; --waline-border-color: rgba(0,0,0,0.05); }
        .dark { --waline-border-color: rgba(255,255,255,0.05); --waline-bg-color: #000; }
        .wl-panel { border-radius: 12px !important; border: 1px solid var(--waline-border-color) !important; }
      `}</style>
    </div>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);
