import type { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import KakaShowcase from '@/components/landing/KakaShowcase';
import ProductChoice from '@/components/landing/ProductChoice';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import HomeFAQ from '@/components/landing/HomeFAQ';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: { absolute: 'DeskBub — Bring Any Pet to Life on Your Desktop' },
  description:
    'Upload one photo of any pet to create an animated desktop companion for Windows or Mac, or use Kaka for free with five actions and break reminders.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DeskBub — Bring Any Pet to Life on Your Desktop',
    description: 'Upload one pet photo to create an animated desktop companion, or use Kaka for free.',
    url: 'https://deskbub.com/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <Hero />
      <ProductChoice />
      <HowItWorks />
      <KakaShowcase />
      <Features />
      <HomeFAQ />
      <Footer />
    </main>
  );
}
