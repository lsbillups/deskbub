import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';
import { getBlogPost } from '@/lib/blog';

function requireBlogPost(slug: string) {
  const entry = getBlogPost(slug);
  if (!entry) throw new Error(`Blog post metadata is missing: ${slug}`);
  return entry;
}

const post = requireBlogPost('digital-ways-to-celebrate-your-dog');

export const metadata: Metadata = {
  title: '7 Digital Ways to Celebrate Your Dog on August 26',
  description: post.description,
  keywords: [
    'digital ideas for dog lovers',
    'ways to celebrate your dog',
    'August 26 dog ideas',
    'dog photo ideas',
    'digital dog keepsake',
    'animated dog photo',
    'dog desktop pet',
  ],
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `https://deskbub.com/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    images: [{ url: '/media/kaka/kaka.jpg', alt: 'Kaka, the dog behind the DeskBub desktop companion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
    images: ['/media/kaka/kaka.jpg'],
  },
};

const ideas = [
  {
    number: '01',
    title: 'Build a tiny “best of” photo archive',
    description:
      'Choose 12 photos that show your dog’s personality rather than simply picking the sharpest images. Add a one-line note to each: the place, the habit, or the expression you never want to forget.',
  },
  {
    number: '02',
    title: 'Make a then-and-now photo pair',
    description:
      'Put an early photo beside one from this year. Keep the layout simple and write down one thing that changed—and one thing that never did.',
  },
  {
    number: '03',
    title: 'Create a map of your favorite walks',
    description:
      'Mark a few meaningful routes or places, then attach one photo and one sentence to each. It becomes a memory map instead of another folder of unnamed pictures.',
  },
  {
    number: '04',
    title: 'Turn one real photo into a desktop companion',
    description:
      'A transparent animated version of your dog can sit above your everyday apps on Windows or Mac. It is a small way to keep a familiar face nearby when you are away from home.',
  },
  {
    number: '05',
    title: 'Make a digital card for someone who loves your dog',
    description:
      'Use a favorite photo, your dog’s name, and a line they would “say.” Send it to the sitter, foster, family member, or friend who has become part of your dog’s story.',
  },
  {
    number: '06',
    title: 'Use your screen to support a dog that needs a home',
    description:
      'With the organization’s permission, share an adoptable dog’s official listing rather than downloading and reposting its photo without context. Keep the original link and contact details attached.',
  },
  {
    number: '07',
    title: 'Start a yearly digital time capsule',
    description:
      'Save one portrait, one short video, one favorite sound, one new habit, and one ordinary day from this year. Add to the same folder every August so the collection grows with your dog.',
  },
];

export default function CelebrateYourDogArticle() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: 'https://deskbub.com/media/kaka/kaka.jpg',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'DeskBub', url: 'https://deskbub.com' },
    publisher: { '@type': 'Organization', name: 'DeskBub', url: 'https://deskbub.com' },
    mainEntityOfPage: `https://deskbub.com/blog/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deskbub.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deskbub.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://deskbub.com/blog/${post.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-cream pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />

      <article>
        <header className="relative overflow-hidden border-b border-gray-100 px-6 py-16 sm:py-24">
          <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-secondary">
              <Link href="/" className="hover:text-coral">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-coral">Blog</Link>
              <span aria-hidden="true">/</span>
              <span className="text-text-primary">August dog ideas</span>
            </nav>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className="rounded-full bg-coral/10 px-3 py-1.5 text-coral">{post.category}</span>
              <time dateTime={post.publishedAt} className="text-text-secondary">August 20, 2026</time>
              <span className="text-text-secondary">·</span>
              <span className="text-text-secondary">{post.readingTime}</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-text-primary sm:text-6xl">{post.title}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-relaxed text-text-secondary sm:text-2xl">
              Your camera roll already holds the raw material. The goal is to turn a few real moments into something you will still enjoy after the date has passed.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <section aria-labelledby="why-august-26" className="rounded-3xl border border-mint/20 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint-dark">Why August 26?</p>
            <h2 id="why-august-26" className="mt-3 font-display text-3xl font-bold text-text-primary">It is a day many people already use to celebrate dogs.</h2>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">
              National Dog Day is observed on August 26. Its official site describes the day as both a celebration of dogs of every kind and a way to draw attention to dogs that need to be rescued or adopted. You can read the event&apos;s own description on the <a href="https://www.nationaldogday.com/about1" target="_blank" rel="noreferrer" className="font-bold text-coral underline decoration-coral/25 underline-offset-4">official National Dog Day website</a>.
            </p>
            <p className="mt-4 leading-relaxed text-text-secondary">
              The ideas below are DeskBub&apos;s original suggestions. They do not copy the event&apos;s official celebration list, and none requires you to turn a personal day with your dog into a public post.
            </p>
          </section>

          <figure className="mt-10 grid overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-lg md:grid-cols-2">
            <div className="relative min-h-[350px] bg-[#efe8e1]">
              <Image src="/media/kaka/kaka.jpg" alt="A real photo of Kaka wearing a red harness" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[50%_35%]" />
              <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-text-primary shadow-lg">KAKA IN REAL LIFE</span>
            </div>
            <div className="relative min-h-[350px] overflow-hidden bg-gradient-to-br from-[#b8d8f8] to-[#f8d5c2]">
              <div className="absolute left-[8%] top-[12%] h-[68%] w-[76%] rounded-2xl border border-white/80 bg-white/90 shadow-xl">
                <div className="flex h-9 items-center gap-2 border-b border-gray-100 bg-[#f7f9fb] px-4">
                  <span className="h-2 w-2 rounded-full bg-coral" /><span className="h-2 w-2 rounded-full bg-[#ffd166]" /><span className="h-2 w-2 rounded-full bg-mint" />
                  <span className="ml-2 text-[9px] font-bold text-text-secondary">MY AUGUST NOTES</span>
                </div>
                <div className="space-y-4 p-5"><span className="block h-3 w-2/3 rounded-full bg-gray-100" /><span className="block h-3 w-full rounded-full bg-gray-100" /><span className="block h-3 w-4/5 rounded-full bg-gray-100" /></div>
              </div>
              <video src="/media/kaka/kaka-happy.webm" autoPlay loop muted playsInline className="absolute bottom-0 right-0 z-10 h-[69%] w-[56%] object-contain drop-shadow-[0_16px_20px_rgba(45,52,54,0.25)]" aria-label="Kaka animated as a desktop companion above an app window" />
              <span className="absolute bottom-5 left-5 z-20 rounded-full bg-text-primary/85 px-4 py-2 text-xs font-extrabold text-white shadow-lg">KAKA ON THE DESKTOP</span>
            </div>
            <figcaption className="p-5 text-sm font-semibold leading-relaxed text-text-secondary md:col-span-2">One real photo can become more than a post: Kaka&apos;s photo also became a small animated companion for Windows and Mac.</figcaption>
          </figure>

          <nav aria-label="Article contents" className="mt-10 rounded-3xl bg-text-primary p-7 text-white sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">Seven original ideas</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {ideas.map((idea) => (
                <li key={idea.number}><a href={`#idea-${idea.number}`} className="font-semibold text-white/85 hover:text-white">{Number(idea.number)}. {idea.title}</a></li>
              ))}
            </ol>
          </nav>

          <div className="space-y-14 pt-16">
            {ideas.map((idea) => (
              <section key={idea.number} id={`idea-${idea.number}`} className="scroll-mt-24">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-extrabold text-coral">IDEA {idea.number}</span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">{idea.title}</h2>
                <p className="mt-5 text-lg leading-relaxed text-text-secondary">{idea.description}</p>

                {idea.number === '01' && (
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="font-display text-lg font-bold text-text-primary">A useful selection rule</h3>
                    <p className="mt-2 leading-relaxed text-text-secondary">Pick three portraits, three ordinary moments, three places, and three photos that make you laugh. Twelve is small enough to finish and large enough to feel like a story.</p>
                  </div>
                )}

                {idea.number === '04' && (
                  <div className="mt-7 rounded-3xl border border-mint/20 bg-white p-7 shadow-sm sm:p-9">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint-dark">If you want to try the desktop idea</p>
                    <p className="mt-4 leading-relaxed text-text-secondary">
                      DeskBub turns one clear photo of your actual dog into transparent movements for its Windows or Mac desktop app. If you want to understand the build process first, read our <Link href="/blog/how-to-make-a-desktop-pet" className="font-bold text-coral underline decoration-coral/25 underline-offset-4">honest guide to making a desktop pet three different ways</Link>.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link href="/download" className="rounded-full bg-mint px-6 py-3 text-center font-bold text-white transition hover:bg-mint-dark">Try Kaka for Free</Link>
                      <Link href="/upload" className="rounded-full bg-coral px-6 py-3 text-center font-bold text-white transition hover:bg-coral-dark">Use My Own Dog Photo</Link>
                    </div>
                  </div>
                )}

                {idea.number === '06' && (
                  <p className="mt-5 rounded-2xl bg-mint/10 p-5 text-sm leading-relaxed text-text-secondary">
                    A useful share sends people to the rescue&apos;s current page, where adoption status and contact information can be kept up to date. Ask before reusing a photograph, even when the cause is good.
                  </p>
                )}
              </section>
            ))}
          </div>

          <section className="mt-16 rounded-3xl border border-gray-100 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Keep it personal</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text-primary">The best project is the one you will revisit.</h2>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">
              You do not need seven finished projects or a public campaign. Choose one idea, use your own photographs, and finish something small. A private folder you open again can matter more than a polished post that disappears tomorrow.
            </p>
          </section>

          <section className="mt-12 rounded-[2rem] bg-text-primary p-8 text-center text-white sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint">Meet the desktop companion first</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Kaka is included for free.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70">No account or payment required. Download DeskBub for Windows or Mac and see what a real desktop companion feels like before using your own photo.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/download" className="rounded-full bg-mint px-7 py-3.5 font-bold text-white transition hover:bg-mint-dark">Try Kaka for Free</Link>
              <Link href="/upload" className="rounded-full border border-white/20 px-7 py-3.5 font-bold text-white transition hover:bg-white/10">Use My Own Dog</Link>
            </div>
          </section>

          <aside className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Independence notice:</strong> DeskBub is not affiliated with, sponsored by, or endorsed by National Dog Day or its organizers. The event name is mentioned here only to identify the August 26 observance; the seven ideas and all DeskBub media on this page are original.
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}
