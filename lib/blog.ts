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
    featured: false,
  },
  {
    slug: 'digital-ways-to-celebrate-your-dog',
    title: '7 Digital Ways to Celebrate Your Dog on August 26',
    description:
      'Seven original ways to celebrate your dog digitally on August 26, from a private photo archive and digital time capsule to a desktop companion made from one real photo.',
    excerpt:
      'Turn the photos already on your phone into something you will keep: a small archive, a memory map, a desktop companion, or a gift for someone who loves your dog too.',
    category: 'Seasonal Pet Ideas',
    publishedAt: '2026-08-20',
    updatedAt: '2026-08-20',
    readingTime: '7 min read',
    featured: true,
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
