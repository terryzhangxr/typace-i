import { useEffect, useState } from 'react';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head'; // 引入 Head 组件
import Link from 'next/link';

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
    /* 打字机效果 */
    .typewriter {
      display: inline-block;
      white-space: pre-wrap; /* 允许在空格处换行 */
      margin: 0 auto;
      letter-spacing: 0.15em;
      border-right: 0.15em solid #4a5568; /* 光标 */
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

    /* 增加大标题与一言之间的间距 */
    header h1 {
      margin-bottom: 2rem; /* 调整标题与一言的间距 */
    }

    /* 增加一言与文章列表之间的间距 */
    header {
      margin-bottom: 4rem; /* 调整一言与文章列表的间距 */
    }

    /* 一言自动换行 */
    .hitokoto-container {
      max-width: 80%; /* 限制一言的最大宽度 */
      margin: 0 auto; /* 居中显示 */
      overflow-wrap: break-word; /* 自动换行 */
      word-wrap: break-word; /* 兼容性 */
      white-space: normal; /* 允许换行 */
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hitokoto, setHitokoto] = useState(''); // 存储一言
  const [displayText, setDisplayText] = useState(''); // 用于打字机效果的动态文本

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

    // 获取一言
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((data) => {
        setHitokoto(data.hitokoto); // 设置一言
        typeWriterEffect(data.hitokoto); // 启动打字机效果
      })
      .catch((error) => {
        console.error('获取一言失败:', error);
        const defaultHitokoto = '生活不止眼前的苟且，还有诗和远方的田野。';
        setHitokoto(defaultHitokoto);
        typeWriterEffect(defaultHitokoto); // 启动打字机效果
      });
  }, []);

  // 打字机效果
  const typeWriterEffect = (text) => {
    let i = 0;
    const speed = 100; // 打字速度（毫秒）
    const container = document.querySelector('.hitokoto-container');
    const typewriterElement = document.querySelector('.typewriter');

    const timer = setInterval(() => {
      if (i < text.length) {
        // 更新显示的文本
        setDisplayText(text.slice(0, i + 1));

        // 检测文本宽度是否超过容器宽度
        if (typewriterElement.scrollWidth > container.clientWidth) {
          // 如果超过宽度，则换行
          typewriterElement.style.whiteSpace = 'pre-wrap';
        }

        i++;
      } else {
        clearInterval(timer);
        // 打字完成后移除光标闪烁动画
        if (typewriterElement) {
          typewriterElement.style.animation = 'none'; // 停止动画
          typewriterElement.style.borderRight = 'none'; // 移除光标
        }
      }
    }, speed);
  };

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
      {/* 动态设置标签页 title */}
      <Head>
        <title>首页 - Typace</title>
      </Head>

      {/* 新增的导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-20">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <a 
              href="/" 
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
            >
              Typace
            </a>
            <ul className="flex space-x-6">
              <li>
                <a 
                  href="/" 
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  首页
                </a>
              </li>
              <li>
                <a 
                  href="/about" 
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  关于
                </a>
              </li>
              <li>
                <a 
                  href="/archive" 
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  归档
                </a>
              </li>
              {/* 暗黑模式切换按钮 */}
              <li>
                <button
                  onClick={toggleDarkMode}
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
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
        <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
          Typace
        </h1>
        {/* 一言 */}
        <div className="hitokoto-container">
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
            <span className="typewriter">{displayText}</span>
          </p>
        </div>
      </header>

      {/* 页面主体内容 */}
      <div className="flex">
        {/* 左侧最新文章栏 */}
        <aside className="w-1/4 pr-8 hidden lg:block">
          <div className="sticky top-24 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              最新文章
            </h2>
            <ul className="space-y-4">
              {allPostsData.slice(0, 5).map((post) => (
                <li key={post.slug}>
                  <a
                    href={`/posts/${post.slug}`}
                    className="block text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {post.date}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 右侧文章列表 */}
        <main className="flex-1">
          <ul className="space-y-6">
            {allPostsData.map(({ slug, title, date, cover, excerpt }) => (
              <li key={slug} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-105">
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
                    <a href={`/posts/${slug}`} className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                      {title}
                    </a>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{date}</p>
                    {/* 显示摘要 */}
                    {excerpt && (
                      <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>

      {/* 保持原有footer内容不变 */}
      <footer className="text-center mt-12">
        <a href="/api/sitemap" className="inline-block">
          <img
            src="https://cdn.us.mrche.top/sitemap.svg"
            alt="Sitemap"
            className="block mx-auto w-8 h-8 dark:invert"
          />
        </a>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          由MRCHE&terryzhang创建的
          <a
            href="https://github.com/terryzhangxr/typace-i"
            className="text-blue-600 hover:underline dark:text-blue-400"
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
