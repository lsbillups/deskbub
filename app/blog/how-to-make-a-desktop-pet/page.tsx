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

const post = requireBlogPost('how-to-make-a-desktop-pet');

export const metadata: Metadata = {
  title: 'How to Make a Desktop Pet on Windows or Mac',
  description: post.description,
  keywords: [
    'how to make a desktop pet',
    'how to make your own desktop pet',
    'custom desktop pet',
    'desktop pet from photo',
    'Codex pet',
    'desktop pet for Windows',
    'desktop pet for Mac',
  ],
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `https://deskbub.com/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    images: [{ url: '/media/kaka/kaka.jpg', alt: 'Kaka, the real dog behind the DeskBub desktop pet' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
    images: ['/media/kaka/kaka.jpg'],
  },
};

const methods = [
  {
    number: '01',
    title: 'Create a pet with Codex',
    bestFor: 'People who already use ChatGPT and enjoy guiding an AI workflow.',
    effort: 'Low to medium',
    result: 'A custom pet for supported ChatGPT interfaces.',
    accent: 'bg-mint/15 text-mint-dark',
  },
  {
    number: '02',
    title: 'Build a standalone desktop pet',
    bestFor: 'Developers who want complete control over behavior and packaging.',
    effort: 'High',
    result: 'Your own independent desktop application.',
    accent: 'bg-[#dbeafe] text-[#315f8f]',
  },
  {
    number: '03',
    title: 'Use DeskBub',
    bestFor: 'Pet owners who want the finished result without managing the production workflow.',
    effort: 'Low',
    result: 'Your real pet as a Windows or Mac desktop companion.',
    accent: 'bg-coral/10 text-coral',
  },
];

export default function MakeDesktopPetArticle() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

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
              <span className="text-text-primary">Desktop pet guide</span>
            </nav>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className="rounded-full bg-coral/10 px-3 py-1.5 text-coral">{post.category}</span>
              <time dateTime={post.publishedAt} className="text-text-secondary">August 19, 2026</time>
              <span className="text-text-secondary">·</span>
              <span className="text-text-secondary">{post.readingTime}</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-text-primary sm:text-6xl">{post.title}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-relaxed text-text-secondary sm:text-2xl">
              You can make a desktop pet yourself. The right method depends on whether you want to guide an AI, build the whole app, or simply put your own pet on the desktop.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <section aria-labelledby="quick-answer" className="rounded-3xl border border-mint/20 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint-dark">The quick answer</p>
            <h2 id="quick-answer" className="mt-3 font-display text-3xl font-bold text-text-primary">There are three practical routes.</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {methods.map((method) => (
                <div key={method.number} className="rounded-2xl bg-cream p-5">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${method.accent}`}>{method.number}</span>
                  <h3 className="mt-4 font-display text-lg font-bold text-text-primary">{method.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{method.bestFor}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 leading-relaxed text-text-secondary">
              If you like making things, start with Codex or a standalone build. If your goal is simply to see your real dog, cat, rabbit, bird, or another pet moving above your apps, skip to the DeskBub method.
            </p>
          </section>

          <nav aria-label="Article contents" className="mt-10 rounded-3xl bg-text-primary p-7 text-white sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">In this guide</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              <li><a href="#what-is-a-desktop-pet" className="font-semibold text-white/85 hover:text-white">1. What a desktop pet actually is</a></li>
              <li><a href="#method-codex" className="font-semibold text-white/85 hover:text-white">2. Create one with Codex</a></li>
              <li><a href="#method-build" className="font-semibold text-white/85 hover:text-white">3. Build a standalone app</a></li>
              <li><a href="#method-deskbub" className="font-semibold text-white/85 hover:text-white">4. Use DeskBub</a></li>
              <li><a href="#comparison" className="font-semibold text-white/85 hover:text-white">5. Compare the three methods</a></li>
              <li><a href="#photo-tips" className="font-semibold text-white/85 hover:text-white">6. Choose a good pet photo</a></li>
            </ol>
          </nav>

          <section id="what-is-a-desktop-pet" className="scroll-mt-24 pt-16">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">First, define the result</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">What is a desktop pet?</h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              A desktop pet is a small animated companion that appears on your computer screen. A true desktop pet is not just a wallpaper or a video player: it can float above other windows, move to a different part of the screen, and react when you interact with it.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">
              That definition matters because the three methods below do not produce exactly the same thing. A ChatGPT pet helps you follow activity inside supported ChatGPT experiences. A standalone build can behave however you program it. DeskBub is an independent Windows and Mac app designed to keep a real pet visible above everyday apps.
            </p>

            <figure className="mt-9 overflow-hidden rounded-[2rem] border border-gray-100 bg-gradient-to-br from-[#b8d8f8] to-[#f8d5c2] shadow-lg">
              <div className="relative aspect-[16/10] min-h-[330px] overflow-hidden">
                <div className="absolute left-[8%] top-[13%] h-[64%] w-[73%] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-xl">
                  <div className="flex h-9 items-center gap-2 border-b border-gray-100 bg-[#f7f9fb] px-4">
                    <span className="h-2 w-2 rounded-full bg-coral" /><span className="h-2 w-2 rounded-full bg-[#ffd166]" /><span className="h-2 w-2 rounded-full bg-mint" />
                    <span className="ml-2 text-[9px] font-bold text-text-secondary">WORK NOTES</span>
                  </div>
                  <div className="space-y-4 p-5">
                    <span className="block h-3 w-2/3 rounded-full bg-gray-100" />
                    <span className="block h-3 w-full rounded-full bg-gray-100" />
                    <span className="block h-3 w-5/6 rounded-full bg-gray-100" />
                    <div className="grid grid-cols-3 gap-3 pt-2"><span className="h-16 rounded-lg bg-mint/15" /><span className="h-16 rounded-lg bg-coral/10" /><span className="h-16 rounded-lg bg-[#dbeafe]" /></div>
                  </div>
                </div>
                <video src="/media/kaka/kaka-happy.webm" autoPlay loop muted playsInline className="absolute bottom-1 right-1 z-10 h-[62%] w-[46%] object-contain drop-shadow-[0_14px_18px_rgba(45,52,54,0.28)]" aria-label="Kaka floating over a work application on the desktop" />
                <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-center gap-2 border-t border-white/60 bg-white/75 backdrop-blur-md">
                  <span className="grid h-6 w-6 place-items-center rounded bg-[#e9f1f9] text-[10px]">⊞</span><span className="h-6 w-24 rounded bg-white shadow-sm" /><span className="h-6 w-6 rounded bg-[#e9f1f9]" /><span className="h-6 w-6 rounded bg-coral/20" />
                </div>
              </div>
              <figcaption className="bg-white px-6 py-4 text-sm font-semibold text-text-secondary">Kaka floats above the app window instead of playing inside a normal video.</figcaption>
            </figure>
          </section>

          <section id="method-codex" className="scroll-mt-24 pt-16">
            <div className="flex items-center gap-3"><span className="rounded-full bg-mint/15 px-3 py-1.5 text-xs font-extrabold text-mint-dark">METHOD 1</span><span className="text-sm font-semibold text-text-secondary">Low to medium effort</span></div>
            <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">Create a custom pet with Codex</h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              If you use the ChatGPT desktop app, its Pets feature can start a custom-pet workflow for you. OpenAI&apos;s current instructions are straightforward:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                'Open Settings → Pets in the ChatGPT desktop app.',
                'Choose “Create your own pet.” The app installs the bundled hatch-pet skill and opens a new task.',
                'Describe the pet you want. Include a clear reference photo and the features that must stay recognizable.',
                'When Codex finishes, return to Settings → Pets, choose Refresh, and select the new pet.',
              ].map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint/15 font-extrabold text-mint-dark">{index + 1}</span>
                  <p className="pt-1 leading-relaxed text-text-secondary">{step}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-3xl border border-gray-200 bg-[#f8fafc] p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-text-secondary">Example prompt</p>
              <p className="mt-4 font-mono text-sm leading-7 text-text-primary">
                Create a custom pet based on the attached photo of my pet, Milo. Keep his black ears, white muzzle, round eyes, and red collar recognizable. Make the animation calm and readable at a small desktop size. Use a transparent background and check that the motion loops cleanly.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-mint/10 p-6"><h3 className="font-display text-lg font-bold text-text-primary">Why choose it</h3><p className="mt-2 leading-relaxed text-text-secondary">It is an approachable way to guide an AI through creating and checking the animation assets.</p></div>
              <div className="rounded-2xl bg-coral/10 p-6"><h3 className="font-display text-lg font-bold text-text-primary">Know the boundary</h3><p className="mt-2 leading-relaxed text-text-secondary">The result is a custom pet for supported ChatGPT interfaces—not an independent DeskBub app pet.</p></div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-text-secondary">
              OpenAI says desktop-app custom pets are stored locally and do not automatically sync to ChatGPT on the web. Read the current <a href="https://learn.chatgpt.com/docs/pets" target="_blank" rel="noreferrer" className="font-bold text-coral underline decoration-coral/25 underline-offset-4">official Pets instructions</a> before starting, because product interfaces can change.
            </p>
          </section>

          <section id="method-build" className="scroll-mt-24 pt-16">
            <div className="flex items-center gap-3"><span className="rounded-full bg-[#dbeafe] px-3 py-1.5 text-xs font-extrabold text-[#315f8f]">METHOD 2</span><span className="text-sm font-semibold text-text-secondary">High effort</span></div>
            <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">Build a standalone desktop pet yourself</h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              This route gives you the most control. It also means building more than an animation. The “pet” usually lives inside a transparent, borderless application window, while the app manages movement, clicks, menus, system startup, and packaging.
            </p>
            <h3 className="mt-8 font-display text-2xl font-bold text-text-primary">Your minimum build checklist</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['Transparent animation', 'Prepare a transparent sprite sheet, WebM, PNG sequence, or another format your framework can render cleanly.'],
                ['Borderless window', 'Remove normal window chrome and keep the background transparent.'],
                ['Desktop behavior', 'Add always-on-top, dragging, click handling, Show/Hide, size, and opacity controls.'],
                ['Animation states', 'Decide when the pet is idle, happy, sleeping, moving, or reacting.'],
                ['System integration', 'Add a tray or menu-bar control, startup settings, and safe quit behavior.'],
                ['Packaging and QA', 'Create separate Windows and macOS builds, then test permissions, scaling, CPU, memory, and multiple displays.'],
              ].map(([title, description]) => (
                <li key={title} className="rounded-2xl border border-gray-100 bg-white p-6"><h4 className="font-display font-bold text-text-primary">{title}</h4><p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p></li>
              ))}
            </ul>
            <p className="mt-7 text-lg leading-relaxed text-text-secondary">
              Godot is a good fit when your pet behaves like a small game. Electron or Tauri works well when you are comfortable with web technologies. Python with Qt can be useful for a personal prototype. Whichever route you choose, test the transparent window and click behavior early; those parts determine whether the result feels like a desktop pet rather than a video with no border.
            </p>
          </section>

          <section id="method-deskbub" className="scroll-mt-24 pt-16">
            <div className="flex items-center gap-3"><span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-extrabold text-coral">METHOD 3</span><span className="text-sm font-semibold text-text-secondary">Low effort</span></div>
            <h2 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">Use DeskBub with your own pet photo</h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              DeskBub is for the person who wants the result—not another software project. You provide a clear photo of your actual pet, DeskBub turns it into transparent animations, and the desktop app handles the floating window and controls on Windows or Mac.
            </p>

            <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-lg md:grid-cols-2">
              <div className="relative min-h-[350px] bg-[#efe8e1]">
                <Image src="/media/kaka/kaka.jpg" alt="The original photo of Kaka used to create a desktop pet" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[50%_35%]" />
                <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-text-primary shadow-lg">ONE REAL PET PHOTO</span>
              </div>
              <div className="relative min-h-[350px] overflow-hidden bg-gradient-to-br from-[#b8d8f8] to-[#f8d5c2]">
                <video src="/media/kaka/kaka-relaxed.webm" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-contain p-5 drop-shadow-[0_18px_22px_rgba(45,52,54,0.25)]" aria-label="Kaka as an animated DeskBub desktop pet" />
                <span className="absolute bottom-5 left-5 rounded-full bg-text-primary/85 px-4 py-2 text-xs font-extrabold text-white shadow-lg">ANIMATED FOR THE DESKTOP</span>
              </div>
            </div>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['1', 'Upload one clear photo', 'Start with a dog, cat, rabbit, bird, or another pet.'],
                ['2', 'Choose your option', 'Pick the level that matches the number of actions you want.'],
                ['3', 'Get transparent animations', 'Review the generated movements made from your pet.'],
                ['4', 'Pair the desktop app', 'Enter the pairing code and place your pet above your apps.'],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-4 rounded-2xl bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral/10 font-extrabold text-coral">{number}</span><div><h3 className="font-display font-bold text-text-primary">{title}</h3><p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p></div></li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/upload" className="rounded-full bg-coral px-7 py-3.5 text-center font-bold text-white shadow-lg shadow-coral/20 transition hover:bg-coral-dark">Turn My Pet Photo into a Desktop Pet</Link>
              <Link href="/download" className="rounded-full border-2 border-text-primary/10 bg-white px-7 py-3 text-center font-bold text-text-primary transition hover:border-mint/50">Try Kaka for Free</Link>
            </div>
          </section>

          <section id="comparison" className="scroll-mt-24 pt-16">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">Side-by-side</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Which method should you choose?</h2>
            <div className="mt-8 overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-text-primary text-white"><tr><th className="p-5 font-bold">Method</th><th className="p-5 font-bold">Best for</th><th className="p-5 font-bold">Effort</th><th className="p-5 font-bold">Main result</th></tr></thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.number} className="border-t border-gray-100 align-top"><th className="p-5 font-display font-bold text-text-primary">{method.title}</th><td className="p-5 leading-relaxed text-text-secondary">{method.bestFor}</td><td className="p-5 font-semibold text-text-primary">{method.effort}</td><td className="p-5 leading-relaxed text-text-secondary">{method.result}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Choose Codex if you already use ChatGPT and enjoy directing the creation process. Build your own app if complete control matters more than time. Choose DeskBub if the non-negotiable part is simple: the companion on your desktop should be your own pet.
            </p>
          </section>

          <section id="photo-tips" className="scroll-mt-24 pt-16">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint-dark">Better input, better result</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Choose a photo that can survive animation.</h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">Whichever AI-assisted route you use, the reference photo does a lot of the work. Start with an image that makes your pet&apos;s identity easy to read.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['Use a sharp, well-lit photo', 'Natural light and visible fur detail give the process more information to preserve.'],
                ['Show the parts you want animated', 'A full-body result needs a photo where the legs, paws, tail, and ears are not hidden.'],
                ['Keep the face recognizable', 'Choose the expression and angle that feel most like your pet.'],
                ['Avoid heavy overlap', 'Hands, blankets, furniture, and other animals can make clean separation harder.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6"><h3 className="font-display text-lg font-bold text-text-primary">{title}</h3><p className="mt-2 leading-relaxed text-text-secondary">{description}</p></div>
              ))}
            </div>
          </section>

          <section className="mt-16 rounded-[2rem] bg-text-primary p-8 text-center text-white sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint">Not ready to upload?</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">See what a real desktop pet feels like first.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70">Kaka comes with DeskBub for free. No account or payment required—download the app and meet him on your Windows or Mac desktop.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/download" className="rounded-full bg-mint px-7 py-3.5 font-bold text-white transition hover:bg-mint-dark">Try Kaka for Free</Link>
              <Link href="/upload" className="rounded-full border border-white/20 px-7 py-3.5 font-bold text-white transition hover:bg-white/10">Use My Own Pet</Link>
            </div>
          </section>

          <aside className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">A note about products:</strong> Codex and ChatGPT are products of OpenAI. DeskBub is an independent product and is not affiliated with or endorsed by OpenAI. Product steps can change, so check the linked official documentation for the latest ChatGPT Pets instructions.
          </aside>

          <aside className="mt-6 rounded-2xl border border-coral/15 bg-coral/5 p-6 leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Looking for a smaller pet-photo project?</strong>{' '}
            Try these <Link href="/blog/digital-ways-to-celebrate-your-dog" className="font-bold text-coral underline decoration-coral/25 underline-offset-4">seven digital ways to celebrate your dog on August 26</Link>.
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}
