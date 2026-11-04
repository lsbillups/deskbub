import Link from 'next/link';

const groups = [
  { title: 'Product', links: [['Meet Kaka', '/free-desktop-pet'], ['Custom Pet', '/custom-desktop-pet'], ['Pricing', '/pricing'], ['Download', '/download']] },
  { title: 'Resources', links: [['Blog', '/blog'], ['How It Works', '/#how-it-works'], ['Paws At You', 'https://pawsatyou.net/'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refund']] },
];

export default function Footer() {
  return (
    <footer className="bg-text-primary px-6 py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold"><span>🐾</span> DeskBub</Link>
          <p className="mt-4 max-w-sm leading-relaxed text-white/65">Meet Kaka on your desktop—or bring your own pet to life on Windows and Mac.</p>
          <p className="mt-6 text-sm text-white/40">&copy; {new Date().getFullYear()} DeskBub</p>
          <p className="mt-3 text-sm text-white/70">
            <a href="https://www.showmysites.com" target="_blank" rel="noopener" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">ShowMySites</a>
            <span aria-hidden="true" className="mx-2">·</span>
            <a href="https://twelve.tools" target="_blank" rel="noopener" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Twelve Tools</a>
            <span aria-hidden="true" className="mx-2">·</span>
            <a href="https://aihustle.tools/" target="_blank" rel="noopener" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">AI Hustle</a>
            <span aria-hidden="true" className="mx-2">·</span>
            <a href="https://launchtory.com/projects/deskbub" target="_blank" rel="noopener" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Launchtory</a>
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white/45">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70">{group.links.map(([label, href]) => <li key={href}><Link href={href} {...(href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="transition hover:text-white">{label}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div aria-label="Directory listings" role="group" className="mx-auto mt-8 grid max-w-6xl grid-cols-2 items-center gap-x-4 gap-y-4 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        <a href="https://launchzone.co/tools/deskbub" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://launchzone.co/badges/classic-dark.svg" alt="Featured on LaunchZone" width="150" height="48" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
        <a href="https://toolrain.com/item/deskbub" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://toolrain.com/badges/badge-listed-dark.svg" alt="Listed on ToolRain" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
        <a href="https://domainrank.app" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://domainrank.app/api/badge/deskbub.com?style=small&theme=dark" alt="deskbub.com Domain Rating" width="249" height="40" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
        <a href="https://fazier.com/launches/deskbub" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=dark" alt="Fazier badge" width="120" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
        <a href="https://sellwithboost.com" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://sellwithboost.com/badge/listing-dark.svg" alt="Listed on Sell With boost" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
        <a href="https://findly.tools/deskbub?utm_source=deskbub" target="_blank" rel="noopener noreferrer" className="flex h-12 min-w-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {/* Keep the directory's original badge URL for its verification. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://findly.tools/badges/findly-tools-badge-dark.svg" alt="Featured on Findly.tools" width="175" height="55" className="h-auto max-h-10 w-auto max-w-full" />
        </a>
      </div>
    </footer>
  );
}
