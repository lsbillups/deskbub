'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

      </div>
    </section>
  );
}
