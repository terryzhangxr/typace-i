import { getSortedPostsData } from '../../lib/posts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export async function getStaticPaths() {
  const posts = getSortedPostsData();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return { paths, fallback: false };
}

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
    },
  };
}

export default function Post({ frontmatter, contentHtml }) {
  return (
    <div className="prose mx-auto p-4">
      <h1>{frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}
export default function Post({ frontmatter, contentHtml }) {
  return (
    <div className="page-transition">
      <article className="prose prose-invert mx-auto max-w-3xl px-4 py-20 dark:prose-dark">
        {/* 文章头图 */}
        <div className="relative mb-12 h-64 overflow-hidden rounded-3xl">
          <Image
            src={frontmatter.cover}
            alt={frontmatter.title}
            fill
            className="object-cover"
          />
        </div>

        {/* 标题区 */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-bold !leading-tight">
            {frontmatter.title}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <time className="text-secondary">{frontmatter.date}</time>
            <span className="h-1 w-1 rounded-full bg-secondary" />
            <span>{frontmatter.readingTime} 分钟阅读</span>
          </div>
        </header>

        {/* 正文内容 */}
        <div 
          className="article-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* 推荐文章 */}
        <section className="mt-20 border-t border-white/10 pt-12">
          <h2 className="mb-8 text-2xl font-bold">相关推荐</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 推荐文章卡片 */}
          </div>
        </section>
      </article>
    </div>
  )
}
