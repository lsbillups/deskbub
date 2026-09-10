import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/landing/Footer';
import { blogPosts } from '@/lib/blog';
import { getSeoGuide, seoGuides, type SeoGuide } from '@/lib/seo-guides';

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }));
}

const guideVisuals: Record<
  SeoGuide['visual'],
  {
    motion: string;
    label: string;
    headline: string;
    detail: string;
    quickLabel: string;
    quickHeading: string;
    ariaLabel: string;
    accentClass: string;
    petClass: string;
  }
> = {
  photo: {
    motion: '/media/kaka/kaka-happy.webm',
    label: 'ONE REAL PHOTO',
    headline: 'From pet photo to desktop companion',
    detail: 'Likeness first. Motion second.',
    quickLabel: 'WHAT YOU NEED',
    quickHeading: 'Start with one clear photo that shows what makes your pet recognizable.',
    ariaLabel: 'Kaka happily moving as an example of a real dog turned into a desktop pet',
    accentClass: 'bg-coral',
    petClass: 'bottom-[-4%] right-[-12%] h-[66%] w-[62%]',
  },
  free: {
    motion: '/media/kaka/kaka-curious.webm',
    label: 'FREE KAKA',
    headline: 'Meet a real-dog desktop pet',
    detail: 'No account. No payment.',
    quickLabel: 'CHOOSING A FREE PET',
    quickHeading: 'The best free desktop pet depends on the kind of companion you want.',
    ariaLabel: 'Kaka, the free DeskBub desktop pet, looking around on screen',
    accentClass: 'bg-mint',
    petClass: 'bottom-0 right-[2%] h-[74%] w-[68%]',
  },
  mac: {
    motion: '/media/kaka/kaka-relaxed.webm',
    label: 'KAKA ON MAC',
    headline: 'A quiet companion above your apps',
    detail: 'For macOS 12 or later.',
    quickLabel: 'MAC SETUP',
    quickHeading: 'You can add a desktop pet to your Mac in just a few steps.',
    ariaLabel: 'Kaka resting above a simulated macOS desktop',
    accentClass: 'bg-[#9fc5eb]',
    petClass: 'bottom-[-3%] left-[28%] h-[68%] w-[68%]',
  },
  windows: {
    motion: '/media/kaka/kaka-happy.webm',
    label: 'KAKA ON WINDOWS',
    headline: 'Always visible. Never in the way.',
    detail: 'For Windows 10 and 11.',
    quickLabel: 'WINDOWS SETUP',
    quickHeading: 'Getting a desktop pet on Windows 11 only takes a few steps.',
    ariaLabel: 'Kaka moving happily above a simulated Windows desktop',
    accentClass: 'bg-[#77d8c4]',
    petClass: 'bottom-[-4%] right-[-12%] h-[66%] w-[62%]',
  },
  safety: {
    motion: '/media/kaka/kaka-relaxed.webm',
    label: 'SAFE DOWNLOAD CHECK',
    headline: 'Know what you are installing',
    detail: 'Source · permissions · privacy',
    quickLabel: 'IS IT SAFE?',
    quickHeading: 'Desktop pets can be safe when they come from a trusted source and request reasonable permissions.',
    ariaLabel: 'Kaka resting beside a desktop pet download safety checklist',
    accentClass: 'bg-[#ffd166]',
    petClass: 'bottom-[-4%] right-[-1%] h-[66%] w-[65%]',
  },
  compare: {
    motion: '/media/kaka/kaka-curious.webm',
    label: 'YOUR PET, NOT A PACK',
    headline: 'Character mascot or recognizable pet?',
    detail: 'Choose the result you actually want.',
    quickLabel: 'WHICH ONE FITS YOU?',
    quickHeading: 'Choose Shimeji for fictional characters and DeskBub for a pet made from your own photo.',
    ariaLabel: 'Kaka, a recognizable real-dog desktop pet, looking around on screen',
    accentClass: 'bg-coral',
    petClass: 'bottom-0 right-[1%] h-[74%] w-[68%]',
  },
  kaka: {
    motion: '/media/kaka/kaka-happy.webm',
    label: 'THE REAL KAKA',
    headline: 'A real dog became DeskBub’s first pet',
    detail: 'Photo · likeness · transparent motion',
    quickLabel: 'KAKA IN ONE MINUTE',
    quickHeading: 'A real photo set the standard for DeskBub’s first pet.',
    ariaLabel: 'Kaka happily moving as DeskBub’s first real-dog desktop pet',
    accentClass: 'bg-coral',
    petClass: 'bottom-0 right-[-2%] h-[72%] w-[70%]',
  },
  cat: {
    motion: '/media/kaka/kaka-curious.webm',
    label: 'PHOTO-BASED PET',
    headline: 'Start with an animal you recognize',
    detail: 'Clear markings · clean outline · motion',
    quickLabel: 'CAT PHOTO CHECK',
    quickHeading: 'Recognition starts with the markings that make your cat yours.',
    ariaLabel: 'Kaka demonstrating the photo-based DeskBub desktop pet experience',
    accentClass: 'bg-mint',
    petClass: 'bottom-0 right-[2%] h-[74%] w-[68%]',
  },
};

function formatPublicationDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (!guide) return {};

  const url = `https://deskbub.com/blog/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `/blog/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      images: [{ url: '/media/kaka/kaka.jpg', alt: guideVisuals[guide.visual].ariaLabel }],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
      images: ['/media/kaka/kaka.jpg'],
    },
  };
}

function GuideVisual({ guide }: { guide: SeoGuide }) {
  const visual = guideVisuals[guide.visual];

  return (
    <figure className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#253034] shadow-2xl">
      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-black/10 px-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-coral" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
          <span className="h-2.5 w-2.5 rounded-full bg-mint" />
        </span>
        <span>DeskBub desktop</span>
      </div>

      <div className="absolute left-[7%] top-[18%] h-[52%] w-[67%] overflow-hidden rounded-2xl border border-white/70 bg-[#f7f3eb] shadow-2xl">
        <div className="flex h-9 items-center gap-2 border-b border-black/5 bg-white px-4">
          <span className={`h-2.5 w-16 rounded-full ${visual.accentClass}`} />
          <span className="h-2.5 w-10 rounded-full bg-black/10" />
        </div>
        <div className="p-5">
          <p className="max-w-[72%] font-display text-xl font-extrabold leading-tight text-text-primary sm:text-2xl">
            {visual.headline}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">
            {visual.detail}
          </p>
          <div className="mt-5 flex gap-2" aria-hidden="true">
            <span className={`h-2 w-24 rounded-full ${visual.accentClass}`} />
            <span className="h-2 w-14 rounded-full bg-black/10" />
          </div>
        </div>
      </div>

      <div className="absolute right-[5%] top-[27%] h-[36%] w-[28%] rotate-3 rounded-2xl border border-white/70 bg-[#9fc5eb] shadow-xl" aria-hidden="true">
        <div className="m-3 h-2 w-12 rounded-full bg-white/75" />
        <div className="mx-3 mt-4 h-16 rounded-xl bg-white/35" />
      </div>

      <video
        src={visual.motion}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`absolute z-10 object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.35)] ${visual.petClass}`}
        aria-label={visual.ariaLabel}
      >
        Your browser does not support the Kaka animation.
      </video>

      <figcaption className="absolute bottom-5 left-5 z-20 rounded-full bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-text-primary shadow-lg sm:text-xs">
        {visual.label}
      </figcaption>
    </figure>
  );
}

export default async function SeoGuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (!guide) notFound();

  const articleUrl = `https://deskbub.com/blog/${guide.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: guide.title,
    description: guide.description,
    image: 'https://deskbub.com/media/kaka/kaka.jpg',
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { '@type': 'Organization', name: 'DeskBub', url: 'https://deskbub.com' },
    publisher: { '@type': 'Organization', name: 'DeskBub', url: 'https://deskbub.com' },
    mainEntityOfPage: articleUrl,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deskbub.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deskbub.com/blog' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: articleUrl },
    ],
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
  const relatedPosts = guide.related
    .map((relatedSlug) => blogPosts.find((post) => post.slug === relatedSlug))
    .filter((post): post is NonNullable<typeof post> => Boolean(post));

  return (
    <main className="min-h-screen bg-cream pt-16">
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
      ))}

      <article>
        <header className="relative overflow-hidden border-b border-gray-100 px-6 py-16 sm:py-24">
          <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-secondary">
                <Link href="/" className="hover:text-coral">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/blog" className="hover:text-coral">Blog</Link>
                <span aria-hidden="true">/</span>
                <span className="text-text-primary">{guide.category}</span>
              </nav>
              <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.18em] text-coral">{guide.eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-text-primary sm:text-6xl">{guide.title}</h1>
              <p className="mt-7 max-w-3xl text-xl leading-relaxed text-text-secondary">{guide.intro}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-semibold text-text-secondary">
                <time dateTime={guide.publishedAt}>{formatPublicationDate(guide.publishedAt)}</time>
                <span aria-hidden="true">·</span>
                <span>{guide.readingTime}</span>
                <span aria-hidden="true">·</span>
                <span>By DeskBub</span>
              </div>
            </div>
            <GuideVisual guide={guide} />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <section aria-labelledby="quick-answer" className="rounded-3xl border border-mint/20 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint-dark">{guideVisuals[guide.visual].quickLabel}</p>
            <h2 id="quick-answer" className="mt-3 font-display text-3xl font-bold text-text-primary">{guideVisuals[guide.visual].quickHeading}</h2>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">{guide.quickAnswer}</p>
          </section>

          <nav aria-label="Article contents" className="mt-10 rounded-3xl bg-text-primary p-7 text-white sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">In this guide</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {guide.sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="font-semibold text-white/85 hover:text-white">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 pt-16">
              <h2 className="font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">{section.title}</h2>
              <div className="mt-6 space-y-5">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-relaxed text-text-secondary">{paragraph}</p>
                ))}
              </div>

              {section.bullets && (
                <ul className="mt-7 space-y-3 rounded-3xl border border-gray-100 bg-white p-7">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 leading-relaxed text-text-secondary">
                      <span className="font-extrabold text-mint-dark">✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.steps && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {section.steps.map((step, index) => (
                    <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-coral">Step {index + 1}</span>
                      <h3 className="mt-3 font-display text-xl font-bold text-text-primary">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-text-secondary">{step.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.table && (
                <div className="mt-8 overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-text-primary text-white">
                      <tr>
                        {section.table.headers.map((header) => (
                          <th key={header} scope="col" className="px-5 py-4 text-sm font-bold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join('|')} className="border-t border-gray-100 align-top">
                          {row.map((cell, index) => (
                            <td key={cell} className={`px-5 py-4 leading-relaxed ${index === 0 ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.note && (
                <aside className="mt-8 rounded-3xl border-l-4 border-coral bg-coral/5 p-6 text-lg font-semibold leading-relaxed text-text-primary">
                  {section.note}
                </aside>
              )}
            </section>
          ))}

          {guide.slug === 'best-free-desktop-pets' && (
            <aside className="mt-16 rounded-3xl border border-gray-100 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="font-display text-2xl font-bold text-text-primary">Official product pages checked</h2>
              <p className="mt-3 leading-relaxed text-text-secondary">Product details were checked on September 9, 2026. Use the official source to confirm current pricing and platform support.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  ['Desktop Pets on Microsoft Store', 'https://apps.microsoft.com/detail/9pbm91h6xcxp?hl=en-US&gl=US'],
                  ['OpenPets', 'https://openpets.dev/'],
                  ['DeskBub downloads', '/download'],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="rounded-full bg-cream px-4 py-2 text-sm font-bold text-text-primary underline decoration-gray-200 underline-offset-4 hover:text-coral">
                    {label}
                  </a>
                ))}
              </div>
            </aside>
          )}

          <section className="mt-16 rounded-[2rem] bg-text-primary p-8 text-white sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Two clear paths</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Try a free desktop pet—or make one from your pet photo.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
              Kaka is free with no account or payment. Custom pets start at $1 as a one-time purchase.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/free-desktop-pet" className="rounded-full bg-mint px-6 py-3 text-center font-bold text-text-primary hover:bg-white">Download Kaka Free</Link>
              <Link href="/custom-desktop-pet" className="rounded-full bg-coral px-6 py-3 text-center font-bold text-white hover:bg-coral-dark">Create My Pet From a Photo</Link>
            </div>
          </section>

          <section className="pt-16">
            <h2 className="font-display text-3xl font-bold text-text-primary">Frequently asked questions</h2>
            <div className="mt-7 space-y-4">
              {guide.faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-gray-100 bg-white px-6 py-5">
                  <summary className="cursor-pointer font-bold text-text-primary">{faq.question}</summary>
                  <p className="mt-3 leading-relaxed text-text-secondary">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {relatedPosts.length > 0 && (
            <section className="pt-16">
              <h2 className="font-display text-3xl font-bold text-text-primary">Keep reading</h2>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-coral/30">
                    <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">{post.category}</span>
                    <h3 className="mt-3 font-display text-lg font-bold leading-snug text-text-primary">{post.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
      <Footer />
    </main>
  );
}
