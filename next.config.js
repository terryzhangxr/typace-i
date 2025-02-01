const withRSS = require('next-rss')({
  title: 'Your Blog Title',
  description: 'Your Blog Description',
  site_url: 'https://your-blog-url.com',
  feed_url: 'https://your-blog-url.com/rss.xml',
  output: 'public/rss.xml',
  getPosts: async () => {
    const posts = [
      {
        title: 'Post Title',
        description: 'Post Description',
        url: 'https://your-blog-url.com/post-url',
        date: '2025-01-31'
      }
    ];
    return posts;
  }
});

module.exports = withRSS({
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      }
    ];
  }
});
