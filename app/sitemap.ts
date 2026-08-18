import type { MetadataRoute } from 'next';

const baseUrl = 'https://deskbub.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/free-desktop-pet', changeFrequency: 'weekly' as const, priority: 0.95 },
    { path: '/custom-desktop-pet', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/download', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.85 },
    { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/refund', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
