import { getSortedPostsData } from '../lib/posts';

export default function Home({ allPostsData }) {
  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-20">
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
            </ul>
          </div>
        </div>
      </nav>

      {/* 文章列表 */}
      <main className="mt-24">
        <ul className="space-y-8">
          {allPostsData.map(({ slug, title, date, cover }) => (
            <li key={slug} className="bg-white rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105">
              <a href={`/posts/${slug}`} className="block">
                {/* 封面图片 */}
                {cover && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={cover}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* 文章内容 */}
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-indigo-600 hover:text-indigo-800">
                    {title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">{date}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </main>

      {/* 页脚 */}
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
