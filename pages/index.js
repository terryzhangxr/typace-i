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
      <div className="text-center mt-8">
        <a href="/rss.xml">
          <img src="/rss-icon.png" alt="RSS Feed" style={{ display: 'inline-block' }} />
        </a>
      </div>
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
