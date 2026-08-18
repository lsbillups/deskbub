import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Desktop Pet Pricing — From $1',
  description: 'Download Kaka free or create a custom desktop pet from your own photo. One-time pricing from $1, with no subscription.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Custom Desktop Pet Pricing — From $1',
    description: 'Kaka is free. Custom pets from your own photo start at $1 with no subscription.',
    url: 'https://deskbub.com/pricing',
  },
};

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
