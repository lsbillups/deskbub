import Image from 'next/image';
import Link from 'next/link';

export default function KakaShowcase() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">A real pet, not a mascot</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">This is Kaka—in real life and on the desktop.</h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">Kaka is the real dog behind DeskBub. His photo became a transparent animated companion that can live right on your screen.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl border border-gray-100 bg-cream shadow-sm">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src="/media/kaka/kaka.jpg" alt="Kaka, the real dog behind DeskBub" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[50%_35%]" />
            </div>
            <figcaption className="px-6 py-4 font-semibold text-text-primary">Kaka in real life</figcaption>
          </figure>

          <figure className="overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-[#dbeafe] to-[#fce7d9] shadow-sm">
            <div className="relative aspect-[4/3] overflow-hidden">
              <div className="absolute left-5 top-5 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-text-secondary shadow-sm">Your desktop</div>
              <video className="absolute inset-0 h-full w-full object-contain p-5 drop-shadow-[0_12px_18px_rgba(45,52,54,0.25)]" src="/media/kaka/kaka-curious.webm" autoPlay loop muted playsInline aria-label="Kaka as an animated transparent desktop pet" />
            </div>
            <figcaption className="px-6 py-4 font-semibold text-text-primary">Kaka on the desktop</figcaption>
          </figure>
        </div>

        <div className="mt-9 text-center">
          <Link href="/free-desktop-pet" className="font-bold text-coral underline decoration-coral/30 underline-offset-4 hover:decoration-coral">Meet Kaka and see what is included →</Link>
        </div>
      </div>
    </section>
  );
}
