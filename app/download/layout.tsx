import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download DeskBub for Windows & macOS',
  description: 'Download DeskBub and use Kaka for free on Windows or macOS. No account or payment required.',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Download DeskBub for Windows & macOS',
    description: 'Download DeskBub and use Kaka for free. No account or payment required.',
    url: 'https://deskbub.com/download',
  },
};

export default function DownloadLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
