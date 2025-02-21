import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

export default async (req, res) => {
  const links = [
    { url: '/', changefreq: 'daily', priority: 0.3 },
    // Add other pages
  ];

  const stream = new SitemapStream({ hostname: 'https://typace.mrzxr.com' });
  const xml = await streamToPromise(Readable.from(links).pipe(stream)).then((data) => data.toString());

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();
};
