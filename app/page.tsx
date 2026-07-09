import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Footer />
    </main>
  );
}
