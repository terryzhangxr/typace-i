import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSortedPostsData } from '../lib/posts';
import Head from 'next/head';
import Link from 'next/link';

// 动态样式添加函数
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .page-transition {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .bg-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1.5s ease-in-out;
      z-index: -1;
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
    header h1 {
      margin-bottom: 2rem;
    }
    header {
      margin-bottom: 4rem;
    }
    .hitokoto-container {
      max-width: 80%;
      margin: 0 auto;
      overflow-wrap: break-word;
      word-wrap: break-word;
      white-space: normal;
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hitokoto, setHitokoto] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化处理
  useEffect(() => {
    addDynamicStyles();

    // 仅从localStorage读取设置
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

    // 路由切换处理
    const handleRouteChange = () => {
      setIsMounted(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, []);

  // 页面切换动画逻辑
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        document.querySelectorAll('.page-transition').forEach(el => {
          el.classList.add('page-visible');
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  // 打字机效果
  const typeWriterEffect = (text) => {
    let i = 0;
    const speed = 100;
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

  // 背景渐变效果
  useEffect(() => {
    const lightColors = [
      'linear-gradient(45deg, #ee7752, #e73c7e)',
      'linear-gradient(45deg, #e73c7e, #23a6d5)',
      'linear-gradient(45deg, #23a6d5, #23d5ab)',
      'linear-gradient(45deg, #23d5ab, #ee7752)',
    ];

    const darkColors = [
      'linear-gradient(45deg, #1e3a8a, #9f7aea)',
      'linear-gradient(45deg, #9f7aea, #3b82f6)',
      'linear-gradient(45deg, #3b82f6, #60a5fa)',
      'linear-gradient(45deg, #60a5fa, #1e3a8a)',
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

    const intervalId = setInterval(changeBackground, 2500);

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

  if (!isMounted) return null;

  return (
    <div className="min-h-screen p-8 relative z-10">
      <Head>
        <title>首页 - Typace</title>
      </Head>

      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md z-20 page-transition">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" legacyBehavior>
              <a className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
                Typace
              </a>
            </Link>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" legacyBehavior>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    首页
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about" legacyBehavior>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    关于
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/archive" legacyBehavior>
                  <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                    归档
                  </a>
                </Link>
              </li>
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

      <header className="text-center mb-8 mt-24 page-transition">
        <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700">
          Typace
        </h1>
        <div className="hitokoto-container">
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
            <span className="typewriter">{displayText}</span>
          </p>
        </div>
      </header>

      <div className="flex">
        <aside className="w-1/4 pr-8 hidden lg:block page-transition">
          <div className="sticky top-24 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              最新文章
            </h2>
            <ul className="space-y-4">
              {allPostsData.slice(0, 5).map((post) => (
                <li key={post.slug}>
                  <Link href={`/posts/${post.slug}`} legacyBehavior>
                    <a className="block text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {post.date}
                      </p>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <ul className="space-y-6">
            {allPostsData.map(({ slug, title, date, cover, excerpt }) => (
              <li key={slug} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg p-6 transition transform hover:scale-105 page-transition">
                <div className="flex flex-col md:flex-row gap-6">
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
                  <div className="flex-1">
                    <Link href={`/posts/${slug}`} legacyBehavior>
                      <a className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        {title}
                      </a>
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{date}</p>
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

      <footer className="text-center mt-12 page-transition">
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
            href="https://www.mrche.top/typace"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Typace
          </a>
          强力驱动
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
        content: post.content || ""
      }))
    },
  };
}
