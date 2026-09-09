import type { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import ProductChoice from '@/components/landing/ProductChoice';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import HomeFAQ from '@/components/landing/HomeFAQ';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: { absolute: 'Free Desktop Pet & Custom Pet From Photo | DeskBub' },
  description:
    'Download a free desktop pet for Windows or Mac, or turn one photo of your real pet into a custom desktop companion. Custom pets start at $1.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Free Desktop Pet & Custom Pet From Photo | DeskBub',
    description: 'Try Kaka free for Windows or Mac, or turn one real pet photo into a custom desktop companion.',
    url: 'https://deskbub.com/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <Hero />
      <ProductChoice />
      <HowItWorks />
      <Features />
      <HomeFAQ />
      <Footer />
    </main>
  );
}
