import { useEffect, useState } from 'react';
import { getSortedPostsData } from '../lib/posts';

// 新增的样式定义
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .bg-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1.5s ease-in-out;
      z-index: -1; /* 确保背景在页面内容下方 */
    }
    .bg-visible {
      opacity: 1;
    }
    @media (max-width: 767px) {
      .cover-image-container {
        width: 100%;
        height: 200px;
      }
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    addDynamicStyles();

    // 检查本地存储或系统偏好设置
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedDarkMode || prefersDarkMode);

    // 动态切换暗黑模式
    if (savedDarkMode || prefersDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // 亮色模式下的渐变颜色
    const lightColors = [
      'linear-gradient(45deg, #ee7752, #e73c7e)',
      'linear-gradient(45deg, #e73c7e, #23a6d5)',
      'linear-gradient(45deg, #23a6d5, #23d5ab)',
      'linear-gradient(45deg, #23d5ab, #ee7752)',
    ];

    // 暗黑模式下的渐变颜色
    const darkColors = [
      'linear-gradient(45deg, #1e3a8a, #9f7aea)',
      'linear-gradient(45deg, #9f7aea, #3b82f6)',
      'linear-gradient(45deg, #3b82f6, #60a5fa)',
      'linear-gradient(45deg, #60a5fa, #1e3a8a)',
    ];

    // 获取当前模式下的渐变颜色
    const colors = isDarkMode ? darkColors : lightColors;

    // 创建两个背景层
    const bg1 = document.createElement('div');
    const bg2 = document.createElement('div');
    bg1.className = bg2.className = 'bg-transition';
    document.body.append(bg1, bg2);

    let currentIndex = 0;
    let activeBg = bg1;

    // 初始化第一个背景
    activeBg.style.backgroundImage = colors[currentIndex];
    activeBg.classList.add('bg-visible');

    const changeBackground = () => {
      const nextIndex = (currentIndex + 1) % colors.length;
      const nextBg = activeBg === bg1 ? bg2 : bg1;

      // 预加载下一个背景
      nextBg.style.backgroundImage = colors[nextIndex];
      
      // 触发过渡
      setTimeout(() => {
        activeBg.classList.remove('bg-visible');
        nextBg.classList.add('bg-visible');
        activeBg = nextBg;
        currentIndex = nextIndex;
      }, 100);
    };

    const intervalId = setInterval(changeBackground, 2500); // 2.5 秒切换一次背景

    return () => {
      clearInterval(intervalId);
      bg1.remove();
      bg2.remove();
    };
  }, [isDarkMode]); // 依赖 isDarkMode，当模式切换时重新初始化背景

  // 切换暗黑模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* 新增的导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-md z-20">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <a 
              href="/" 
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
            >
              Typace
            </a>
            <ul className="flex space-x-6">
              <li>
                <a 
                  href="/" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  首页
                </a>
              </li>
              <li>
                <a 
                  href="/about" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  关于
                </a>
              </li>
              <li>
                <a 
                  href="/archive" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  归档
                </a>
              </li>
              {/* 暗黑模式切换按钮 */}
              <li>
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {isDarkMode ? '🌙' : '☀️'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* 调整原有header的上边距 */}
      <header className="text-center mb-8 mt-24">
        <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Typace
        </h1>
      </header>

      {/* 保持原有main内容不变 */}
      <main>
        <ul className="space-y-6">
          {allPostsData.map(({ slug, title, date, cover, excerpt }) => (
            <li key={slug} className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-105">
              <div className="flex flex-col md:flex-row gap-6">
                {/* 封面图片 */}
                {cover && (
                  <div className="md:w-1/3 cover-image-container">
                    <img 
                      src={cover}
                      alt={title}
                      className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {/* 文字内容 */}
                <div className="flex-1">
                  <a href={`/posts/${slug}`} className="text-2xl font-semibold text-gray-800 hover:text-blue-600">
                    {title}
                  </a>
                  <p className="text-sm text-gray-600 mt-2">{date}</p>
                  {/* 显示摘要 */}
                  {excerpt && (
                    <p className="mt-3 text-gray-700 leading-relaxed line-clamp-3">
                      {excerpt}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* 保持原有footer内容不变 */}
      <footer className="text-center mt-12">
        <a href="/api/sitemap" className="inline-block">
          <img
            src="https://cdn.us.mrche.top/sitemap.svg"
            alt="Sitemap"
            className="block mx-auto w-8 h-8"
          />
        </a>
        <p className="mt-4 text-gray-600">
          由MRCHE&terryzhang创建的
          <a
            href="https://www.mrche.top/typace"
            className="text-blue-600 hover:underline"
          >
            Typace
          </a>
          强势驱动
        </p>
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData: allPostsData.map(post => ({
        ...post,
        // 确保每篇文章都有content字段
        content: post.content || ""
      }))
    },
  };
}
