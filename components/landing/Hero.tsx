'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-coral/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-white px-4 py-2 text-sm font-semibold text-coral shadow-sm">
            <span aria-hidden="true">🐾</span>
            Desktop companions for every kind of pet
          </span>

          <h1 className="mt-6 max-w-2xl font-display text-5xl font-extrabold leading-[1.05] text-text-primary sm:text-6xl lg:text-7xl">
            Bring Any Pet to Life on Your Desktop
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            Upload one photo of your dog, cat, rabbit, bird, or other pet and turn them into an animated desktop companion. Or use Kaka for free with five actions and gentle break reminders.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/upload" className="rounded-full bg-coral px-7 py-3.5 text-center text-base font-bold text-white shadow-xl shadow-coral/25 transition hover:-translate-y-0.5 hover:bg-coral-dark">
              Upload a Pet Photo
            </Link>
            <Link href="/download" className="rounded-full border-2 border-text-primary/10 bg-white px-7 py-3 text-center text-base font-bold text-text-primary transition hover:border-coral/30 hover:text-coral">
              Use Kaka for Free
            </Link>
          </div>

          <p className="mt-4 text-sm font-medium text-text-secondary">Custom pets start at $1. Kaka comes with DeskBub at no cost.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span>✓ Cats, dogs &amp; other pets</span>
            <span>✓ Windows &amp; macOS</span>
            <span>✓ No subscription</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }} className="relative mx-auto w-full max-w-2xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#cfe1f6] p-3 shadow-2xl shadow-text-primary/15">
            <div className="relative min-h-[430px] overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-[#8eb8e5] via-[#cbdcf1] to-[#f2c9bb] sm:min-h-[500px]">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 72% 20%, rgba(255,255,255,.8), transparent 24%), linear-gradient(145deg, transparent 58%, rgba(73,105,143,.18) 58%)' }} />

              <div className="absolute left-5 top-5 z-20 rounded-lg bg-text-primary/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur">
                Your actual desktop
              </div>

              <div className="absolute left-[7%] top-[18%] h-[57%] w-[67%] overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-2xl">
                <div className="flex h-9 items-center gap-2 border-b border-gray-100 bg-[#f7f9fb] px-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                  <span className="ml-2 text-[10px] font-semibold text-text-secondary">Work dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[['Tasks', '12'], ['Focus', '48m'], ['Done', '7']].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-[#f4f7fa] p-2">
                      <p className="text-[8px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
                      <p className="mt-1 text-sm font-extrabold text-text-primary">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-3 rounded-lg border border-gray-100 p-3">
                  <div className="mb-3 h-2 w-24 rounded-full bg-gray-100" />
                  <div className="flex h-20 items-end gap-2">
                    {[42, 68, 54, 82, 63, 92].map((height, index) => <span key={height + index} className="flex-1 rounded-t-sm bg-mint/70" style={{ height: `${height}%` }} />)}
                  </div>
                </div>
              </div>

              <div className="absolute right-4 top-[12%] z-30 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 text-left shadow-xl">
                <p className="text-xs font-bold text-text-primary">Water break? 💧</p>
                <p className="mt-0.5 text-[10px] text-text-secondary">Kaka can remind you.</p>
              </div>

              <video className="absolute bottom-3 right-3 z-20 h-[58%] w-[42%] object-contain drop-shadow-[0_22px_26px_rgba(45,52,54,0.30)]" src="/media/kaka/kaka-happy.webm" autoPlay loop muted playsInline aria-label="Kaka moving above an open app on a computer desktop" />

              <div className="absolute inset-x-0 bottom-0 z-30 flex h-11 items-center justify-center gap-2 border-t border-white/60 bg-white/75 shadow-[0_-6px_20px_rgba(36,48,58,.08)] backdrop-blur-md">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-[#e9f1f9] text-xs">⊞</span>
                <span className="h-7 w-24 rounded-md bg-white/90 shadow-sm" />
                <span className="h-7 w-7 rounded-md bg-[#e9f1f9]" />
                <span className="h-7 w-7 rounded-md bg-[#e9f1f9]" />
                <span className="h-7 w-7 rounded-md bg-coral/20" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 px-2 text-sm">
            <p className="font-bold text-text-primary">The pet floats above your apps—not inside a video.</p>
            <span className="shrink-0 rounded-full bg-mint/15 px-3 py-1.5 text-xs font-bold text-mint-dark">Kaka included with DeskBub</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
