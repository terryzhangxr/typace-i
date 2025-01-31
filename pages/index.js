import { getSortedPostsData } from '../lib/posts';

export default function Home({ allPostsData }) {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-center text-gray-800">
        MRCHE
      </h1>
      <ul>
        {allPostsData.map(({ slug, title, date }) => (
          <li key={slug} className="my-4">
            <a href={`/posts/${slug}`} className="text-blue-500 hover:underline">
              {title}
            </a>
            <br />
            <span className="text-sm text-gray-600">{date}</span>
          </li>
        ))}
      </ul>
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
export default function Home({ allPostsData }) {
  return (
    <div className="page-transition">
      {/* 导航栏 */}
      <nav className="glass-effect fixed top-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Typace I</h1>
          <button className="rounded-full p-2 hover:bg-white/10">
            <svg className="h-6 w-6">...</svg>
          </button>
        </div>
      </nav>

      {/* 文章列表 */}
      <main className="mx-auto mt-20 max-w-4xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {allPostsData.map((post) => (
            <article 
              key={post.slug}
              className="glass-effect group rounded-3xl p-6 hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-80" />
                <div>
                  <h2 className="text-xl font-semibold text-primary">
                    {post.title}
                  </h2>
                  <time className="text-sm text-secondary">{post.date}</time>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-text-secondary">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
