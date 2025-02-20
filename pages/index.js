import { useEffect } from 'react';
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
  `;
  document.head.appendChild(style);
};

export default function Home({ allPostsData }) {
  useEffect(() => {
    addDynamicStyles();

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
  }, []);

  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* 保持原有内容不变 */}
      <header className="text-center mb-8">
        <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Typace
        </h1>
      </header>
      <main>
        <ul className="space-y-6">
          {allPostsData.map(({ slug, title, date }) => (
            <li key={slug} className="bg-white rounded-lg shadow-lg p-6 transition transform hover:scale-105">
              <a href={`/posts/${slug}`} className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800">
                {title}
              </a>
              <p className="text-sm text-gray-600 mt-2">{date}</p>
            </li>
          ))}
        </ul>
      </main>
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
      allPostsData,
    },
  };
}
