import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Free Desktop Pet for Windows & Mac — Meet Kaka',
  description: 'Download Kaka, DeskBub’s free desktop dog for Windows and Mac. No account required, with custom pets available when you want your own.',
  alternates: { canonical: '/free-desktop-pet' },
  openGraph: {
    title: 'Free Desktop Pet for Windows & Mac — Meet Kaka',
    description: 'Download Kaka, DeskBub’s free desktop dog. No account required.',
    url: 'https://deskbub.com/free-desktop-pet',
  },
};

const faqs = [
  ['Does Kaka cost anything?', 'No. Kaka comes with the DeskBub app and is free to use without an account.'],
  ['What can I do with him?', 'Choose from five Kaka actions, move him around your screen, set water and stretch reminders, and adjust his size and opacity.'],
  ['Can I hide Kaka without quitting?', 'Yes. Use the Show/Hide control whenever you need a clear desktop.'],
  ['Can I replace Kaka with my pet?', 'Yes. Upload a photo of your dog, cat, rabbit, bird, or another pet, then pair the result with the same desktop app.'],
];

export default function FreeDesktopPetPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DeskBub',
    operatingSystem: 'Windows 10, Windows 11, macOS 12+',
    applicationCategory: 'EntertainmentApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'A free animated desktop pet featuring Kaka, the official DeskBub dog.',
  };

  return (
    <main className="min-h-screen bg-cream pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-mint/15 px-4 py-2 text-sm font-bold text-mint-dark">FREE · NO ACCOUNT REQUIRED</span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight text-text-primary sm:text-6xl">Meet Kaka, a Free Desktop Pet</h1>
            <p className="mt-6 text-xl leading-relaxed text-text-secondary">Kaka is DeskBub&apos;s official desktop dog. Download the app and he&apos;ll hang out on your Windows or Mac desktop—free, with no account required.</p>
            <Link href="/download" className="mt-8 inline-block rounded-full bg-coral px-7 py-3.5 font-bold text-white shadow-xl shadow-coral/25 hover:bg-coral-dark">Download Kaka for Free</Link>
            <p className="mt-4 text-sm text-text-secondary">Available for Windows 10/11 and macOS 12+.</p>
          </div>
          <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#b8d8f8] to-[#f8d5c2] shadow-2xl">
            <video src="/media/kaka/kaka-relaxed.webm" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_20px_24px_rgba(45,52,54,0.25)]" aria-label="Kaka relaxing as an animated desktop pet" />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src="/media/kaka/kaka.jpg" alt="A real photo of Kaka" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-[50%_35%]" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Meet the original</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Kaka is a real little dog.</h2>
              <p className="mt-5 text-lg leading-relaxed text-text-secondary">He became DeskBub&apos;s first desktop pet after we turned a real photo into transparent animations. The free app includes five Kaka actions, water and stretch reminders, instant Show/Hide, plus controls for movement, size, opacity, and sharing.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Download → Install → Meet Kaka</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {['Choose Windows or macOS', 'Install and open DeskBub', 'Kaka appears—no code needed'].map((step, index) => <div key={step} className="rounded-2xl border border-gray-100 bg-white p-7"><span className="text-sm font-extrabold text-coral">STEP {index + 1}</span><p className="mt-3 font-display text-lg font-bold text-text-primary">{step}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-text-primary">Free Kaka FAQ</h2>
          <div className="mt-8 space-y-4">{faqs.map(([q, a]) => <details key={q} className="rounded-2xl border border-gray-100 bg-cream px-6 py-4"><summary className="cursor-pointer font-bold text-text-primary">{q}</summary><p className="mt-3 leading-relaxed text-text-secondary">{a}</p></details>)}</div>
          <div className="mt-12 rounded-3xl bg-text-primary p-8 text-center text-white sm:p-10">
            <h2 className="font-display text-3xl font-bold">Love having Kaka around?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">Put your own pet on your desktop next. Custom pets start at $1 with no subscription.</p>
            <Link href="/upload" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-bold text-white">Upload a Pet Photo</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
