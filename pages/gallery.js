import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image'; 

// 获取 gallery.md 文件内容
export async function getStaticProps() {
  const galleryPath = path.join(process.cwd(), 'pages', 'gallery.md');
  const galleryContent = fs.readFileSync(galleryPath, 'utf8');
  const { data } = matter(galleryContent);

  // 处理图片数据
  const images = data.images.map(img => ({
    ...img,
    src: img.src.startsWith('/') ? img.src : `/${img.src}`, // 确保路径以/开头
  }));

  return {
    props: {
      frontmatter: data,
      images,
    },
  };
}

export default function Gallery({ frontmatter, images }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const router = useRouter();

  // 暗色模式切换
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // 图片加载动画处理
  const handleImageLoad = (e) => {
    e.target.parentElement.style.opacity = 1;
    e.target.parentElement.style.transform = 'scale(1)';
  };

  // 打开大图预览
  const openLightbox = (index) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  // 关闭大图预览
  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    // 初始化设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
    setIsMounted(true);

    // 键盘事件监听
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (selectedImage !== null) {
        if (e.key === 'ArrowRight' && selectedImage < images.length - 1) {
          setSelectedImage(prev => prev + 1);
        }
        if (e.key === 'ArrowLeft' && selectedImage > 0) {
          setSelectedImage(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-50 transition-colors duration-300">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>

            {/* 桌面导航 */}
            <div className="hidden md:flex space-x-6 items-center">
              <NavLink href="/">首页</NavLink>
              <NavLink href="/about">关于</NavLink>
              <NavLink href="/gallery">相册</NavLink>
              <NavLink href="/archive">归档</NavLink>
              <NavLink href="/tags">标签</NavLink>
              <button
                onClick={toggleDarkMode}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors p-2"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden flex items-center space-x-4">
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

      {/* 移动端侧滑菜单 */}
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
            {/* 关闭按钮 */}
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 菜单项 */}
            <div className="mt-6 space-y-3">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>首页</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>关于</MobileNavLink>
              <MobileNavLink href="/gallery" onClick={() => setIsMenuOpen(false)}>相册</MobileNavLink>
              <MobileNavLink href="/archive" onClick={() => setIsMenuOpen(false)}>归档</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setIsMenuOpen(false)}>标签</MobileNavLink>
            </div>
            
            {/* 暗黑模式按钮 */}
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

      <div className={`min-h-screen p-8 pt-24 relative z-10 bg-white dark:bg-gray-900 page-container ${
        isMounted ? 'mounted' : ''
      }`}>
        <Head>
          <title>{frontmatter.title || '相册'} - Typace</title>
          <meta name="description" content={frontmatter.description || '我的摄影作品集'} />
        </Head>

        <main className="mt-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            {frontmatter.title || '我的相册'}
          </h1>
          
          {frontmatter.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 text-center max-w-2xl mx-auto">
              {frontmatter.description}
            </p>
          )}

          {/* 瀑布流容器 */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img, index) => (
              <div 
                key={img.src}
                className="relative break-inside-avoid group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 opacity-0 scale-95 group-hover:shadow-xl"
                  style={{
                    opacity: 0,
                    transform: 'scale(0.95)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease'
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt || '相册图片'}
                    width={img.width || 800}
                    height={img.height || 600}
                    className="object-cover w-full h-auto"
                    onLoadingComplete={handleImageLoad}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* 图片描述 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="font-semibold text-lg">{img.title || '未命名图片'}</h3>
                    {img.description && (
                      <p className="text-sm mt-1">{img.description}</p>
                    )}
                    {img.tags && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {img.tags.map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 text-xs bg-white/20 backdrop-blur-sm rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 大图预览模态框 */}
        {selectedImage !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative max-w-6xl w-full max-h-[90vh]">
              <Image
                src={images[selectedImage].src}
                alt={images[selectedImage].alt || '相册图片'}
                width={1600}
                height={900}
                className="rounded-xl shadow-2xl object-contain max-h-[80vh]"
              />
              
              {/* 图片信息 */}
              <div className="mt-4 text-white text-center">
                <h3 className="text-xl font-semibold">
                  {images[selectedImage].title || '未命名图片'}
                </h3>
                {images[selectedImage].description && (
                  <p className="mt-2 text-gray-300">
                    {images[selectedImage].description}
                  </p>
                )}
              </div>
              
              {/* 导航箭头 */}
              {selectedImage > 0 && (
                <button
                  onClick={() => setSelectedImage(prev => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {selectedImage < images.length - 1 && (
                <button
                  onClick={() => setSelectedImage(prev => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 页脚 */}
        <footer className="text-center mt-12">
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            由Terryzhang&mrche创建的
            <a
              href="https://bgithub.xyz/terryzhangxr/typace-i"
              className="text-blue-600 hover:underline dark:text-blue-400 ml-1"
            >
              Typace
            </a>
            强势驱动
          </p>
        </footer>
      </div>

      <style jsx global>{`
        .page-container {
          opacity: 0;
          transform: translateY(200px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.1, 1);
        }
        .page-container.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* 暗色模式适配 */
        .dark .prose {
          color: #e5e7eb;
        }
        .dark .prose a {
          color: #60a5fa;
        }
        .dark .prose h1, .dark .prose h2, .dark .prose h3 {
          color: #f3f4f6;
        }
      `}</style>
    </>
  );
}

// 桌面导航链接组件
const NavLink = ({ href, children }) => (
  <Link href={href} passHref>
    <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
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
