import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/landing/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://deskbub.com'),
  title: {
    default: 'DeskBub — Bring Any Pet to Life on Your Desktop',
    template: '%s | DeskBub',
  },
  description:
    'Upload one photo of any pet to create an animated desktop companion for Windows or Mac, or download Kaka free.',
  keywords: ['free desktop pet', 'desktop pet', 'virtual pet', 'Windows desktop pet', 'Mac desktop pet', 'custom pet', 'DeskBub'],
  openGraph: {
    title: 'DeskBub — Bring Any Pet to Life on Your Desktop',
    description: 'Meet Kaka for free, or bring any pet to your Windows or Mac desktop.',
    url: 'https://deskbub.com',
    siteName: 'DeskBub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeskBub — Bring Any Pet to Life on Your Desktop',
    description: 'Meet Kaka for free, or bring any pet to your desktop.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full flex flex-col font-sans">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
