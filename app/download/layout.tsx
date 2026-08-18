import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download DeskBub for Windows & macOS',
  description: 'Download DeskBub and use Kaka for free on Windows or macOS. No account required.',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Download DeskBub for Windows & macOS',
    description: 'Download DeskBub and use Kaka for free. No account required.',
    url: 'https://deskbub.com/download',
  },
};

export default function DownloadLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
