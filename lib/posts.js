import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 获取所有文章的数据
const postsDirectory = path.join(process.cwd(), 'source');

export function getSortedPostsData() {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug: fileName.replace(/\.md$/, ''),
      ...data,
    };
  });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 获取文章内容
export function getPostData(slug) {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    ...data,
  };
}

// 获取所有文章的路径
export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => ({
    params: {
      slug: fileName.replace(/\.md$/, ''),
    },
  }));
}

// 文章页组件
export default function Post({ postData }) {
  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* 新增的导航栏 */}
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

      {/* 文章内容 */}
      <main className="mt-24">
        <article className="prose max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
          <p className="text-sm text-gray-600 mb-8">{postData.date}</p>
          <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        </article>
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

// 获取静态路径
export async function getStaticPaths() {
  const paths = getAllPostSlugs();
  return {
    paths,
    fallback: false,
  };
}

// 获取静态属性
export async function getStaticProps({ params }) {
  const postData = getPostData(params.slug);
  return {
    props: {
      postData,
    },
  };
}
