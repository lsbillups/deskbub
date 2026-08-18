import type { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import KakaShowcase from '@/components/landing/KakaShowcase';
import ProductChoice from '@/components/landing/ProductChoice';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import HomeFAQ from '@/components/landing/HomeFAQ';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: { absolute: 'DeskBub — Free Desktop Pet for Windows & Mac' },
  description:
    'Download Kaka, a free desktop pet for Windows and Mac, or turn a photo of your own dog or cat into a custom animated desktop companion.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DeskBub — Free Desktop Pet for Windows & Mac',
    description: 'Download Kaka free, or turn your own pet photo into an animated desktop companion.',
    url: 'https://deskbub.com/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <Hero />
      <KakaShowcase />
      <ProductChoice />
      <HowItWorks />
      <Features />
      <HomeFAQ />
      <Footer />
    </main>
  );
}
