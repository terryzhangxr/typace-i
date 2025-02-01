const withRSS = require('next-rss')({
  // RSS options
  title: 'MRCHE',
  description: 'Your Blog Description',
  site_url: 'https://mrche.rrdd.top',
  feed_url: 'https://mrche.rrdd.top/rss.xml',
  output: 'public/rss.xml',
  // Function to get posts data
  getPosts: async () => {
    // Fetch or read your posts data
    return [
      {
        title: 'Post Title',
        description: 'Post Description',
        url: 'https://mrche.rrdd.top/post-url',
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
