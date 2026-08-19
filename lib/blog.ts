export type BlogPostSummary = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  featured: boolean;
};

export const blogPosts: BlogPostSummary[] = [
  {
    slug: 'how-to-make-a-desktop-pet',
    title: 'How to Make a Desktop Pet on Your Computer (3 Ways)',
    description:
      'Learn three honest ways to make a desktop pet on Windows or Mac: create one with Codex, build a standalone app, or use DeskBub with your own pet photo.',
    excerpt:
      'Compare the Codex, do-it-yourself, and DeskBub routes—then choose the one that matches how much you want to build yourself.',
    category: 'Desktop Pet Guide',
    publishedAt: '2026-08-19',
    updatedAt: '2026-08-19',
    readingTime: '9 min read',
    featured: true,
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

