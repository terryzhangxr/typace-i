import Head from 'next/head';

export default function Home() {
  return (
    <div>
      {/* 动态设置标题和描述 */}
      <Head>
        <title>Typace - 首页</title>
        <meta name="description" content="欢迎访问 Typace 首页，了解更多本博客主题的内容。" />
      </Head>
      {/* 页面内容 */}
      <h1>欢迎来到 Typace</h1>
      <p>这是一个基于next.js开发的博客主题，致力于分享生活和技术。</p>
    </div>
  );
}
