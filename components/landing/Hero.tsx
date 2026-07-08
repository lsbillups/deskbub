'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-coral bg-coral/10 rounded-full">
            🎉 Your real pet, now on your desktop
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-text-primary leading-tight">
            Your Real Pet,{' '}
            <span className="text-coral">Alive</span> on Your Desktop
          </h1>

          <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-lg">
            Upload a photo. AI removes the background. Your furry friend
            appears on your screen — napping, stretching, and gently reminding
            you to drink water and take breaks. Not a cartoon. Your actual pet.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-up"
              className="px-7 py-3.5 text-base font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 hover:shadow-coral/50"
            >
              Upload Your Pet — It&apos;s Free
            </Link>
            <a
              href="#how-it-works"
              className="px-7 py-3.5 text-base font-medium text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-coral/10 via-mint/10 to-coral/5 border border-coral/20 flex items-center justify-center overflow-hidden shadow-2xl shadow-coral/10">
            <div className="text-center p-8">
              <div className="text-8xl mb-4">🐶</div>
              <p className="text-sm text-text-secondary font-medium">Your pet lives here</p>
              <p className="text-xs text-text-secondary/60 mt-1">Demo coming soon</p>
            </div>
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-coral/5 via-mint/5 to-coral/5 blur-2xl -z-10" />
        </motion.div>

      </div>
    </section>
  );
}
