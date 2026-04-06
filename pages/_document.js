import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh">
      <Head>
        {/* Favicon 保持不变 */}
        <link rel="icon" href="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" />

        {/* --- 核心修复：防止暗色模式闪屏的 Inline Script --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var dark = localStorage.getItem('darkMode');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  
                  // 判断逻辑：如果手动设为'true'，或者未设置但系统偏好是 dark
                  if (dark === 'true' || (dark === null && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#000000';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.backgroundColor = '#fafafa';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* ------------------------------------------ */}
      </Head>
      
      {/* 通过 transition-colors duration-0 确保初始加载时背景变色不会产生渐变感
        bg-[#fafafa] 和 dark:bg-black 必须与主页背景色严格一致
      */}
      <body className="bg-[#fafafa] dark:bg-black transition-colors duration-0">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
