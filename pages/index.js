import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

// 每页显示的文章数量
const POSTS_PER_PAGE = 5;

// 动态样式定义 
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* 基础样式重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* 全局动画变量 */
    :root {
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      --shadow-hover: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* 新增分页样式 */
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 3rem;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
    }
    .page-item {
      display: inline-flex;
    }
    .page-link {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      color: #4b5563;
      border-radius: 0.375rem;
      transition: var(--transition);
      cursor: pointer;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
    }
    .page-link:hover {
      background-color: #f3f4f6;
      border-color: #d1d5db;
    }
    .page-link.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
    }
    .page-link.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .dark .page-link {
      border-color: #4b5563;
      color: #d1d5db;
      background-color: #1f2937;
    }
    .dark .page-link:hover {
      background-color: #374151;
      border-color: #6b7280;
    }
    .dark .page-link.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    /* 页面切换动画 */
    .page-transition {
      opacity: 1;
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    }
    .page-transition-exit {
      opacity: 1;
      transform: translateY(0);
    }
    .page-transition-exit-active {
      opacity: 0;
      transform: translateY(20px);
    }
    .page-transition-enter {
      opacity: 0;
      transform: translateY(-20px);
    }
    .page-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
    }

    /* 背景渐变过渡 */
    .bg-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1s ease-in-out;
      z-index: -1;
      background-size: 400% 400%;
      animation: gradientAnimation 15s ease infinite;
    }
    @keyframes gradientAnimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .bg-visible {
      opacity: 1;
    }

    /* 响应式布局 */
    @media (max-width: 1200px) {
      .sidebar {
        width: 280px;
      }
    }
    @media (max-width: 1024px) {
      .content-wrapper {
        grid-template-columns: 1fr;
      }
      .sidebar {
        width: 100%;
        order: 2;
        margin-top: 3rem;
      }
      .hero-title {
        font-size: 3.5rem;
      }
    }
    @media (max-width: 767px) {
      .cover-image-container {
        width: 100%;
        height: 180px;
      }
      .profile-card {
        width: 100% !important;
        margin-bottom: 2rem;
      }
      .pagination {
        flex-wrap: wrap;
      }
      .hero-title {
        font-size: 2.5rem;
      }
    }

    /* 打字机效果 */
    .typewriter {
      display: inline-block;
      white-space: pre-wrap;
      margin: 0 auto;
      letter-spacing: 0.15em;
      border-right: 0.15em solid #4a5568;
      animation: blink-caret 0.75s step-end infinite;
    }
    @keyframes blink-caret {
      from,
      to {
        border-color: transparent;
      }
      50% {
        border-color: #4a5568;
      }
    }

    /* 其他样式 */
    .line-clamp-4 {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    header {
      margin-bottom: 6rem;
    }
    .hitokoto-container {
      max-width: 80%;
      margin: 0 auto;
      overflow-wrap: break-word;
      word-wrap: break-word;
      white-space: normal;
    }

    /* 新增动画样式 */
    .page-container {
      position: relative;
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-container.mounted {
      opacity: 1;
      transform: translateY(0);
    }

    /* 标签样式 */
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #3b82f6;
      background-color: #dbeafe;
      border-radius: 0.375rem;
      transition: var(--transition);
    }
    .tag:hover {
      background-color: #bfdbfe;
      transform: translateY(-2px);
    }
    .dark .tag {
      color: #93c5fd;
      background-color: #1e3a8a;
    }
    .dark .tag:hover {
      background-color: #1e40af;
      transform: translateY(-2px);
    }

    /* 简介框样式 */
    .profile-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(59, 130, 246, 0.5);
      transition: var(--transition);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .profile-avatar:hover {
      transform: scale(1.05);
      border-color: rgba(59, 130, 246, 0.8);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .stats-card {
      transition: var(--transition);
      background: white;
      dark:background: #1f2937;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .stats-card:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .dark .stats-card {
      background: #1f2937;
    }

    /* 社交媒体图标样式 */
    .social-icons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .social-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: #f3f4f6;
      color: #4b5563;
      transition: var(--transition);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .social-icon:hover {
      transform: translateY(-3px);
      background-color: #e5e7eb;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .dark .social-icon {
      background-color: #374151;
      color: #d1d5db;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .dark .social-icon:hover {
      background-color: #4b5563;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    }
    .social-icon svg {
      width: 20px;
      height: 20px;
    }
    .social-icon img {
      width: 20px;
      height: 20px;
      filter: grayscale(100%) contrast(0.5);
      transition: filter 0.3s ease;
    }
    .social-icon:hover img {
      filter: grayscale(0%) contrast(1);
    }
    .dark .social-icon img {
      filter: grayscale(100%) contrast(1) invert(1);
    }
    .dark .social-icon:hover img {
      filter: grayscale(0%) contrast(1) invert(0);
    }

    /* 搜索模态框样式 */
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
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .search-modal.active {
      opacity: 1;
      visibility: visible;
    }
    .search-container {
      width: 90%;
      max-width: 600px;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }
    .search-modal.active .search-container {
      transform: translateY(0);
    }
    .dark .search-container {
      background-color: #1f2937;
    }
    .search-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      position: relative;
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
      transition: background-color 0.2s, transform 0.2s;
      display: flex;
      flex-direction: column;
    }
    .search-result-item:hover {
      background-color: #f9fafb;
      transform: translateX(5px);
    }
    .dark .search-result-item {
      border-bottom-color: #374151;
    }
    .dark .search-result-item:hover {
      background-color: #374151;
      transform: translateX(5px);
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
      margin-top: 0.5rem;
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

    /* 新增文章卡片样式 */
    .article-card {
      position: relative;
      border-radius: 1rem;
      overflow: hidden;
      transition: var(--transition);
      box-shadow: var(--shadow);
      background: linear-gradient(145deg, #f8fafc, #f1f5f9);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      dark:border: 1px solid #374151;
    }
    .dark .article-card {
      background: linear-gradient(145deg, #1f2937, #111827);
      box-shadow: var(--shadow);
    }
    .article-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-hover);
      z-index: 10;
    }
    .dark .article-card:hover {
      box-shadow: var(--shadow-hover);
    }
    .article-cover-container {
      height: 220px;
      overflow: hidden;
      position: relative;
    }
    .article-cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));
      z-index: 1;
    }
    .article-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
      z-index: 0;
    }
    .article-card:hover .article-cover {
      transform: scale(1.05);
    }
    .article-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 2;
    }
    .article-date {
      display: inline-block;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: #6b7280;
      background-color: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
    }
    .dark .article-date {
      color: #d1d5db;
      background-color: #374151;
    }
    .article-date svg {
      margin-right: 0.5rem;
    }
    .article-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #111827;
      transition: color 0.2s ease;
      line-height: 1.3;
    }
    .dark .article-title {
      color: #f3f4f6;
    }
    .article-excerpt {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.7;
      flex: 1;
    }
    .dark .article-excerpt {
      color: #9ca3af;
    }
    .article-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
      dark:border-top: 1px solid #374151;
    }
    .read-more {
      display: inline-flex;
      align-items: center;
      color: #3b82f6;
      font-weight: 500;
      transition: color 0.2s ease;
      position: relative;
      padding-right: 1.5rem;
    }
    .dark .read-more {
      color: #60a5fa;
    }
    .read-more:hover {
      color: #2563eb;
    }
    .dark .read-more:hover {
      color: #3b82f6;
    }
    .read-more:after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: translateY(-50%) rotate(45deg);
      transition: transform 0.2s ease;
    }
    .read-more:hover:after {
      transform: translateY(-50%) rotate(135deg);
    }
    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* 导航栏样式 */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0));
      dark:background: linear-gradient(to bottom, rgba(31, 41, 55, 0.95), rgba(31, 41, 55, 0));
      backdrop-blur-md;
      shadow-md;
      z-index: 50;
      transition: background-color 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease;
      padding: 0;
    }
    .navbar.scrolled {
      background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.95));
      dark:background: linear-gradient(to bottom, rgba(31, 41, 55, 0.95), rgba(31, 41, 55, 0.95));
      padding: 0.5rem 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 8rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      background-clip: text;
      text-transparent;
      background-gradient: to-r from-blue-400 to-blue-600;
      dark:background-gradient: to-r from-blue-500 to-blue-700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo svg {
      width: 24px;
      height: 24px;
    }
    .nav-links {
      display: flex;
      gap: 2.5rem;
    }
    .nav-link {
      color: #4b5563;
      dark:color: #d1d5db;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
      position: relative;
    }
    .nav-link:after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background-color: #3b82f6;
      dark:background-color: #3b82f6;
      transition: width 0.2s ease;
    }
    .nav-link:hover {
      color: #3b82f6;
      dark:color: #60a5fa;
    }
    .nav-link:hover:after {
      width: 100%;
    }
    .nav-actions {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }
    .action-button {
      background: none;
      border: none;
      color: #4b5563;
      dark:color: #d1d5db;
      cursor: pointer;
      font-size: 1.25rem;
      transition: color 0.2s ease;
      position: relative;
    }
    .action-button:hover {
      color: #3b82f6;
      dark:color: #60a5fa;
    }
    .action-button.notification {
      position: relative;
    }
    .action-button.notification:after {
      content: '3';
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      background-color: #ef4444;
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 移动端导航样式 */
    .mobile-menu-button {
      display: none;
      background: none;
      border: none;
      color: #4b5563;
      dark:color: #d1d5db;
      font-size: 1.5rem;
      cursor: pointer;
    }

    /* 页脚样式 */
    footer {
      margin-top: 8rem;
      padding: 4rem 0;
      border-top: 1px solid #e5e7eb;
      dark:border-top: 1px solid #374151;
      text-align: center;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    .footer-logo {
      font-size: 1.5rem;
      font-weight: bold;
      background-clip: text;
      text-transparent;
      background-gradient: to-r from-blue-400 to-blue-600;
      dark:background-gradient: to-r from-blue-500 to-blue-700;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-link {
      color: #6b7280;
      dark:color: #9ca3af;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .footer-link:hover {
      color: #3b82f6;
      dark:color: #60a5fa;
    }
    .footer-copyright {
      color: #9ca3af;
      font-size: 0.875rem;
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const router = useRouter();
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // 其他原有状态
  const [transitionState, setTransitionState] = useState('idle');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hitokoto, setHitokoto] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navbarScroll, setNavbarScroll] = useState(false);

  // 搜索相关状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 滚动位置状态
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const lastScrollY = useRef(0);

  // 计算文章总数和标签总数
  const totalPosts = allPostsData.length;
  const allTags = new Set();
  allPostsData.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });
  const totalTags = allTags.size;

  // 初始化分页
  useEffect(() => {
    const total = Math.ceil(allPostsData.length / POSTS_PER_PAGE);
    setTotalPages(total);
    updatePaginatedPosts(1);
  }, [allPostsData]);

  // 更新分页文章
  const updatePaginatedPosts = (page) => {
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setPaginatedPosts(allPostsData.slice(startIndex, endIndex));
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updatePaginatedPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理搜索查询变化
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
      // 高亮匹配的文本
      highlightedTitle: highlightText(post.title, query),
      highlightedExcerpt: post.excerpt ? highlightText(post.excerpt, query) : '',
    }));

    setSearchResults(results);
  }, [searchQuery, allPostsData]);

  // 高亮匹配文本的函数
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };

  // 打开搜索模态框
  const openSearch = () => {
    setIsSearchOpen(true);
    document.body.style.overflow = 'hidden';
    // 聚焦搜索输入框
    setTimeout(() => {
      document.getElementById('search-input')?.focus();
    }, 100);
  };

  // 关闭搜索模态框
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    document.body.style.overflow = '';
  };

  // 处理搜索结果的点击
  const handleSearchResultClick = (slug) => {
    closeSearch();
    router.push(`/posts/${slug}`);
  };

  useEffect(() => {
    addDynamicStyles();

    // 从本地存储获取暗黑模式设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);

    // 获取一言
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((data) => {
        setHitokoto(data.hitokoto);
        typeWriterEffect(data.hitokoto);
      })
      .catch((error) => {
        console.error('获取一言失败:', error);
        const defaultHitokoto = '生活不止眼前的苟且，还有诗和远方的田野。';
        setHitokoto(defaultHitokoto);
        typeWriterEffect(defaultHitokoto);
      });

    // 路由事件监听
    const handleRouteChangeStart = (url) => {
      // 如果是离开首页，保存滚动位置
      if (router.pathname === '/') {
        setScrollPosition(window.scrollY);
      }
      setTransitionState('exiting');
      setIsMounted(false);
    };

    const handleRouteChangeComplete = (url) => {
      setTransitionState('entering');
      setTimeout(() => {
        setTransitionState('idle');
        setIsMounted(true);
      }, 300);
    };

    const handleHistoryChange = (url, { shallow }) => {
      // 检测是否是返回首页
      if (url === '/' && router.pathname !== '/') {
        setIsReturning(true);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('beforeHistoryChange', handleHistoryChange);

    // 初始化页面动画
    setIsMounted(true);

    // 初始化设备宽度检测
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 添加键盘快捷键 (Cmd+K / Ctrl+K)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    };

    // 滚动监听 - 导航栏效果
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setNavbarScroll(scrollY > 50);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('beforeHistoryChange', handleHistoryChange);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [router]);

  // 处理返回首页时的滚动位置
  useEffect(() => {
    if (isReturning) {
      // 延迟执行以确保页面已经渲染完成
      const timer = setTimeout(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
        setIsReturning(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isReturning, scrollPosition]);

  // 检测设备宽度
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 1024);
  };

  // 打字机效果
  const typeWriterEffect = (text) => {
    let i = 0;
    const speed = 80;
    const container = document.querySelector('.hitokoto-container');
    const typewriterElement = document.querySelector('.typewriter');

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        if (typewriterElement.scrollWidth > container.clientWidth) {
          typewriterElement.style.whiteSpace = 'pre-wrap';
        }
        i++;
      } else {
        clearInterval(timer);
        if (typewriterElement) {
          typewriterElement.style.animation = 'none';
          typewriterElement.style.borderRight = 'none';
        }
      }
    }, speed);
  };

  // 动态背景渐变
  useEffect(() => {
    const lightColors = [
      'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
      'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
      'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
      'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
    ];

    const darkColors = [
      'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
      'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #4338ca 100%)',
      'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
      'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)',
    ];

    const colors = isDarkMode ? darkColors : lightColors;

    const bg1 = document.createElement('div');
    const bg2 = document.createElement('div');
    bg1.className = bg2.className = 'bg-transition';
    document.body.append(bg1, bg2);

    let currentIndex = 0;
    let activeBg = bg1;

    activeBg.style.backgroundImage = colors[currentIndex];
    activeBg.classList.add('bg-visible');

    const changeBackground = () => {
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextBg = activeBg === bg1 ? bg2 : bg1;

      nextBg.style.backgroundImage = colors[nextIndex];

      setTimeout(() => {
        activeBg.classList.remove('bg-visible');
        nextBg.classList.add('bg-visible');
        activeBg = nextBg;
        currentIndex = nextIndex;
      }, 100);
    };

    const intervalId = setInterval(changeBackground, 3500);

    return () => {
      clearInterval(intervalId);
      bg1.remove();
      bg2.remove();
    };
  }, [isDarkMode]);

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 获取过渡类名
  const getTransitionClass = () => {
    switch (transitionState) {
      case 'exiting':
        return 'page-transition-exit';
      case 'entering':
        return 'page-transition-enter';
      default:
        return '';
    }
  };

  // 截取250字左右的摘要
  const getExcerpt = (content) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, ''); // 去除HTML标签
    return plainText.length > 250 ? plainText.substring(0, 250) + '...' : plainText;
  };

  return (
    <>
      {/* 导航栏 */}
      <nav className={`navbar ${navbarScroll ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" passHref>
            <a className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Typace
            </a>
          </Link>

          {/* 桌面导航 */}
          <div className="nav-links hidden md:flex">
            <NavLink href="/">首页</NavLink>
            <NavLink href="/about">关于</NavLink>
            <NavLink href="/archive">归档</NavLink>
            <NavLink href="/tags">标签</NavLink>
          </div>

          <div className="nav-actions">
            <button
              onClick={openSearch}
              className="action-button"
              title="搜索 (Ctrl+K)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={toggleDarkMode}
              className="action-button"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <button
              className="action-button notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="mobile-menu-button md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* 搜索模态框 */}
      <div className={`search-modal ${isSearchOpen ? 'active' : ''}`}>
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

      {/* 移动端菜单 */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        {/* 遮罩层 */}
        <div 
          className={`absolute inset-0 bg-black/20 dark:bg-black/40 transition-opacity ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* 菜单内容 */}
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

      {/* 页面内容 */}
      <div className={`min-h-screen p-8 pt-24 relative z-10 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>首页 - Typace</title>
        </Head>

        <header className="text-center mb-12">
          <h1 className="hero-title text-[clamp(2.5rem,5vw,4rem)] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
            Typace
          </h1>
          <div className="hitokoto-container mt-8 max-w-2xl mx-auto">
            <p className="mt-4 text-[clamp(1rem,2vw,1.25rem)] text-gray-600 dark:text-gray-400 italic">
              <span className="typewriter">{displayText}</span>
            </p>
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="content-wrapper grid grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* 左侧简介栏 */}
          <aside className="sidebar col-span-12 lg:col-span-3 pr-0 lg:pr-8">
            {/* 简介板块和最新文章板块的容器 */}
            <div className="sticky top-24 space-y-6">
              {/* 简介板块 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
                <div className="flex flex-col items-center text-center">
                  {/* 博主头像 */}
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 relative">
                    <img 
                      src="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" 
                      alt="博主头像" 
                      className="w-full h-full object-cover profile-avatar"
                    />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Typace
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md mx-auto">
                    分享技术心得，记录成长轨迹，探索编程世界的无限可能
                  </p>
                  <div className="flex space-x-3 mb-6">
                    <Link href="/archive" passHref>
                      <a className="stats-card flex-1 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalPosts}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          文章
                        </div>
                      </a>
                    </Link>
                    <Link href="/tags" passHref>
                      <a className="stats-card flex-1 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalTags}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          标签
                        </div>
                      </a>
                    </Link>
                  </div>

                  {/* 社交媒体图标 */}
                  <div className="social-icons">
                    <a 
                      href="mailto:zhang@mrzxr.com" 
                      className="social-icon"
                      title="发送邮件"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                    <a 
                      href="https://bgithub.xyz/terryzhangxr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-icon"
                      title="GitHub"
                    >
                      <img 
                        src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" 
                        alt="GitHub" 
                      />
                    </a>
                    <a 
                      href="https://space.bilibili.com/3546622533306643?spm_id_from=333.337.0.0"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-icon"
                      title="Bilibili"
                    >
                      <img 
                        src="https://www.bilibili.com/favicon.ico" 
                        alt="Bilibili" 
                        style={{ width: '20px', height: '20px' }}
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* 最新文章板块 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  最新文章
                </h2>
                <ul className="space-y-4">
                  {allPostsData.slice(0, 5).map((post) => (
                    <li key={post.slug} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                      <Link href={`/posts/${post.slug}`} passHref>
                        <a className="block text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {post.date}
                          </p>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* 文章列表 */}
          <main className="col-span-12 lg:col-span-9">
            <div className="grid gap-8">
              {paginatedPosts.map(({ slug, title, date, cover, excerpt, content, tags }) => (
                <motion.article 
                  key={slug} 
                  className="article-card"
                  initial={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * paginatedPosts.indexOf(post) }}
                >
                  {cover && (
                    <div className="article-cover-container">
                      <div className="article-cover-overlay"></div>
                      <img
                        src={cover}
                        alt={title}
                        className="article-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="article-content">
                    <span className="article-date">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {date}
                    </span>
                    <Link href={`/posts/${slug}`} passHref>
                      <a>
                        <h2 className="article-title">{title}</h2>
                      </a>
                    </Link>
                    <p className="article-excerpt line-clamp-5 mt-2">
                      {excerpt || getExcerpt(content)}
                    </p>
                    <div className="article-footer">
                      {tags && tags.length > 0 && (
                        <div className="tag-container">
                          {tags.map((tag) => (
                            <Link key={tag} href={`/tags#${tag}`} passHref>
                              <a className="tag">
                                {tag}
                              </a>
                            </Link>
                          ))}
                        </div>
                      )}
                      <Link href={`/posts/${slug}`} passHref>
                        <a className="read-more">
                          阅读更多
                        </a>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* 分页组件 */}
            {totalPages > 0 && (
              <div className="pagination mt-12">
                <li className="page-item">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`page-link ${currentPage === 1 ? 'disabled' : ''}`}
                    disabled={currentPage === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    上一页
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className="page-item">
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`page-link ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className="page-item">
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`page-link ${currentPage === totalPages ? 'disabled' : ''}`}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              </div>
            )}
          </main>
        </div>

        {/* 页脚 */}
        <footer className="mt-16">
          <div className="footer-content">
            <div className="footer-logo mb-6">
              Typace
            </div>
            <div className="footer-links mb-6">
              <a href="/" className="footer-link">首页</a>
              <a href="/about" className="footer-link">关于</a>
              <a href="/archive" className="footer-link">归档</a>
              <a href="/tags" className="footer-link">标签</a>
              <a href="/contact" className="footer-link">联系</a>
            </div>
            <div className="footer-copyright">
              &copy; {new Date().getFullYear()} Typace. 保留所有权利. 由{" "}
              <a href="https://bgithub.xyz/terryzhangxr/typace-i" className="text-blue-600 hover:underline dark:text-blue-400">
                Typace
              </a>
              提供技术支持.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// 桌面导航链接组件
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="nav-link">
      {children}
    </a>
  </Link>
);

// 移动端导航链接组件
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
