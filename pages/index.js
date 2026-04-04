import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

const POSTS_PER_PAGE = 6; // 现代布局通常使用偶数网格

export default function Home({ allPostsData }) {
  const router = useRouter();
  
  // --- 状态管理 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 核心逻辑 ---
  const totalPages = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return allPostsData.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, allPostsData]);

  const allTags = useMemo(() => {
    const tags = new Set();
    allPostsData.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [allPostsData]);

  // 搜索过滤
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPostsData.filter(post => 
      post.title.toLowerCase().includes(q) || 
      post.excerpt?.toLowerCase().includes(q) ||
      post.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, allPostsData]);

  // --- 副作用 ---
  useEffect(() => {
    setIsMounted(true);
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);

    // 获取并触发打字机
    fetch('https://v1.hitokoto.cn')
      .then(res => res.json())
      .then(data => startTypewriter(data.hitokoto));

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startTypewriter = (text) => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 80);
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <Head>
        <title>Typace | 探索数字生活的节奏</title>
      </Head>

      {/* 现代动态背景 - Aurora Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-600/5 animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-400/10 blur-[100px] dark:bg-purple-600/5" />
      </div>

      {/* 极简导航栏 */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity">
              TYPACE<span className="text-blue-500">.</span>
            </a>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <NavLink href="/about">关于</NavLink>
            <NavLink href="/archive">归档</NavLink>
            <NavLink href="/tags">标签</NavLink>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
               <SearchIcon />
            </button>
            <button onClick={toggleDarkMode} className="text-xl">{isDarkMode ? '🌙' : '☀️'}</button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <MenuIcon />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <header className="mb-20 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-500">
            Keep moving,<br />Keep writing.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-mono h-8">
            {displayText}<span className="animate-pulse">_</span>
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* 左侧侧边栏 - 卡片化 */}
          <aside className="lg:w-80 space-y-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <img 
                  src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                  className="rounded-2xl object-cover ring-4 ring-blue-500/10 shadow-lg"
                />
              </div>
              <h2 className="text-center text-xl font-bold mb-1">Typace Team</h2>
              <p className="text-center text-sm text-slate-500 mb-6">探索技术与艺术的边界</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-600">{allPostsData.length}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Articles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-600">{allTags.length}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Tags</p>
                </div>
              </div>
            </div>

            {/* 最新文章微组件 */}
            <div className="hidden lg:block">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Latest</h3>
               <div className="space-y-3">
                 {allPostsData.slice(0, 3).map(post => (
                   <Link key={post.slug} href={`/posts/${post.slug}`}>
                     <a className="group block p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                       <h4 className="text-sm font-bold group-hover:text-blue-500 transition-colors line-clamp-1">{post.title}</h4>
                       <p className="text-xs text-slate-400 mt-1">{post.date}</p>
                     </a>
                   </Link>
                 ))}
               </div>
            </div>
          </aside>

          {/* 文章列表 - 现代瀑布流网格 */}
          <section className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>

            {/* 现代分页 */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center space-x-2">
                <PaginationButton 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(c => c - 1)}
                  label="←"
                />
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <PaginationButton 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(c => c + 1)}
                  label="→"
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 现代化搜索模态框 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center">
              <SearchIcon className="w-5 h-5 text-slate-400 mr-4" />
              <input 
                autoFocus
                className="w-full bg-transparent outline-none text-lg"
                placeholder="搜索文章、标签、内容... (Esc 关闭)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {searchResults.length > 0 ? (
                searchResults.map(result => (
                  <Link key={result.slug} href={`/posts/${result.slug}`}>
                    <a className="block p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsSearchOpen(false)}>
                      <h4 className="font-bold">{result.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{result.excerpt}</p>
                    </a>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  {searchQuery ? "未找到相关结果" : "输入关键词开始搜索..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 极简页脚 */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Typace. Built with Passion by Terryzhang & mrche.
        </p>
      </footer>

      {/* 全局动画样式 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-enter {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// --- 抽离的子组件 ---

const ArticleCard = ({ post }) => (
  <article className="group relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-2">
    <div className="aspect-[16/9] overflow-hidden">
      <img 
        src={post.cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800'} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        alt={post.title}
      />
    </div>
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
          {post.date}
        </span>
      </div>
      <Link href={`/posts/${post.slug}`}>
        <a>
          <h3 className="text-xl font-bold mb-3 group-hover:text-blue-500 transition-colors leading-tight">
            {post.title}
          </h3>
        </a>
      </Link>
      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed">
        {post.excerpt || post.content.replace(/<[^>]*>/g, '').slice(0, 150)}
      </p>
      <div className="flex flex-wrap gap-2">
        {post.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="text-[11px] font-medium text-slate-400">#{tag}</span>
        ))}
      </div>
    </div>
  </article>
);

const NavLink = ({ href, children }) => (
  <Link href={href}>
    <a className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
      {children}
    </a>
  </Link>
);

const PaginationButton = ({ disabled, onClick, label }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 disabled:opacity-30 border border-slate-100 dark:border-slate-800"
  >
    {label}
  </button>
);

// --- 图标组件 ---
const SearchIcon = ({ className }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
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
