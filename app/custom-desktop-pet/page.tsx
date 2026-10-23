import type { Metadata } from 'next';
import Footer from '@/components/landing/Footer';
import KakaPhotoShowcase from '@/components/landing/KakaPhotoShowcase';
import CustomFlow from '@/components/custom/CustomFlow';
import { CustomPageNav, CustomDesktopDemo, CustomPurchaseDetails, CustomFAQ } from '@/components/custom/CustomDetails';
import styles from '@/components/custom/CustomDetails.module.css';

export const metadata: Metadata = {
  title: 'Custom Desktop Pet From Your Pet Photo',
  description: 'Create an animated desktop companion from a real pet photo. Custom desktop pets for Windows and Mac start at $2.99 with no subscription.',
  alternates: { canonical: '/custom-desktop-pet' },
  openGraph: {
    title: 'Custom Desktop Pet From Your Pet Photo | DeskBub',
    description: 'Create a Windows or Mac desktop companion from one real pet photo. One-time pricing starts at $2.99.',
    url: 'https://deskbub.com/custom-desktop-pet',
  },
};

export default function CustomDesktopPetPage() {
  return (
    <main className={`${styles.page} min-h-screen bg-cream pt-16`}>
      {process.env.DESKBUB_CUSTOM_STAGING === '1' && <aside className="bg-amber-50 px-5 py-3 text-center text-sm text-amber-950">{process.env.DESKBUB_CUSTOM_STAGING_MODELS === 'approved-usd1' ? 'Staging · Approved $1 generation test · Basic: 1 photo / Plus: 2 photos · Creem test payments only' : process.env.DESKBUB_CUSTOM_STAGING_PAYMENTS === 'test' ? 'Staging · Creem test payments only · Pet generation is disabled' : 'Staging · Test accounts and data · Payments and generation are disabled'}</aside>}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full bg-coral/10 px-4 py-2 text-sm font-bold text-coral">ONE PHOTO · YOUR ACTUAL PET</span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-extrabold leading-tight text-text-primary sm:text-6xl">Turn Your Pet’s Photo Into a Custom Desktop Pet</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-text-secondary">Create a personalized desktop pet from a photo of your actual dog, cat, or another pet. One-time purchase for Windows and Mac.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#custom-create" className="rounded-full bg-coral px-7 py-3.5 font-bold text-white shadow-xl shadow-coral/25 hover:bg-coral-dark">Upload a Pet Photo</a>
            <a href="#custom-plans" className="rounded-full border-2 border-gray-200 bg-white px-7 py-3 font-bold text-text-primary hover:border-coral/30">Compare Plans &amp; Pricing</a>
          </div>
          <CustomPageNav />
        </div>
      </section>

      <KakaPhotoShowcase
        id="kaka-examples"
        mode="full"
        showCtas={false}
        title="From pet photo to desktop pet"
        description="See Kaka’s real photos beside five matching animations. Choose an action to compare, then watch him on a Windows desktop below."
      />

      <CustomDesktopDemo />
      <CustomPurchaseDetails />

      <section id="custom-create" className="scroll-mt-24 bg-white px-6 py-16 sm:py-20" aria-label="Create your custom desktop pet">
        <div className="mx-auto max-w-5xl">
          <CustomFlow />
        </div>
      </section>

      <CustomFAQ />

      <section className="bg-text-primary px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Custom generation starts at $2.99.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">Create one default action with Basic, or generate more options and keep your five favorites with Plus. One-time payment, no subscription.</p>
          <a href="#custom-create" className="mt-8 inline-block rounded-full bg-coral px-7 py-3.5 font-bold text-white hover:bg-coral-dark">Upload a Pet Photo</a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
