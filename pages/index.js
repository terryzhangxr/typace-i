import { useEffect } from 'react';
import { getSortedPostsData } from '../lib/posts';

export default function Home({ allPostsData }) {
  useEffect(() => {
    const colors = ['#ee7752', '#e73c7e', '#23a6d5', '#23d5ab'];
    let currentColorIndex = 0;

    const changeBackgroundColor = () => {
      document.body.style.backgroundColor = colors[currentColorIndex];
      currentColorIndex = (currentColorIndex + 1) % colors.length;
    };

    const intervalId = setInterval(changeBackgroundColor, 3000); // Change color every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-200 to-gray-400 p-8">
      <header className="text-center mb-8">
        <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          MRCHE
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
          由MRCHE创建的<a href="https://www.mrche.top/typace" className="text-blue-600 hover:underline">Typace</a>强势驱动
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
