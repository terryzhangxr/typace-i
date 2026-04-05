import Document, { Html, Head, Main, NextScript } from 'next/document';
// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh">
      <Head>
        {/* 关键：注入阻塞式脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var dark = localStorage.getItem('darkMode');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
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
      </Head>
      <body className="bg-[#fafafa] dark:bg-black transition-colors duration-0">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* 添加 favicon */}
          <link rel="icon" href="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" />
          <title>theme typace</title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
