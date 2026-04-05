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

// --- 静态属性配置 ---
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
  const observerRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // --- 矩阵粒子逻辑 ---
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
    setTimeout(() => setShowContent(true), 150);

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
      ctx.fillStyle = `rgba(${color}, ${isDarkMode ? 0.3 : 0.15})`;
      const gap = 64;
      for (let r = 0; r < Math.ceil(canvas.height / gap) + 1; r++) {
        for (let c = 0; c < Math.ceil(canvas.width / gap) + 1; c++) {
          const yOffset = Math.sin(time + (c * 0.4) + (r * 0.3)) * 12;
          ctx.beginPath();
          ctx.arc(c * gap, r * gap + yOffset, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(render);
    };
    render();
    return () => window.removeEventListener('resize', resize);
  }, [isDarkMode]);

  // --- TOC 目录生成与高亮 ---
  useEffect(() => {
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3');
      const items = Array.from(headings).map(h => {
        if (!h.id) h.id = h.textContent.toLowerCase().replace(/\s+/g, '-');
        return { id: h.id, text: h.textContent, level: h.tagName.toLowerCase() };
      });
      setToc(items);

      const observer = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id); }),
        { rootMargin: '-100px 0px -70% 0px' }
      );
      headings.forEach(h => observer.observe(h));
      return () => observer.disconnect();
    }
  }, [contentHtml]);

  // --- 复制按钮逻辑 ---
  useEffect(() => {
    if (!contentRef.current) return;
    const blocks = contentRef.current.querySelectorAll('pre');
    blocks.forEach(pre => {
      if (pre.querySelector('.code-header')) return;
      const header = document.createElement('div');
      header.className = 'code-header flex justify-between items-center px-4 py-2 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 text-[10px] uppercase font-bold tracking-widest';
      header.innerHTML = `<span>Code</span><button class="hover:text-blue-500 transition-colors">Copy</button>`;
      pre.prepend(header);
      header.querySelector('button').onclick = () => {
        navigator.clipboard.writeText(pre.querySelector('code').innerText);
        header.querySelector('button').innerText = 'Copied';
        setTimeout(() => header.querySelector('button').innerText = 'Copy', 2000);
      };
    });
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
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 导航栏 (同主页) */}
      <nav className="fixed top-0 w-full z-[100] border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/"><a className="text-sm font-black tracking-widest hover:opacity-50 transition-opacity">TYPACE</a></Link>
          <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.25em]">
            <NavLink href="/archive">Archive</NavLink>
            <NavLink href="/tags">Tags</NavLink>
            <NavLink href="/about">About</NavLink>
            <button onClick={toggleDarkMode} className="text-lg w-6 h-6 flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none">
              {isDarkMode ? '☼' : '☾'}
            </button>
          </div>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
        {/* 移动端全屏菜单 */}
        <div className={`fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl transition-all duration-500 md:hidden z-40 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="flex flex-col items-center justify-center h-full space-y-8 text-4xl font-black tracking-tighter uppercase">
                <Link href="/"><a onClick={() => setIsMobileMenuOpen(false)}>Home</a></Link>
                <Link href="/archive"><a onClick={() => setIsMobileMenuOpen(false)}>Archive</a></Link>
                <Link href="/tags"><a onClick={() => setIsMobileMenuOpen(false)}>Tags</a></Link>
                <button onClick={() => { toggleDarkMode(); setIsMobileMenuOpen(false); }} className="text-xs border border-black/10 dark:border-white/10 px-8 py-3 rounded-full mt-10 uppercase tracking-widest font-bold">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <main className={`relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-40 pb-32 transition-all duration-700 ${isMobileMenuOpen ? 'blur-2xl scale-[0.98]' : 'blur-0'}`}>
        
        {/* 文章头部 - 开屏动画 */}
        <header className={`mb-24 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="flex items-center space-x-4 mb-6 opacity-40">
            <span className="text-[10px] font-mono tracking-widest">{frontmatter.date}</span>
            <div className="h-px w-8 bg-current"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest">{frontmatter.tags?.[0] || 'Article'}</span>
          </div>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] font-black tracking-tighter uppercase mb-10">
            {frontmatter.title}
          </h1>
          {frontmatter.cover && (
            <div className="w-full aspect-[21/9] overflow-hidden border border-black/5 dark:border-white/10 group">
                <img src={frontmatter.cover} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100" />
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-20">
          {/* 左侧目录 - 极简 */}
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-8">
              <div>
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
            </div>
          </aside>

          {/* 正文区域 */}
          <article className={`flex-1 max-w-4xl transition-all duration-[1800ms] delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div 
              ref={contentRef}
              className="prose-custom dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            
            {/* 评论区 - 微边框化 */}
            <section id="comments" className="mt-32 pt-16 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-4 mb-10 opacity-30">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em]">Terminal Conversation</h3>
                    <div className="h-px flex-1 bg-current"></div>
                </div>
                <div id="waline-comment-container" className="rounded-xl overflow-hidden" />
            </section>
          </article>
        </div>

        {/* 推荐文章 - Bento Grid 风格 */}
        <section className="mt-48">
          <div className="flex items-center space-x-6 mb-12">
            <h2 className="text-xl font-black uppercase tracking-tighter">Read More</h2>
            <div className="h-px flex-1 bg-black/5 dark:bg-white/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
            {recommendedPosts.map(post => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <a className="group relative bg-white dark:bg-black p-8 min-h-[300px] flex flex-col justify-end overflow-hidden transition-colors hover:bg-gray-50 dark:hover:bg-[#050505]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                    <img src={post.cover} className="w-full h-full object-cover grayscale" />
                  </div>
                  <span className="text-[9px] font-mono opacity-30 mb-2">{post.date}</span>
                  <h4 className="text-lg font-black uppercase tracking-tighter leading-none group-hover:text-blue-500 transition-colors">{post.title}</h4>
                </a>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 图片预览 Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 dark:bg-black/95 backdrop-blur-2xl p-10 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-full max-h-full shadow-2xl rounded-sm" />
        </div>
      )}

      {/* 自定义 Prose 样式 */}
      <style jsx global>{`
        .prose-custom {
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          font-size: 1.05rem;
          color: rgba(var(--text-color), 0.8);
        }
        .prose-custom h2 {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          margin: 3rem 0 1.5rem;
          display: flex;
          align-items: center;
        }
        .prose-custom h2::before {
          content: '';
          width: 1rem;
          height: 1rem;
          background: #2563eb;
          margin-right: 1rem;
          display: inline-block;
        }
        .prose-custom p { margin-bottom: 1.8rem; }
        .prose-custom img { 
          border: 1px solid rgba(0,0,0,0.05); 
          border-radius: 2px; 
          margin: 3rem 0; 
          cursor: zoom-in; 
        }
        .prose-custom pre {
          background: #050505 !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          margin: 2.5rem 0;
          overflow: hidden;
        }
        .prose-custom code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
        .prose-custom blockquote {
          border-left: 4px solid #2563eb;
          padding-left: 2rem;
          font-style: italic;
          opacity: 0.6;
          margin: 3rem 0;
        }
        .prose-custom table {
          width: 100%;
          border-collapse: collapse;
          margin: 3rem 0;
          font-size: 0.9rem;
        }
        .prose-custom th, .prose-custom td {
          border: 1px solid rgba(0,0,0,0.05);
          padding: 1rem;
          text-align: left;
        }
        .dark .prose-custom th, .dark .prose-custom td { border-color: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href}><a className="opacity-40 hover:opacity-100 transition-opacity tracking-widest">{children}</a></Link>
);
