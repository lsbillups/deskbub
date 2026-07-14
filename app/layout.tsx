import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/landing/Navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://deskbub.com'),
  title: {
    default: 'DeskBub — Your Real Pet, Alive on Your Desktop',
    template: '%s | DeskBub',
  },
  description:
    'Upload a photo of your real pet. AI removes the background and brings it to life on your desktop — napping, stretching, and reminding you to take care of yourself.',
  keywords: ['desktop pet', 'virtual pet', 'real pet photo', 'desktop companion', 'deskbub', 'AI pet', 'pet on desktop'],
  openGraph: {
    title: 'DeskBub — Your Real Pet, Alive on Your Desktop',
    description: 'Upload a photo. AI does the magic. Your furry friend lives on your desktop.',
    url: 'https://deskbub.com',
    siteName: 'DeskBub',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
