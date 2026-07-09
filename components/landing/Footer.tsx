import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-text-primary text-white py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-lg font-display font-bold">
          <span>🐾</span> DeskBub
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/refund" className="hover:text-white transition-colors">Refund</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <span className="text-white/40">&copy; {new Date().getFullYear()} DeskBub</span>
        </div>
      </div>
    </footer>
  );
}
