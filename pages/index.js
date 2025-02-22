import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    .splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 1;
      animation: splashFadeOut 0.5s ease-out 2s forwards;
    }
    .splash-text {
      display: flex;
      gap: 0.5rem;
      font-size: 4rem;
      font-weight: 800;
      background: linear-gradient(45deg, #4F46E5, #2563EB);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .splash-char {
      opacity: 0;
      transform: translateY(20px);
      animation: charFadeInUp 0.3s ease-out forwards;
      animation-delay: calc(0.1s * var(--index));
    }
    @keyframes charFadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes splashFadeOut {
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  const [showSplash, setShowSplash] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fromInternal = sessionStorage.getItem('fromInternal');
    if (fromInternal) {
      sessionStorage.removeItem('fromInternal');
    } else {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    addDynamicStyles();

    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const colors = [
      'linear-gradient(45deg, #ee7752, #e73c7e)',
      'linear-gradient(45deg, #e73c7e, #23a6d5)',
      'linear-gradient(45deg, #23a6d5, #23d5ab)',
      'linear-gradient(45deg, #23d5ab, #ee7752)',
    ];

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

    const intervalId = setInterval(changeBackground, 3000);

    return () => {
      clearInterval(intervalId);
      bg1.remove();
      bg2.remove();
      document.head.querySelector('style').remove();
    };
  }, [showSplash]);

  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* 开屏动画 */}
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-text">
            {'Typace'.split('').map((char, index) => (
              <span 
                key={index}
                className="splash-char"
                style={{ '--index': index }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 新增的导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-20">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" passHref>
              <a
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
                onClick={() => sessionStorage.setItem('fromInternal', 'true')}
              >
                Typace
              </a>
            </Link>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" passHref>
                  <a 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => sessionStorage.setItem('fromInternal', 'true')}
                  >
                    首页
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about" passHref>
                  <a 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => sessionStorage.setItem('fromInternal', 'true')}
                  >
                    关于
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/archive" passHref>
                  <a 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => sessionStorage.setItem('fromInternal', 'true')}
                  >
                    归档
                  </a>
                </Link>
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
            <li key={slug} className="bg-white rounded-lg shadow-lg p-6 transition transform hover:scale-105">
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
                  <a href={`/posts/${slug}`} className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800">
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
          <img src="https://cdn.us.mrche.top/sitemap.svg" alt="Sitemap" className="block mx-auto w-8 h-8" />
        </a>
        <p className="mt-4">
          由MRCHE&terryzhang创建的<a href="https://www.mrche.top/typace" className="text-blue-600 hover:underline">Typace</a>强势驱动
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
