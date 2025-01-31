const withRSS = require('next-rss')({
  // RSS options
  title: 'Your Blog Title',
  description: 'Your Blog Description',
  site_url: 'https://your-blog-url.com',
  feed_url: 'https://your-blog-url.com/rss.xml',
  output: 'public/rss.xml',
  // Function to get posts data
  getPosts: async () => {
    // Fetch or read your posts data
    return [
      {
        title: 'Post Title',
        description: 'Post Description',
        url: 'https://your-blog-url.com/post-url',
        date: '2025-01-31'
      }
    ];
  }
});

module.exports = withRSS({
  // Other Next.js config options
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      }
    ];
  }
});
