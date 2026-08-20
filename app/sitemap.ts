import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog';

const baseUrl = 'https://deskbub.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', lastModified: '2026-08-18', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/free-desktop-pet', lastModified: '2026-08-18', changeFrequency: 'weekly' as const, priority: 0.95 },
    { path: '/custom-desktop-pet', lastModified: '2026-08-18', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/download', lastModified: '2026-08-18', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/pricing', lastModified: '2026-08-18', changeFrequency: 'monthly' as const, priority: 0.85 },
    { path: '/contact', lastModified: '2026-07-15', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/privacy', lastModified: '2026-08-18', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', lastModified: '2026-07-16', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/refund', lastModified: '2026-07-15', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  const staticPages: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(`${page.lastModified}T00:00:00.000Z`),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(Math.max(...blogPosts.map((post) => new Date(post.updatedAt).getTime()))),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];

  return [...staticPages, ...blogPages];
}
