import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/landing/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://deskbub.com'),
  title: {
    default: 'DeskBub — Free Desktop Pet for Windows & Mac',
    template: '%s | DeskBub',
  },
  description:
    'Download Kaka, a free desktop pet for Windows and Mac, or turn a photo of your own dog or cat into a custom animated desktop companion.',
  keywords: ['free desktop pet', 'desktop pet', 'virtual pet', 'Windows desktop pet', 'Mac desktop pet', 'custom pet', 'DeskBub'],
  openGraph: {
    title: 'DeskBub — Free Desktop Pet for Windows & Mac',
    description: 'Meet Kaka for free, or bring your own pet to your Windows or Mac desktop.',
    url: 'https://deskbub.com',
    siteName: 'DeskBub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeskBub — Free Desktop Pet for Windows & Mac',
    description: 'Meet Kaka for free, or bring your own pet to your desktop.',
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
