import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Desktop Pet Pricing — From $2.99',
  description: 'Use Kaka for free or create a custom desktop pet from your own photo. One-time pricing from $2.99, with no subscription.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Custom Desktop Pet Pricing — From $2.99',
    description: 'Use Kaka for free. Custom pets from your own photo start at $2.99 with no subscription.',
    url: 'https://deskbub.com/pricing',
  },
};

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
