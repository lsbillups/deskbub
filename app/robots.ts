import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/upload', '/sign-in', '/sign-up'],
    },
    sitemap: 'https://deskbub.com/sitemap.xml',
  };
}
