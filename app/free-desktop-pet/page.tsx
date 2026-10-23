import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';
import KakaPhotoShowcase from '@/components/landing/KakaPhotoShowcase';
import ShareBasic from '@/components/share/ShareBasic';
import TrackedLink from '@/components/analytics/TrackedLink';
import { shareCampaignEnabled } from '@/lib/share-claims';
import { BASIC_PRICE } from '@/lib/pricing';
import styles from './FreeDesktopPet.module.css';

export const metadata: Metadata = {
  title: 'Free Desktop Pet for Windows & Mac | Download Kaka',
  description: 'Use Kaka for free on Windows and Mac. No account or payment required, with custom desktop pets available when you want your own.',
  alternates: { canonical: '/free-desktop-pet' },
  openGraph: {
    title: 'Free Desktop Pet for Windows & Mac | Download Kaka',
    description: 'Use Kaka for free on Windows and Mac. No account or payment required.',
    url: 'https://deskbub.com/free-desktop-pet',
  },
};

const faqs = [
  ['Does Kaka cost anything?', 'No. Kaka comes with the DeskBub app at no cost. No account or payment is required.'],
  ['What can I do with him?', 'Choose from five Kaka actions, move him around your screen, set water and stretch reminders, and adjust his size and opacity.'],
  ['Can I hide Kaka without quitting?', 'Yes. Use the Show/Hide control whenever you need a clear desktop.'],
  ['How do I download a free desktop pet?', 'Choose the Windows or Mac installer above, install DeskBub and open it. Kaka is included: no account, payment or pairing code is needed.'],
  ['Which computers can use Kaka?', 'DeskBub is available for Windows 10/11 and macOS 12 or later. The pet runs in the desktop app; a browser video is a preview.'],
  ['Is Kaka a free trial?', 'Kaka is included at no cost, with five ready-made actions. Creating a pet from your own photo is a separate one-time purchase, or a Basic reward after an approved sharing application.'],
  ['Can I replace Kaka with my pet?', 'Yes. Create a custom pet from your own photo on the Custom page, then use your pairing code in the same desktop app. Basic starts at $2.99; creating your own pet is separate from free Kaka.'],
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
      <section className="px-6 pb-12 pt-8 sm:pb-14 sm:pt-10">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-text-primary sm:text-5xl xl:text-6xl">Download Kaka, a Free Desktop Pet</h1>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">A real little dog, right on your screen. Download your free desktop pet for Windows or Mac, with five Kaka animations and no account or payment required.</p>
            <div className={styles.actions} role="group" aria-label="Download or create a desktop pet">
              <TrackedLink href="https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-Windows.exe" eventName="installer_download_click" eventProperties={{ platform: 'windows', source: 'free' }} className={`${styles.actionButton} ${styles.secondaryAction}`}>Download for Windows</TrackedLink>
              <TrackedLink href="https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-macOS.dmg" eventName="installer_download_click" eventProperties={{ platform: 'mac', source: 'free' }} className={`${styles.actionButton} ${styles.secondaryAction}`}>Download for Mac</TrackedLink>
              <p className={styles.compatibility}>Windows 10/11 · macOS 12+</p>
              <TrackedLink href="/custom-desktop-pet#custom-create" eventName="free_custom_cta_click" eventProperties={{ placement: 'hero', destination: 'custom' }} className={`${styles.actionButton} ${styles.primaryAction} ${styles.customChoice}`}><span>Create My Pet From a Photo</span><span className={styles.actionDetail}>From {BASIC_PRICE} · One-time purchase</span></TrackedLink>
              <ShareBasic enabled={shareCampaignEnabled()} staging={process.env.DESKBUB_CUSTOM_STAGING === '1'} compactTrigger />
            </div>
          </div>
          <div>
            <div className="relative aspect-[6/5] w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#b8d8f8] to-[#f8d5c2] shadow-2xl">
              <video src="/media/kaka/kaka-relaxed.webm" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_20px_24px_rgba(45,52,54,0.25)]" aria-label="Kaka relaxing as an animated desktop pet" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm font-semibold text-[#a82d39]"><a href="#kaka-actions" className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary">Photo &amp; animation comparison</a><a href="#desktop-demo" className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary">Watch desktop demo</a></div>
          </div>
        </div>
      </section>

      <KakaPhotoShowcase id="kaka-actions" showCtas={false} title="Five actions. One familiar desktop dog." description="Kaka is a real little dog. Compare his original photos with the five animations included in your free desktop pet download." />

      <div className="mx-auto max-w-6xl px-6 pb-16 text-center">
        <p className="text-lg font-semibold text-text-primary">See your own pet come to life, too.</p>
        <p className="mt-2 text-sm text-text-secondary">Start with your pet photo. Custom pets from {BASIC_PRICE}, one-time.</p>
        <TrackedLink href="/custom-desktop-pet#custom-create" eventName="free_custom_cta_click" eventProperties={{ placement: 'after-actions', destination: 'custom' }} className={`${styles.softAction} mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-bold`}>Create My Pet</TrackedLink>
      </div>

      <section id="desktop-demo" className="scroll-mt-24 bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center"><h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">See Kaka on a real desktop</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">Your free desktop companion appears above your open apps. Move Kaka, change his size and opacity, or hide him when you need a clear screen.</p>
          <figure className="mt-8"><video controls playsInline muted preload="none" poster="/media/custom-desktop-demo/kaka-windows-clear-v2-poster.jpg" className="w-full rounded-2xl" aria-label="Free Kaka desktop dog beside an example spreadsheet on Windows"><source src="/media/custom-desktop-demo/kaka-windows-clear-v2.mp4" type="video/mp4" /></video><figcaption className="mt-3 text-sm text-text-secondary">Actual Windows recording · example spreadsheet · earlier app version · audio removed.</figcaption></figure>
        </div>
      </section>

      <section id="install-kaka" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Download → Install → Meet Kaka</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {['Choose Windows or macOS', 'Install and open DeskBub', 'Kaka appears—no code needed'].map((step, index) => <div key={step} className="rounded-2xl border border-gray-100 bg-white p-7"><span className="text-sm font-extrabold text-coral">STEP {index + 1}</span><p className="mt-3 font-display text-lg font-bold text-text-primary">{step}</p></div>)}
          </div>
          <p className="mt-7 text-sm leading-relaxed text-text-secondary">Kaka needs no pairing code. Custom pets use the code in your Dashboard. <Link className="font-semibold text-[#a82d39] underline underline-offset-4" href="/download">Installation help and pairing</Link></p>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-text-primary">Kaka FAQ</h2>
          <div className="mt-8 space-y-4">{faqs.map(([q, a]) => <details key={q} className="rounded-2xl border border-gray-100 bg-cream px-6 py-4"><summary className="cursor-pointer font-bold text-text-primary">{q}</summary><p className="mt-3 leading-relaxed text-text-secondary">{a}</p></details>)}</div>
          <div className="mt-12 rounded-3xl bg-text-primary p-8 text-center text-white sm:p-10">
            <h2 className="font-display text-3xl font-bold">Love having Kaka around?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">Put your own pet on your desktop next. Custom pets start at $2.99 with no subscription.</p>
            <TrackedLink href="/custom-desktop-pet#custom-create" eventName="free_custom_cta_click" eventProperties={{ placement: 'footer', destination: 'custom' }} className={`${styles.primaryAction} ${styles.onDark} mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-bold`}>Create My Pet · From {BASIC_PRICE}</TrackedLink>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
