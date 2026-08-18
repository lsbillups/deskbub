import Link from 'next/link';

const groups = [
  { title: 'Product', links: [['Meet Kaka', '/free-desktop-pet'], ['Custom Pet', '/custom-desktop-pet'], ['Pricing', '/pricing'], ['Download', '/download']] },
  { title: 'Support', links: [['How It Works', '/#how-it-works'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refund']] },
];

export default function Footer() {
  return (
    <footer className="bg-text-primary px-6 py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold"><span>🐾</span> DeskBub</Link>
          <p className="mt-4 max-w-sm leading-relaxed text-white/65">Meet Kaka on your desktop—or bring your own pet to life on Windows and Mac.</p>
          <p className="mt-6 text-sm text-white/40">&copy; {new Date().getFullYear()} DeskBub</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/45">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>)}</ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
