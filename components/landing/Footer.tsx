import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-text-primary text-white py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-lg font-display font-bold">
          <span>🐾</span> DeskBub
        </div>

        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link href="/sign-up" className="hover:text-white transition-colors">
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <span>&copy; {new Date().getFullYear()} DeskBub</span>
        </div>
      </div>
    </footer>
  );
}
