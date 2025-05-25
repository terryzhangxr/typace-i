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
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // 提前解析目录结构
  const headings = [];
  const lines = content.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      headings.push({
        level: 'h1',
        text: line.replace('# ', '').trim(),
        id: line.replace('# ', '').trim().toLowerCase().replace(/\s+/g, '-')
      });
    } else if (line.startsWith('## ')) {
      headings.push({
        level: 'h2',
        text: line.replace('## ', '').trim(),
        id: line.replace('## ', '').trim().toLowerCase().replace(/\s+/g, '-')
      });
    }
  });

  // 只处理部分内容用于初始渲染
  const halfContent = lines.slice(0, Math.floor(lines.length / 2)).join('\n');
  const processedHalfContent = await remark().use(html).process(halfContent);
  const halfContentHtml = processedHalfContent.toString();

  // 处理完整内容
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const allPostsData = getSortedPostsData();
  const filteredPosts = allPostsData.filter((post) => post.slug !== params.slug);
  const recommendedPosts = filteredPosts
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return {
    props: {
      frontmatter: data,
      contentHtml,
      halfContentHtml,
      headings,
      recommendedPosts,
      allPostsData,
      totalLines: lines.length
    },
  };
}

export default function Post({ 
  frontmatter, 
  contentHtml, 
  halfContentHtml, 
  headings,
  recommendedPosts, 
  allPostsData,
  totalLines
}) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toc, setToc] = useState(headings); // 使用预先生成的目录
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeHeading, setActiveHeading] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasLoadedFullContent, setHasLoadedFullContent] = useState(totalLines < 100); // 短文章直接加载全部
  const [displayedContent, setDisplayedContent] = useState(totalLines < 100 ? contentHtml : halfContentHtml);
  const walineInstance = useRef(null);
  const contentRef = useRef(null);
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastScrollPosition = useRef(0);
  const commentSectionRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 检查是否需要加载剩余内容
  useEffect(() => {
    if (hasLoadedFullContent || totalLines < 100) return;

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setDisplayedContent(contentHtml);
          setHasLoadedFullContent(true);
          if (intersectionObserverRef.current) {
            intersectionObserverRef.current.disconnect();
          }
        }
      });
    };

    intersectionObserverRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
      threshold: 0.1
    });

    if (contentRef.current) {
      const sentinel = document.createElement('div');
      sentinel.id = 'content-sentinel';
      contentRef.current.appendChild(sentinel);
      intersectionObserverRef.current.observe(sentinel);
    }

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [contentHtml, hasLoadedFullContent, totalLines]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const smoothScrollTo = useCallback((position, callback) => {
    if (scrollTimeoutRef.current) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }

    const startPosition = window.pageYOffset;
    const distance = position - startPosition;
    const duration = 500;
    let startTime = null;

    const animateScroll = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + (distance * easeProgress));
      
      if (timeElapsed < duration) {
        scrollTimeoutRef.current = requestAnimationFrame(animateScroll);
      } else {
        if (callback) callback();
      }
    };

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    setIsScrolling(true);
    scrollTimeoutRef.current = requestAnimationFrame(animateScroll);
  }, []);

  const scrollToComments = useCallback(() => {
    if (!commentSectionRef.current) return;
    const commentPosition = commentSectionRef.current.offsetTop;
    const offset = 100;
    const targetPosition = commentPosition - offset;
    smoothScrollTo(targetPosition);
  }, [smoothScrollTo]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .prose {
        max-width: 100%;
        width: 100%;
        overflow-x: hidden;
      }
      
      .prose img {
        max-width: 100%;
        height: auto;
        display: block;
        margin-left: auto;
        margin-right: auto;
        border-radius: 0.5rem;
        cursor: zoom-in;
        transition: transform 0.2s ease;
      }
      
      .prose img:hover {
        transform: scale(1.02);
      }
      
      /* Enhanced code block styles */
      .prose pre {
        position: relative;
        background-color: var(--color-code-bg);
        border-radius: 0.5rem;
        padding: 1.5rem 1rem 1rem;
        margin: 1.5rem 0;
        overflow: hidden;
      }

      .prose pre code {
        display: block;
        padding: 0;
        background: transparent;
        font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', monospace;
        font-size: 0.9em;
        line-height: 1.6;
      }

      /* Improved code block scrolling */
      .prose pre {
        overflow-x: auto;
      }

      .prose pre code {
        display: block;
        padding-right: 1rem;
      }

      /* Custom scrollbar for code blocks */
      .prose pre::-webkit-scrollbar {
        height: 6px;
        background-color: transparent;
      }

      .prose pre::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      .dark .prose pre::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .code-block-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0.75rem;
        background-color: var(--color-code-header);
        color: var(--color-code-text);
        font-size: 0.75rem;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
        z-index: 1;
      }

      .copy-btn {
        background: var(--color-code-btn-bg);
        color: var(--color-code-btn-text);
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        position: relative;
        z-index: 2;
      }

      .copy-btn:hover {
        background: var(--color-code-btn-hover);
      }

      .copy-btn.copied {
        background: var(--color-code-btn-success);
      }

      .copy-btn svg {
        width: 0.9rem;
        height: 0.9rem;
      }

      :root {
        --color-code-bg: #f6f8fa;
        --color-code-header: #e1e4e8;
        --color-code-text: #24292e;
        --color-code-btn-bg: #e1e4e8;
        --color-code-btn-text: #24292e;
        --color-code-btn-hover: #d1d5da;
        --color-code-btn-success: #28a745;
      }

      .dark {
        --color-code-bg: #2d2d2d;
        --color-code-header: #1e1e1e;
        --color-code-text: #f8f8f2;
        --color-code-btn-bg: #1e1e1e;
        --color-code-btn-text: #f8f8f2;
        --color-code-btn-hover: #333;
        --color-code-btn-success: #28a745;
      }

      /* Smart code block width handling */
      .prose pre {
        width: 100%;
        max-width: 100%;
      }

      /* Table styles */
      .prose table {
        display: block;
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
        margin: 1.5rem 0;
      }
      
      .prose table th,
      .prose table td {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
      }
      
      .dark .prose table th,
      .dark .prose table td {
        border-color: #374151;
      }
      
      @media (min-width: 1024px) {
        .prose table {
          display: table;
          white-space: normal;
        }
      }
      
      .image-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }
      
      .image-preview-container {
        max-width: 90%;
        max-height: 90%;
        position: relative;
      }
      
      .image-preview-container img {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
      
      .image-preview-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      
      .image-preview-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .search-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 20vh;
        z-index: 1000;
        backdrop-filter: blur(5px);
      }
      .search-container {
        width: 90%;
        max-width: 600px;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .dark .search-container {
        background-color: #1f2937;
      }
      .search-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
      }
      .dark .search-header {
        border-bottom-color: #374151;
      }
      .search-input {
        flex: 1;
        padding: 0.75rem;
        border: none;
        outline: none;
        font-size: 1rem;
        background-color: transparent;
      }
      .dark .search-input {
        color: white;
      }
      .search-close {
        padding: 0.5rem;
        cursor: pointer;
        color: #6b7280;
      }
      .dark .search-close {
        color: #9ca3af;
      }
      .search-results {
        max-height: 60vh;
        overflow-y: auto;
      }
      .search-result-item {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .dark .search-result-item {
        border-bottom-color: #374151;
      }
      .search-result-item:hover {
        background-color: #f9fafb;
      }
      .dark .search-result-item:hover {
        background-color: #374151;
      }
      .search-result-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: #111827;
      }
      .dark .search-result-title {
        color: #f3f4f6;
      }
      .search-result-excerpt {
        color: #6b7280;
        font-size: 0.875rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .dark .search-result-excerpt {
        color: #9ca3af;
      }
      .no-results {
        padding: 2rem;
        text-align: center;
        color: #6b7280;
      }
      .dark .no-results {
        color: #9ca3af;
      }
      .search-highlight {
        background-color: #fde68a;
        color: #92400e;
        padding: 0.1rem 0.2rem;
        border-radius: 0.25rem;
      }
      .dark .search-highlight {
        background-color: #92400e;
        color: #fde68a;
      }

      .toc-item {
        display: block;
        transition: all 0.2s ease;
        border-left: 2px solid transparent;
        padding: 0.25rem 0.5rem;
        color: #4b5563;
      }
      .dark .toc-item {
        color: #9ca3af;
      }
      .toc-item:hover {
        color: #3b82f6;
        border-left-color: #3b82f6;
      }
      .dark .toc-item:hover {
        color: #60a5fa;
        border-left-color: #60a5fa;
      }
      .toc-item.active {
        color: #3b82f6;
        font-weight: 600;
        border-left-color: #3b82f6;
        transform: translateX(4px);
      }
      .dark .toc-item.active {
        color: #60a5fa;
        border-left-color: #60a5fa;
      }
      .toc-item.h2 {
        padding-left: 1rem;
        font-size: 0.875rem;
      }
      .toc-item.h1 {
        padding-left: 0.5rem;
        font-size: 1rem;
      }

      html {
        scroll-padding-top: 100px;
      }

      .scroll-to-comment-btn {
        position: fixed;
        right: 2rem;
        bottom: 2rem;
        background-color: #3b82f6;
        color: white;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        z-index: 40;
      }
      .dark .scroll-to-comment-btn {
        background-color: #2563eb;
      }
      .scroll-to-comment-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      }
      .scroll-to-comment-btn svg {
        width: 24px;
        height: 24px;
      }

      .page-container {
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .page-container.mounted {
        opacity: 1;
        transform: translateY(0);
      }

      /* Fixed layout styles */
      .main-content-container {
        max-width: 100%;
        width: 100%;
        margin: 0 auto;
        padding: 0 1rem;
      }

      @media (min-width: 1024px) {
        .main-content-container {
          max-width: calc(100% - 288px);
          padding-right: 2rem;
        }
      }

      .article-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .prose {
        font-size: 1rem;
        line-height: 1.75;
      }

      .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }

      .prose p {
        margin-bottom: 1.25em;
      }

      .sidebar-container {
        width: 288px;
        position: sticky;
        top: 6rem;
        height: fit-content;
        overflow-y: auto;
        max-height: calc(100vh - 8rem);
      }

      .tag {
        display: inline-block;
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
        transition: all 0.2s ease;
      }

      .dark .tag {
        background-color: #1e3a8a;
        color: #bfdbfe;
      }

      .tag:hover {
        background-color: #bae6fd;
        color: #075985;
      }

      .dark .tag:hover {
        background-color: #1e40af;
        color: #93c5fd;
      }

      .loading-sentinel {
        height: 1px;
        width: 100%;
        visibility: hidden;
      }
    `;
    document.head.appendChild(style);

    setIsMounted(true);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleScroll = () => {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 100);
      lastScrollPosition.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;

    // Add copy buttons and handle code blocks
    const codeBlocks = contentRef.current.querySelectorAll('pre');
    codeBlocks.forEach((pre) => {
      // Skip if already processed
      if (pre.querySelector('.code-block-header')) return;

      // Create copy button
      const button = document.createElement('button');
      button.className = 'copy-btn';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        <span>复制</span>
      `;

      // Create header div
      const header = document.createElement('div');
      header.className = 'code-block-header';
      
      // Detect language (if specified in class)
      const language = pre.className.match(/language-(\w+)/)?.[1] || '代码';
      const languageSpan = document.createElement('span');
      languageSpan.textContent = language;
      
      header.appendChild(languageSpan);
      header.appendChild(button);
      pre.insertBefore(header, pre.firstChild);

      // Add copy functionality
      button.addEventListener('click', () => {
        const code = pre.querySelector('code')?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
          button.classList.add('copied');
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>已复制</span>
          `;
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>复制</span>
            `;
          }, 2000);
        });
      });
    });

    // Handle window resize to re-check overflow
    const handleResize = () => {
      const codeBlocks = contentRef.current?.querySelectorAll('pre') || [];
      codeBlocks.forEach((pre) => {
        const codeElement = pre.querySelector('code');
        if (codeElement) {
          // Force reflow to ensure proper width calculation
          void codeElement.offsetWidth;
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayedContent]);

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      document.getElementById('search-input')?.focus();
    }, 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultClick = (slug) => {
    closeSearch();
    router.push(`/posts/${slug}`);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allPostsData.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(query);
      const contentMatch = post.content && post.content.toLowerCase().includes(query);
      const tagMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
      
      return titleMatch || excerptMatch || contentMatch || tagMatch;
    }).map(post => ({
      ...post,
      highlightedTitle: highlightText(post.title, query),
      highlightedExcerpt: post.excerpt ? highlightText(post.excerpt, query) : '',
    }));

    setSearchResults(results);
  }, [searchQuery, allPostsData]);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsMounted(false);
    };

    const handleRouteChangeComplete = () => {
      setIsMounted(true);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  const loadHighlightJS = (isDark) => {
    return new Promise((resolve) => {
      const existingTheme = document.querySelector('#hljs-theme');
      if (existingTheme) existingTheme.remove();

      const theme = document.createElement('link');
      theme.id = 'hljs-theme';
      theme.rel = 'stylesheet';
      theme.href = isDark
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css';
      
      theme.onload = () => {
        if (window.hljs) {
          window.hljs.highlightAll();
        }
        resolve();
      };
      document.head.appendChild(theme);
    });
  };

  const initializeWaline = async () => {
    if (walineInstance.current) {
      walineInstance.current.destroy();
      walineInstance.current = null;
    }

    if (!document.querySelector('#waline-css')) {
      const link = document.createElement('link');
      link.id = 'waline-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/@waline/client@v2/dist/waline.css';
      document.head.appendChild(link);
    }

    if (typeof window.Waline === 'undefined') {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@waline/client@v2/dist/waline.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    walineInstance.current = window.Waline.init({
      el: '#waline-comment-container',
      serverURL: 'https://comment.mrzxr.top/',
      dark: 'html.dark',
      path: router.asPath,
      locale: { placeholder: '欢迎留言讨论...' },
    });
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);

    await loadHighlightJS(newDarkMode);
    initializeWaline();
  };

  useEffect(() => {
    return () => {
      if (walineInstance.current) {
        walineInstance.current.destroy();
      }
    };
  }, []);

  const setupHeadingObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const headings = contentRef.current?.querySelectorAll('h1, h2');
    if (!headings || headings.length === 0) return;

    const options = {
      root: null,
      rootMargin: '-100px 0px -50% 0px',
      threshold: 0.5
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (isScrolling) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id);
          
          const currentScroll = window.pageYOffset;
          if (currentScroll < lastScrollPosition.current) {
            const headingTop = entry.target.getBoundingClientRect().top;
            if (headingTop < 100) {
              const scrollTo = window.pageYOffset + headingTop - 100;
              window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
              });
            }
          }
          lastScrollPosition.current = currentScroll;
        }
      });
    }, options);

    headings.forEach(heading => {
      observerRef.current.observe(heading);
    });
  }, [isScrolling]);

  useEffect(() => {
    const initializePage = async () => {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);

      await Promise.all([
        loadHighlightJS(savedDarkMode),
        initializeWaline(),
        loadHLJSBase()
      ]);

      if (contentHtml) {
        setupImagePreview();
        setupHeadingAnchors();
        setTimeout(() => {
          setupHeadingObserver();
          if (window.location.hash) {
            const id = window.location.hash.substring(1);
            scrollToHeading(id, false);
          }
        }, 500);
      }
    };

    const loadHLJSBase = () => {
      if (!window.hljs) {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      return Promise.resolve();
    };

    const setupImagePreview = () => {
      const articleImages = document.querySelectorAll('.prose img');
      articleImages.forEach(img => {
        img.addEventListener('click', () => {
          setPreviewImage(img.src);
        });
      });
    };

    const setupHeadingAnchors = () => {
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach((heading) => {
          if (!heading.id) {
            const id = heading.textContent.toLowerCase().replace(/\s+/g, '-');
            heading.id = id;
          }
        });
      }
    };

    initializePage();
  }, [contentHtml, setupHeadingObserver]);

  const scrollToHeading = useCallback((id, smooth = true) => {
    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    const offset = 100;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    if (smooth) {
      smoothScrollTo(offsetPosition, () => {
        const finalPosition = targetElement.getBoundingClientRect().top;
        if (finalPosition < offset) {
          window.scrollBy({
            top: finalPosition - offset,
            behavior: 'auto'
          });
        }
      });
    } else {
      window.scrollTo({
        top: offsetPosition,
        behavior: 'auto'
      });
    }

    window.history.replaceState(null, '', `#${id}`);
    targetElement.setAttribute('tabindex', '-1');
    targetElement.focus();
    setActiveHeading(id);
  }, [smoothScrollTo]);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    scrollToHeading(id);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            <div className="hidden md:flex space-x-6 items-center">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={openSearch}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-2"
                title="搜索 (Ctrl+K)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-2"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={openSearch}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="搜索"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isSearchOpen && (
        <div className="search-modal">
          <div className="search-container">
            <div className="search-header">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-input"
                type="text"
                className="search-input"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button className="search-close" onClick={closeSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <div
                    key={post.slug}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(post.slug)}
                  >
                    <h3 
                      className="search-result-title"
                      dangerouslySetInnerHTML={{ __html: post.highlightedTitle }}
                    />
                    {post.highlightedExcerpt && (
                      <p 
                        className="search-result-excerpt"
                        dangerouslySetInnerHTML={{ __html: post.highlightedExcerpt }}
                      />
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{post.date}</p>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="no-results">没有找到匹配的文章</div>
              ) : (
                <div className="no-results">输入关键词搜索文章</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-black/20 dark:bg-black/40 transition-opacity ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        <div 
          className={`absolute right-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 space-y-4 pt-2">
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="mt-6 space-y-3">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>首页</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>关于</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMenuOpen(false)}>归档</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMenuOpen(false)}>标签</MobileNavLink>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>暗黑模式</span>
                <span>{isDarkMode ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="image-preview-overlay" onClick={closePreview}>
          <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" />
            <button className="image-preview-close" onClick={closePreview}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button 
        className="scroll-to-comment-btn"
        onClick={scrollToComments}
        aria-label="滚动到评论区"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <div className={`min-h-screen p-8 pt-24 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>{frontmatter.title} - Typace</title>
        </Head>

        <div className="container mx-auto flex flex-col lg:flex-row">
          <div className="main-content-container">
            <div className="article-container">
              {frontmatter.cover && (
                <div className="w-full h-48 md:h-64 mb-8">
                  <img
                    src={frontmatter.cover}
                    alt={frontmatter.title}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    onClick={() => setPreviewImage(frontmatter.cover)}
                  />
                </div>
              )}

              <article className="prose max-w-none w-full" ref={contentRef}>
                <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                  {frontmatter.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                  {frontmatter.date}
                </p>
                {frontmatter.tags && frontmatter.tags.length > 0 && (
                  <div className="mb-8">
                    {frontmatter.tags.map((tag) => (
                      <Link key={tag} href={`/tags#${tag}`} passHref>
                        <a className="tag">
                          {tag}
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
                <div
                  className="text-gray-700 dark:text-gray-300 w-full"
                  dangerouslySetInnerHTML={{ __html: displayedContent }}
                />
                {!hasLoadedFullContent && <div id="content-sentinel" className="loading-sentinel"></div>}
              </article>
            </div>

            {recommendedPosts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">推荐文章</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedPosts.map((post) => (
                    <Link key={post.slug} href={`/posts/${post.slug}`} legacyBehavior>
                      <a className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105">
                        {post.cover && (
                          <div className="w-full h-48">
                            <img
                              src={post.cover}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{post.date}</p>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section 
              id="comments"
              ref={commentSectionRef}
              className="mt-12"
            >
              <div id="waline-comment-container" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">评论</h3>
              </div>
            </section>

            <footer className="text-center mt-12">
              <a href="/api/sitemap" className="inline-block">
                <img
                  src="https://cdn.us.mrche.top/sitemap.svg"
                  alt="Sitemap"
                  className="block mx-auto w-8 h-8 dark:invert"
                />
              </a>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                由Terryzhang&mrche创建的
                <a
                  href="https://bgithub.xyz/terryzhangxr/typace-i"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Typace
                </a>
                强力驱动
              </p>
            </footer>
          </div>

          <div className="sidebar-container hidden lg:block">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">目录</h2>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleTocClick(e, item.id)}
                      className={`toc-item ${item.level} ${
                        activeHeading === item.id ? 'active' : ''
                      }`}
                      aria-current={activeHeading === item.id ? 'location' : undefined}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
      {children}
    </a>
  </Link>
);

const MobileNavLink = ({ href, children, onClick }) => (
  <Link href={href} passHref>
    <a 
      onClick={onClick}
      className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
    >
      {children}
    </a>
  </Link>
);
