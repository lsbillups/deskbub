import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download DeskBub for Windows & macOS',
  description: 'Download DeskBub and meet Kaka, the free desktop pet included with the app. Available for Windows and macOS.',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Download DeskBub for Windows & macOS',
    description: 'Download DeskBub and meet Kaka, the free desktop pet included with the app.',
    url: 'https://deskbub.com/download',
  },
};

export default function DownloadLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
