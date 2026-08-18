import Image from 'next/image';
import Link from 'next/link';

const faqs = [
  ['Does Kaka cost anything?', 'No. Kaka includes five animated actions and can be used for as long as you like. No account or payment is required.'],
  ['Can I use a pet other than a dog?', 'Yes. Upload a clear photo of your cat, rabbit, bird, dog, or another pet. Custom pets are a one-time purchase starting at $1.'],
  ['Does DeskBub work on Windows and Mac?', 'DeskBub is available for Windows 10/11 and macOS 12 or later.'],
  ['Can Kaka remind me to take breaks?', 'Yes. You can set water and stretch reminders, pause them anytime, or test them from the DeskBub controls.'],
  ['Does the pet cover my work?', 'You can drag your pet, adjust its size and opacity, or hide it instantly from the app controls.'],
];

export default function HomeFAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">Questions before you get started?</h2>
        <div className="mt-10 space-y-4">
          <details open className="group overflow-hidden rounded-3xl border border-coral/15 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-display text-xl font-bold text-text-primary sm:px-8">Who is Kaka?<span className="text-2xl text-coral transition group-open:rotate-45">+</span></summary>
            <div className="border-t border-gray-100 px-6 pb-8 pt-6 sm:px-8">
              <p className="max-w-3xl text-lg leading-relaxed text-text-secondary">Kaka is the real dog behind DeskBub. We turned him into a desktop companion—and included him for free, so you can try DeskBub before creating your own pet.</p>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-cream">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src="/media/kaka/kaka.jpg" alt="Kaka, the real dog behind DeskBub" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-[50%_35%]" />
                  </div>
                  <figcaption className="px-5 py-3 text-sm font-bold text-text-primary">Kaka in real life</figcaption>
                </figure>

                <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#9fc5eb] via-[#d8e4f1] to-[#f3cdbf]">
                    <span className="absolute left-4 top-4 z-30 rounded-md bg-text-primary/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">Your desktop</span>
                    <div className="absolute left-[8%] top-[25%] h-[52%] w-[66%] overflow-hidden rounded-lg border border-white/80 bg-white/95 shadow-xl">
                      <div className="flex h-7 items-center gap-1.5 border-b border-gray-100 bg-[#f7f9fb] px-2.5"><span className="h-1.5 w-1.5 rounded-full bg-coral" /><span className="h-1.5 w-1.5 rounded-full bg-[#ffd166]" /><span className="h-1.5 w-1.5 rounded-full bg-mint" /></div>
                      <div className="space-y-2 p-3"><span className="block h-2 w-2/3 rounded-full bg-gray-100" /><span className="block h-2 w-full rounded-full bg-gray-100" /><span className="block h-2 w-4/5 rounded-full bg-gray-100" /></div>
                    </div>
                    <video className="absolute bottom-2 right-1 z-20 h-[64%] w-[46%] object-contain drop-shadow-[0_10px_14px_rgba(45,52,54,0.25)]" src="/media/kaka/kaka-curious.webm" autoPlay loop muted playsInline aria-label="Kaka moving above an open app on a computer desktop" />
                    <div className="absolute inset-x-0 bottom-0 z-30 h-8 border-t border-white/60 bg-white/75 backdrop-blur-md" />
                  </div>
                  <figcaption className="px-5 py-3 text-sm font-bold text-text-primary">Kaka on the desktop</figcaption>
                </figure>
              </div>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link href="/download" className="rounded-full bg-text-primary px-6 py-3 font-bold text-white transition hover:bg-black">Try Kaka for Free</Link>
                <span className="text-sm font-semibold text-mint-dark">No account or payment required.</span>
              </div>
            </div>
          </details>

          <div className="mx-auto max-w-3xl space-y-4 pt-2">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-gray-100 bg-white px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-text-primary">{question}<span className="text-xl text-coral transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 pr-8 leading-relaxed text-text-secondary">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
