import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';
import { blogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Desktop Pet Guides',
  description:
    'Practical DeskBub guides for making a desktop pet, animating a real pet photo, and choosing the right Windows or Mac setup.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Desktop Pet Guides | DeskBub',
    description: 'Honest, practical guides for putting a real pet on your computer desktop.',
    url: 'https://deskbub.com/blog',
    type: 'website',
  },
};

export default function BlogPage() {
  const featuredPost = blogPosts.find((post) => post.featured) ?? blogPosts[0];
  const otherPosts = blogPosts.filter((post) => post.slug !== featuredPost.slug);
  const comingSoon = [
    { title: 'How to Turn a Pet Photo into an Animated Desktop Pet', category: 'Photo to Animation' },
    { title: 'Desktop Pets for Windows and Mac: What Actually Works?', category: 'Platform Guide' },
    { title: 'How to Choose the Best Photo for a Custom Desktop Pet', category: 'Photo Guide' },
  ];

  return (
    <main className="min-h-screen bg-cream pt-16">
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <div className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-coral/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">DeskBub Guides</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-tight text-text-primary sm:text-6xl">
              Make your desktop feel a little more personal.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-text-secondary">
              Honest guides to creating desktop pets, working with real pet photos, and choosing between building it yourself or letting DeskBub handle the hard parts.
            </p>
          </div>

          <article className="mt-14 grid overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl shadow-text-primary/5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <span className="rounded-full bg-coral/10 px-3 py-1.5 text-coral">{featuredPost.category}</span>
                <span className="text-text-secondary">{featuredPost.readingTime}</span>
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                <Link href={`/blog/${featuredPost.slug}`} className="transition hover:text-coral">
                  {featuredPost.title}
                </Link>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-secondary">{featuredPost.excerpt}</p>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-text-primary px-6 py-3 font-bold text-white transition hover:bg-coral"
              >
                Read the guide <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="relative min-h-[380px] overflow-hidden bg-gradient-to-br from-[#b8d8f8] via-[#dce8f2] to-[#f8d5c2] lg:min-h-[500px]">
              <div className="absolute left-[9%] top-[15%] h-[57%] w-[72%] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-xl">
                <div className="flex h-10 items-center gap-2 border-b border-gray-100 bg-[#f7f9fb] px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                  <span className="ml-2 text-[10px] font-bold text-text-secondary">YOUR COMPUTER</span>
                </div>
                <div className="space-y-4 p-5">
                  <span className="block h-3 w-2/3 rounded-full bg-gray-100" />
                  <span className="block h-3 w-full rounded-full bg-gray-100" />
                  <span className="block h-3 w-4/5 rounded-full bg-gray-100" />
                  <div className="grid grid-cols-3 gap-3 pt-3">
                    <span className="h-16 rounded-lg bg-mint/15" />
                    <span className="h-16 rounded-lg bg-coral/10" />
                    <span className="h-16 rounded-lg bg-[#dbeafe]" />
                  </div>
                </div>
              </div>
              <video
                src="/media/kaka/kaka-curious.webm"
                autoPlay
                loop
                muted
                playsInline
                className="absolute bottom-7 right-0 z-10 h-[65%] w-[52%] object-contain drop-shadow-[0_16px_20px_rgba(45,52,54,0.25)]"
                aria-label="Kaka floating over an application as a desktop pet"
              />
              <div className="absolute bottom-5 left-5 z-20 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-text-primary shadow-lg backdrop-blur">
                BUILT, GENERATED, OR READY-MADE?
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-mint-dark">Coming next</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-text-primary">More practical guides are on the way.</h2>
            </div>
            <p className="max-w-md text-text-secondary">More photo, animation, Windows, and Mac guides are coming as we test each process ourselves.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherPosts.length > 0
              ? otherPosts.map((post) => (
                  <article key={post.slug} className="flex flex-col rounded-3xl border border-gray-100 bg-cream p-7 shadow-sm">
                    <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.12em]">
                      <span className="text-coral">{post.category}</span>
                      <span className="text-text-secondary/70">{post.readingTime}</span>
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold leading-snug text-text-primary">
                      <Link href={`/blog/${post.slug}`} className="transition hover:text-coral">{post.title}</Link>
                    </h3>
                    <p className="mt-4 flex-1 leading-relaxed text-text-secondary">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="mt-6 font-bold text-coral underline decoration-coral/25 underline-offset-4 hover:decoration-coral">Read this guide →</Link>
                  </article>
                ))
              : comingSoon.map((item) => (
                  <article key={item.title} className="rounded-3xl border border-gray-100 bg-cream p-7 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{item.category}</span>
                    <h3 className="mt-5 font-display text-xl font-bold leading-snug text-text-primary">{item.title}</h3>
                    <span className="mt-6 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-text-secondary">Coming soon</span>
                  </article>
                ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
