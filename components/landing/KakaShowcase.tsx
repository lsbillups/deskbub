import Image from 'next/image';
import Link from 'next/link';

export default function KakaShowcase() {
  return (
    <section id="examples" className="scroll-mt-20 bg-white px-6 py-20">
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
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#9fc5eb] via-[#d8e4f1] to-[#f3cdbf]">
              <div className="absolute left-5 top-5 z-30 rounded-lg bg-text-primary/80 px-3 py-2 text-xs font-semibold text-white shadow-sm">Your desktop</div>
              <div className="absolute left-[8%] top-[23%] h-[55%] w-[67%] overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-xl">
                <div className="flex h-8 items-center gap-1.5 border-b border-gray-100 bg-[#f7f9fb] px-3">
                  <span className="h-2 w-2 rounded-full bg-coral" />
                  <span className="h-2 w-2 rounded-full bg-[#ffd166]" />
                  <span className="h-2 w-2 rounded-full bg-mint" />
                  <span className="ml-2 text-[9px] font-semibold text-text-secondary">Notes</span>
                </div>
                <div className="space-y-3 p-4">
                  <span className="block h-2 w-2/3 rounded-full bg-gray-100" />
                  <span className="block h-2 w-full rounded-full bg-gray-100" />
                  <span className="block h-2 w-5/6 rounded-full bg-gray-100" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <span className="h-12 rounded-md bg-mint/15" />
                    <span className="h-12 rounded-md bg-coral/10" />
                    <span className="h-12 rounded-md bg-[#dbeafe]" />
                  </div>
                </div>
              </div>
              <video className="absolute bottom-3 right-1 z-20 h-[64%] w-[46%] object-contain drop-shadow-[0_12px_18px_rgba(45,52,54,0.25)]" src="/media/kaka/kaka-curious.webm" autoPlay loop muted playsInline aria-label="Kaka floating above an open app on a computer desktop" />
              <div className="absolute inset-x-0 bottom-0 z-30 flex h-9 items-center justify-center gap-2 border-t border-white/60 bg-white/75 backdrop-blur-md">
                <span className="grid h-6 w-6 place-items-center rounded bg-[#e9f1f9] text-[10px]">⊞</span>
                <span className="h-6 w-20 rounded bg-white/90 shadow-sm" />
                <span className="h-6 w-6 rounded bg-[#e9f1f9]" />
                <span className="h-6 w-6 rounded bg-coral/20" />
              </div>
            </div>
            <figcaption className="flex items-center justify-between gap-4 px-6 py-4 font-semibold text-text-primary"><span>Kaka on the desktop</span><span className="text-xs font-medium text-text-secondary">Floats above your apps</span></figcaption>
          </figure>
        </div>

        <div className="mt-9 text-center">
          <Link href="/download" className="font-bold text-coral underline decoration-coral/30 underline-offset-4 hover:decoration-coral">Try Kaka on my desktop →</Link>
        </div>
      </div>
    </section>
  );
}
