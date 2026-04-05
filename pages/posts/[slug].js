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

  const applyHighlighting = useCallback(() => {
    if (typeof window !== 'undefined' && window.hljs) {
      const nodes = contentRef.current.querySelectorAll('pre code');
      nodes.forEach((node) => {
        window.hljs.highlightElement(node);
      });
      const blocks = contentRef.current.querySelectorAll('pre');
      blocks.forEach(pre => {
        if (pre.querySelector('.code-header')) return;
        const header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/50';
        const lang = pre.querySelector('code').className.replace('language-', '') || 'code';
        header.innerHTML = `<span>${lang}</span><button class="copy-btn hover:text-white transition-colors">Copy</button>`;
        pre.prepend(header);
        header.querySelector('button').onclick = (e) => {
          const btn = e.target;
          navigator.clipboard.writeText(pre.querySelector('code').innerText);
          btn.innerText = 'Copied';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        };
      });
    }
  }, []);

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

  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
    setTimeout(() => setShowContent(true), 150);

    if (!window.hljs) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
        script.onload = applyHighlighting;
        document.body.appendChild(script);
    } else {
        applyHighlighting();
    }

    if (!window.Waline) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
        script.onload = initWaline;
        document.body.appendChild(script);
    } else {
        initWaline();
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, ${isDarkMode ? 0.35 : 0.25})`;
      for (let r = 0; r < Math.ceil(canvas.height / 64) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / 64) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath(); ctx.arc(c * 64, r * 64 + yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(render);
    };
    render();
    return () => { if (walineInstance.current) walineInstance.current.destroy(); };
  }, [isDarkMode, applyHighlighting, initWaline]);

  useEffect(() => {
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3');
      const items = Array.from(headings).map(h => {
        if (!h.id) h.id = h.textContent.toLowerCase().replace(/\s+/g, '-');
        return { id: h.id, text: h.textContent, level: h.tagName.toLowerCase() };
      });
      setToc(items);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) setActiveHeading(entry.target.id);
          });
        },
        { rootMargin: '-10% 0px -80% 0px' }
      );
      headings.forEach(h => observer.observe(h));
      return () => observer.disconnect();
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
      <Head>
        <title>{frontmatter.title} — Typace</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/@waline/client@v2/dist/waline.css" />
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
            <button onClick={toggleDarkMode} className="text-lg w-6 h-6 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>
          <div className="md:hidden z-50">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="font-black text-[10px] uppercase tracking-widest">{isMobileMenuOpen ? 'Close' : 'Menu'}</button>
          </div>
        </div>
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full space-y-8 text-4xl font-black tracking-tighter uppercase">
              <Link href="/"><a onClick={() => setIsMobileMenuOpen(false)}>Home</a></Link>
              <Link href="/archive"><a onClick={() => setIsMobileMenuOpen(false)}>Archive</a></Link>
              <Link href="/tags"><a onClick={() => setIsMobileMenuOpen(false)}>Tags</a></Link>
              <button onClick={() => { toggleDarkMode(); setIsMobileMenuOpen(false); }} className="text-xs w-fit border border-black/10 dark:border-white/10 px-8 py-3 rounded-full uppercase tracking-widest font-bold mt-10">
                 {isDarkMode ? 'Light' : 'Dark'}
              </button>
          </div>
        </div>
      </nav>

      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ${isMobileMenuOpen ? 'blur-2xl scale-[0.98]' : 'blur-0'}`}>
        <header className={`max-w-4xl mx-auto mb-20 transition-all duration-[1500ms] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40">
            <span className="text-[10px] font-mono tracking-widest">{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span className="text-[10px] uppercase font-black tracking-[0.2em]">{frontmatter.tags?.[0] || 'Article'}</span>
          </div>
          <h1 className="text-[clamp(2.2rem,7vw,4.5rem)] leading-[1.05] font-black tracking-tighter uppercase mb-12">{frontmatter.title}</h1>
          {frontmatter.cover && (
            <div className="w-full max-w-2xl aspect-video overflow-hidden border border-black/5 dark:border-white/10 rounded-2xl group cursor-zoom-in shadow-2xl shadow-black/5" onClick={() => setPreviewImage(frontmatter.cover)}>
                <img src={frontmatter.cover} className="w-full h-full object-cover transition-all duration-[1.5s] group-hover:scale-105" alt="cover" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20 max-w-6xl mx-auto">
          {/* --- 强化后的侧边栏 --- */}
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-8">Catalogue</h4>
              <ul className="space-y-6 border-l border-black/5 dark:border-white/10">
                {toc.map(item => (
                  <li key={item.id} className={`${item.level === 'h3' ? 'pl-8' : 'pl-6'} relative`}>
                    <a 
                      href={`#${item.id}`} 
                      className={`block text-[13px] uppercase font-bold tracking-wider transition-all duration-300
                        ${activeHeading === item.id 
                          ? 'text-blue-500 opacity-100 translate-x-2' 
                          : 'text-current opacity-30 hover:opacity-60 hover:translate-x-1'
                        }`}
                    >
                      {item.text}
                    </a>
                    {/* 激活指示条 */}
                    {activeHeading === item.id && (
                      <div className="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article className={`flex-1 max-w-3xl transition-all duration-[1800ms] delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div ref={contentRef} className="prose-terminal dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            
            <section id="comments" className="mt-32 pt-16 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-4 mb-12 opacity-30 text-[10px] font-black uppercase tracking-[0.4em]">
                    <h3>Terminal Discussion</h3>
                    <div className="h-px flex-1 bg-current"></div>
                </div>
                <div id="waline-comment-container" />
            </section>
          </article>
        </div>
      </main>

      {/* 图片预览 */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 dark:bg-black/95 backdrop-blur-2xl p-10 cursor-zoom-out animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-full max-h-full rounded-sm shadow-2xl" alt="Preview" />
        </div>
      )}

      <style jsx global>{`
        .prose-terminal { font-family: 'Inter', sans-serif; line-height: 1.9; font-size: 1.05rem; }
        .prose-terminal h2 { font-size: 2rem; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; margin: 4.5rem 0 1.5rem; }
        .prose-terminal p { margin-bottom: 2.2rem; opacity: 0.85; }
        .prose-terminal pre {
          background: #050505 !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          margin: 3.5rem 0;
          overflow: hidden;
        }
        .prose-terminal pre code { display: block; padding: 1.8rem; font-family: 'Fira Code', monospace; font-size: 0.9rem; color: #e5e7eb; }
        .hljs-keyword { color: #60a5fa; font-weight: bold; }
        .hljs-string { color: #34d399; }
        /* Waline 极简适配 */
        .wl-panel { border: 1px solid rgba(128,128,128,0.1) !important; border-radius: 16px !important; background: transparent !important; }
      `}</style>
    </div>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);import { useEffect, useState, useRef, useCallback } from 'react';
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

  // --- 1. 高亮与代码块增强逻辑 ---
  const applyHighlighting = useCallback(() => {
    if (typeof window !== 'undefined' && window.hljs) {
      const nodes = contentRef.current.querySelectorAll('pre code');
      nodes.forEach((node) => {
        window.hljs.highlightElement(node);
      });
      
      // 增加复制按钮和 Header
      const blocks = contentRef.current.querySelectorAll('pre');
      blocks.forEach(pre => {
        if (pre.querySelector('.code-header')) return;
        const header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/50';
        const lang = pre.querySelector('code').className.replace('language-', '') || 'code';
        header.innerHTML = `<span>${lang}</span><button class="copy-btn hover:text-white transition-colors">Copy</button>`;
        pre.prepend(header);
        
        header.querySelector('button').onclick = (e) => {
          const btn = e.target;
          navigator.clipboard.writeText(pre.querySelector('code').innerText);
          btn.innerText = 'Copied';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        };
      });
    }
  }, []);

  // --- 2. Waline 初始化 ---
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

  // --- 3. 核心副作用 ---
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
    setTimeout(() => setShowContent(true), 150);

    // 动态加载 Highlight.js
    if (!window.hljs) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
        script.onload = applyHighlighting;
        document.body.appendChild(script);
    } else {
        applyHighlighting();
    }

    // 动态加载 Waline
    if (!window.Waline) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
        script.onload = initWaline;
        document.body.appendChild(script);
    } else {
        initWaline();
    }

    // 粒子背景逻辑
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDarkMode ? '255, 255, 255' : '0, 0, 0';
      ctx.fillStyle = `rgba(${color}, ${isDarkMode ? 0.35 : 0.25})`;
      for (let r = 0; r < Math.ceil(canvas.height / 64) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / 64) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath(); ctx.arc(c * 64, r * 64 + yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(render);
    };
    render();

    return () => { if (walineInstance.current) walineInstance.current.destroy(); };
  }, [isDarkMode, applyHighlighting, initWaline]);

  // TOC 提取
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
      <Head>
        <title>{frontmatter.title} — Typace</title>
        {/* 必须引入 Highlight.js 的样式才能看到高亮 */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/@waline/client@v2/dist/waline.css" />
      </Head>
      
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 导航栏 */}
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
          <div className="md:hidden z-50">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="font-black text-[10px] uppercase tracking-widest">{isMobileMenuOpen ? 'Close' : 'Menu'}</button>
          </div>
        </div>
        {/* 移动端菜单 */}
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex flex-col px-10 pt-32 h-full space-y-8 text-4xl font-black tracking-tighter uppercase">
              <Link href="/"><a onClick={() => setIsMobileMenuOpen(false)}>Home</a></Link>
              <Link href="/archive"><a onClick={() => setIsMobileMenuOpen(false)}>Archive</a></Link>
              <Link href="/tags"><a onClick={() => setIsMobileMenuOpen(false)}>Tags</a></Link>
              <div className="pt-10 border-t border-black/5 dark:border-white/10">
                 <button onClick={() => { toggleDarkMode(); setIsMobileMenuOpen(false); }} className="text-xs border border-black/10 dark:border-white/10 px-8 py-3 rounded-full uppercase tracking-widest font-bold">
                    {isDarkMode ? 'Light' : 'Dark'}
                 </button>
              </div>
          </div>
        </div>
      </nav>

      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ${isMobileMenuOpen ? 'blur-2xl scale-[0.98]' : 'blur-0'}`}>
        <header className={`max-w-4xl mx-auto mb-20 transition-all duration-[1500ms] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40">
            <span className="text-[10px] font-mono tracking-widest">{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span className="text-[10px] uppercase font-black">{frontmatter.tags?.[0] || 'Article'}</span>
          </div>
          <h1 className="text-[clamp(2rem,6vw,4rem)] leading-[1.1] font-black tracking-tighter uppercase mb-12">{frontmatter.title}</h1>
          {frontmatter.cover && (
            <div className="w-full max-w-2xl mx-auto aspect-video overflow-hidden border border-black/5 dark:border-white/10 rounded-xl group cursor-zoom-in" onClick={() => setPreviewImage(frontmatter.cover)}>
                <img src={frontmatter.cover} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20 max-w-6xl mx-auto">
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

          <article className={`flex-1 max-w-3xl transition-all duration-[1800ms] delay-200 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div ref={contentRef} className="prose-terminal dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            
            {/* 评论区 */}
            <section id="comments" className="mt-32 pt-16 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-4 mb-12 opacity-30 text-xs font-black uppercase tracking-[0.4em]">
                    <h3>Discussion Terminal</h3>
                    <div className="h-px flex-1 bg-current"></div>
                </div>
                <div id="waline-comment-container" />
            </section>
          </article>
        </div>
      </main>

      {/* 这里的样式是高亮正常显示的关键 */}
      <style jsx global>{`
        .prose-terminal { font-family: 'Inter', sans-serif; line-height: 1.8; font-size: 1.05rem; }
        .prose-terminal h2 { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; margin: 4rem 0 1.5rem; }
        .prose-terminal p { margin-bottom: 2rem; opacity: 0.85; }
        
        /* 代码块 Vercel 风格 */
        .prose-terminal pre {
          background: #050505 !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0; /* Header 撑开 */
          margin: 3rem 0;
          overflow: hidden;
        }
        .prose-terminal pre code {
          display: block;
          padding: 1.5rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          background: transparent !important;
          color: #e5e7eb;
        }
        /* 高亮标记加重 */
        .hljs-keyword { color: #60a5fa; font-weight: bold; }
        .hljs-string { color: #34d399; }
        .hljs-comment { color: #6b7280; font-style: italic; }
      `}</style>
    </div>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);
