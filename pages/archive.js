import Link from 'next/link';
import { getSortedPostsData } from '../lib/posts';

export default function ArchivePage({ postsByYear }) {
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

      {/* 归档页面内容 */}
      <main className="mt-24">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-8">
          归档
        </h1>
        <div className="space-y-8">
          {Object.keys(postsByYear).map(year => (
            <div key={year} className="archive-year">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{year}</h2>
              <ul className="space-y-4">
                {postsByYear[year].map(({ slug, title, date }) => (
                  <li key={slug} className="archive-post bg-white rounded-lg shadow-lg p-6 transition transform hover:scale-105">
                    <Link href={`/posts/${slug}`}>
                      <a className="text-xl font-semibold text-indigo-600 hover:text-indigo-800">
                        {title}
                      </a>
                    </Link>
                    <p className="text-sm text-gray-600 mt-2">{date}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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

  // 按年份分类文章
  const postsByYear = allPostsData.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(post);
    return acc;
  }, {});

  return {
    props: {
      postsByYear,
    },
  };
}
