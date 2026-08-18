'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-coral/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-white px-4 py-2 text-sm font-semibold text-coral shadow-sm">
            <span aria-hidden="true">🐾</span>
            Free desktop pet for Windows &amp; Mac
          </span>

          <h1 className="mt-6 max-w-2xl font-display text-5xl font-extrabold leading-[1.05] text-text-primary sm:text-6xl lg:text-7xl">
            Meet Kaka, Your Free Desktop Dog
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            Download Kaka, DeskBub&apos;s official desktop pet, and let him hang out on your screen. No account required. Want to see your own pet instead? Turn one real photo into a custom animated companion.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/download" className="rounded-full bg-coral px-7 py-3.5 text-center text-base font-bold text-white shadow-xl shadow-coral/25 transition hover:-translate-y-0.5 hover:bg-coral-dark">
              Download Kaka Free
            </Link>
            <Link href="/custom-desktop-pet" className="rounded-full border-2 border-text-primary/10 bg-white px-7 py-3 text-center text-base font-bold text-text-primary transition hover:border-coral/30 hover:text-coral">
              Create My Own Pet
            </Link>
          </div>

          <p className="mt-4 text-sm font-medium text-text-secondary">Kaka is free forever. Custom pets are a one-time purchase.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span>✓ No account for Kaka</span>
            <span>✓ Windows &amp; macOS</span>
            <span>✓ No subscription</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }} className="relative mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#d9e9ff] p-3 shadow-2xl shadow-text-primary/15">
            <div className="relative min-h-[430px] overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-[#9fc5ee] via-[#d8e8f8] to-[#f8d7c5] sm:min-h-[500px]">
              <div className="absolute left-5 top-5 flex gap-2"><span className="h-3 w-3 rounded-full bg-[#ff6b6b]" /><span className="h-3 w-3 rounded-full bg-[#ffd166]" /><span className="h-3 w-3 rounded-full bg-[#4ecdc4]" /></div>
              <div className="absolute left-6 top-14 rounded-xl bg-white/70 px-4 py-3 text-xs font-semibold text-text-secondary shadow-sm backdrop-blur">Today&apos;s tiny coworker</div>
              <video className="absolute inset-x-0 bottom-7 mx-auto h-[88%] w-[88%] object-contain drop-shadow-[0_22px_26px_rgba(45,52,54,0.28)]" src="/media/kaka/kaka-happy.webm" autoPlay loop muted playsInline aria-label="Kaka, the free DeskBub desktop pet, moving on a desktop" />
              <div className="absolute bottom-5 left-5 rounded-full bg-text-primary px-4 py-2 text-sm font-bold text-white shadow-lg">Kaka is included free</div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl sm:right-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">One real dog</p>
            <p className="mt-1 font-display text-lg font-bold text-text-primary">Now on your desktop</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
