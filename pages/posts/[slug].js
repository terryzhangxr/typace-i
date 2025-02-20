import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { useEffect } from 'react'; // 引入 useEffect

// 获取所有文章的路径
export async function getStaticPaths() {
  const posts = getSortedPostsData();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return { paths, fallback: false };
}

// 获取文章内容
export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'source', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontmatter: data,
      contentHtml,
      slug: params.slug, // 将 slug 传递给组件
    },
  };
}

// 文章页组件
export default function Post({ frontmatter, contentHtml, slug }) {
  // 动态加载 Waline
  useEffect(() => {
    import('@waline/client').then(({ init }) => {
      init({
        el: '#waline-comments', // 绑定评论容器
        serverURL: 'https://your-waline-server-url', // 替换为你的 Waline 服务地址
        path: slug, // 使用文章 slug 作为评论路径
        dark: 'auto', // 自动切换暗黑模式
        locale: {
          placeholder: '欢迎留言讨论~', // 自定义输入框占位符
        },
      });
    });
  }, [slug]);

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
          <h1 className="text-4xl font-bold mb-4">{frontmatter.title}</h1>
          <p className="text-sm text-gray-600 mb-8">{frontmatter.date}</p>
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>

        {/* Waline 评论系统 */}
        <div id="waline-comments" className="mt-16 max-w-4xl mx-auto"></div>
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
