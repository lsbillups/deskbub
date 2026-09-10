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

const allBlogPosts: BlogPostSummary[] = [
  {
    slug: 'how-to-turn-a-pet-photo-into-a-desktop-pet',
    title: 'How to Turn a Pet Photo Into a Desktop Pet',
    description:
      'Learn how a clear photo of your dog, cat, rabbit, bird, or other pet becomes a recognizable animated desktop companion for Windows or Mac.',
    excerpt:
      'See the complete photo-to-desktop workflow, what makes a useful source photo, what the finished pet can do, and where realistic expectations matter.',
    category: 'Photo to Desktop Pet',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '8 min read',
    featured: true,
  },
  {
    slug: 'best-free-desktop-pets',
    title: 'Best Free Desktop Pets for Windows and Mac',
    description:
      'Compare free desktop pet options for Windows and Mac, including ready-made pets, open-source libraries, AI companions, and a real-dog pet you can try free.',
    excerpt:
      'A transparent comparison of free desktop pets by platform, setup, customization, privacy, and whether you want a generic character or your own pet.',
    category: 'Free Desktop Pets',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '9 min read',
    featured: false,
  },
  {
    slug: 'how-to-get-a-desktop-pet-on-mac',
    title: 'How to Get a Desktop Pet on Mac or MacBook',
    description:
      'A practical guide to downloading, installing, showing, hiding, and removing a desktop pet on macOS, with free and custom-pet options.',
    excerpt:
      'Choose a Mac desktop pet, install it safely, handle macOS security prompts, and decide whether you want a free character or your own pet from a photo.',
    category: 'Mac Guide',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '7 min read',
    featured: false,
  },
  {
    slug: 'how-to-get-a-desktop-pet-on-windows-11',
    title: 'How to Get a Desktop Pet on Windows 11',
    description:
      'Download and install a desktop pet on Windows 11 or Windows 10, understand SmartScreen prompts, and choose between free and custom pets.',
    excerpt:
      'A Windows-focused installation and safety guide for putting a free desktop pet—or one made from your own pet photo—above your apps.',
    category: 'Windows Guide',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '7 min read',
    featured: false,
  },
  {
    slug: 'are-desktop-pets-safe',
    title: 'Are Desktop Pets Safe? What to Check Before You Download',
    description:
      'Learn how to judge whether a desktop pet is safe by checking its source, permissions, privacy policy, resource use, and uninstall path.',
    excerpt:
      'Desktop pets are software, so safety depends on where they come from and what they can access. Use this checklist before installing one.',
    category: 'Safety Guide',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '8 min read',
    featured: false,
  },
  {
    slug: 'shimeji-vs-desktop-pet',
    title: 'Shimeji vs Desktop Pet: Which One Should You Choose?',
    description:
      'Compare Shimeji character mascots with desktop pet apps, open-source pet libraries, and custom desktop pets made from a real pet photo.',
    excerpt:
      'Shimeji is great for downloadable characters. A photo-based desktop pet serves a different goal: keeping your own recognizable pet on screen.',
    category: 'Comparison',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '8 min read',
    featured: false,
  },
  {
    slug: 'how-we-turned-kaka-into-a-desktop-pet',
    title: 'How We Turned Kaka Into a Desktop Pet',
    description:
      'See how a real photo of Kaka became a free animated dog that floats above Windows and Mac apps, plus what we learned about recognizable pet details.',
    excerpt:
      'The real dog, the source photo, the animated result, and the product decisions that made Kaka DeskBub’s free desktop pet.',
    category: 'Kaka Case Study',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '6 min read',
    featured: false,
  },
  {
    slug: 'how-to-make-a-cat-desktop-pet-from-a-photo',
    title: 'How to Make a Cat Desktop Pet From a Photo',
    description:
      'Choose a useful cat photo, preserve recognizable markings, generate movement, and put a custom cat desktop pet on Windows or Mac.',
    excerpt:
      'A cat-specific photo and workflow guide for creating a recognizable desktop companion without drawing animation frames yourself.',
    category: 'Cat Desktop Pet',
    publishedAt: '2026-09-09',
    updatedAt: '2026-09-09',
    readingTime: '7 min read',
    featured: false,
  },
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
    featured: false,
  },
];

const unpublishedBlogPostSlugs = new Set([
  'how-we-turned-kaka-into-a-desktop-pet',
  'how-to-make-a-cat-desktop-pet-from-a-photo',
]);

export const blogPosts = allBlogPosts.filter((post) => !unpublishedBlogPostSlugs.has(post.slug));

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
